import express from 'express';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import { parse } from 'recipe-ingredient-parser-v2';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Helper: minimal deduplication and whitespace trim (do NOT remove symbols or numbers)
function cleanListSimple(list) {
  const seen = new Set();
  return list
    .map(line => line.trim())
    .filter(line => {
      const l = line.toLowerCase();
      if (!line || seen.has(l)) return false;
      seen.add(l);
      return true;
    });
}

// Helper: check if @type contains Recipe
function isRecipeType(type) {
  if (!type) return false;
  if (typeof type === 'string') return type.toLowerCase() === 'recipe';
  if (Array.isArray(type)) return type.map(t => t.toLowerCase()).includes('recipe');
  return false;
}

// Helper to extract ingredients and instructions from a recipe page
async function extractRecipeData(url) {
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);

  let ingredients = [];
  let instructions = [];
  let servings = null;

  // Prefer schema.org JSON-LD, including @graph arrays and @type as array
  const ldJsonBlocks = $('script[type="application/ld+json"]').toArray();
  for (const el of ldJsonBlocks) {
    try {
      const data = JSON.parse($(el).html());
      // Handle @graph arrays
      let recipes = [];
      if (Array.isArray(data)) {
        recipes = data.filter(d => isRecipeType(d['@type']));
      } else if (isRecipeType(data['@type'])) {
        recipes = [data];
      } else if (data['@graph']) {
        recipes = data['@graph'].filter(d => isRecipeType(d['@type']));
      }
      for (const recipe of recipes) {
        if (recipe.recipeIngredient && ingredients.length === 0) ingredients = recipe.recipeIngredient;
        if (recipe.recipeInstructions && instructions.length === 0) {
          if (Array.isArray(recipe.recipeInstructions)) {
            instructions = recipe.recipeInstructions.map(i => (typeof i === 'string' ? i : i.text || i));
          } else if (typeof recipe.recipeInstructions === 'string') {
            instructions = [recipe.recipeInstructions];
          }
        }
        if (recipe.recipeYield && !servings) {
          servings = Array.isArray(recipe.recipeYield) ? recipe.recipeYield[0] : recipe.recipeYield;
        }
      }
    } catch {}
  }

  // Allrecipes-specific selectors (and similar sites)
  if (ingredients.length === 0) {
    ingredients = $('.ingredients-section li, [data-ingredient], [itemprop="recipeIngredient"], .ingredient, .ingredients-list li, .ingredients li').map((i, el) => $(el).text()).get();
  }
  if (instructions.length === 0) {
    instructions = $('.instructions-section li, [data-instruction], [itemprop="recipeInstructions"], .instruction, .instructions-list li, .directions li, .method li, ol li, ul.instructions li').map((i, el) => $(el).text()).get();
  }

  // Clean and deduplicate
  ingredients = cleanListSimple(ingredients);
  instructions = cleanListSimple(instructions);

  // Debug: log raw ingredient lines
  console.log('RAW INGREDIENTS:', ingredients);

  // Parse ingredients
  const parsedIngredients = ingredients.map(line => parseIngredientLine(line));

  // If nothing found, return a clear error
  if (parsedIngredients.length === 0 || instructions.length === 0) {
    throw new Error('Could not extract recipe details from this page.');
  }

  return { ingredients: parsedIngredients, instructions, servings };
}

// Helper: normalize unicode fractions to decimals
function normalizeFractions(str) {
  return str
    .replace(/¼/g, '1/4')
    .replace(/½/g, '1/2')
    .replace(/¾/g, '3/4')
    .replace(/⅐/g, '1/7')
    .replace(/⅑/g, '1/9')
    .replace(/⅒/g, '1/10')
    .replace(/⅓/g, '1/3')
    .replace(/⅔/g, '2/3')
    .replace(/⅕/g, '1/5')
    .replace(/⅖/g, '2/5')
    .replace(/⅗/g, '3/5')
    .replace(/⅘/g, '4/5')
    .replace(/⅙/g, '1/6')
    .replace(/⅚/g, '5/6')
    .replace(/⅛/g, '1/8')
    .replace(/⅜/g, '3/8')
    .replace(/⅝/g, '5/8')
    .replace(/⅞/g, '7/8');
}

// Helper: parse ingredient with fallback regex for quantity, after normalizing unicode fractions
function parseIngredientLine(line) {
  const normalized = normalizeFractions(line);
  const parsed = parse(normalized);
  // If quantity is missing, try to extract it manually
  if (parsed.quantity === null || typeof parsed.quantity === 'undefined') {
    // Match mixed fractions (e.g., 1 1/4), simple fractions (e.g., 1/2), or decimals
    const match = normalized.match(/^([\d\s\/\.]+)\s+(.*)$/);
    if (match) {
      let qtyStr = match[1].trim();
      // Convert mixed fraction to decimal
      let qty = null;
      if (/\d+\s+\d+\/\d+/.test(qtyStr)) {
        // e.g., 1 1/4
        const [whole, frac] = qtyStr.split(' ');
        const [num, den] = frac.split('/');
        qty = parseInt(whole) + parseInt(num) / parseInt(den);
      } else if (/\d+\/\d+/.test(qtyStr)) {
        // e.g., 1/4
        const [num, den] = qtyStr.split('/');
        qty = parseInt(num) / parseInt(den);
      } else if (/\d+(\.\d+)?/.test(qtyStr)) {
        qty = parseFloat(qtyStr);
      }
      parsed.quantity = qty;
      parsed.ingredient = match[2];
    }
  }
  parsed.original = line;
  return parsed;
}

app.post('/api/parse-recipe', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing url' });
  try {
    const data = await extractRecipeData(url);
    res.json(data);
  } catch (e) {
    console.error(e); // <-- Add this for debugging
    res.status(500).json({ error: 'Failed to parse recipe', details: e.stack || e.message });  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 