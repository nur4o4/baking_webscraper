import { useState } from 'react';
import './App.css';

interface Ingredient {
  quantity: number | null;
  unit: string | null;
  ingredient: string;
  original: string;
}

function App() {
  const [url, setUrl] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [servings, setServings] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scale, setScale] = useState(1);
  const [checked, setChecked] = useState<Set<number>>(new Set());

  // Helper to get numeric servings
  const getNumericServings = (val: string | null) => {
    if (!val) return null;
    const match = val.match(/\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : null;
  };

  const fetchRecipe = async () => {
    setLoading(true);
    setError('');
    setIngredients([]);
    setInstructions([]);
    setServings(null);
    try {
      const res = await fetch('/api/parse-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setIngredients(data.ingredients);
      setInstructions(data.instructions);
      setServings(data.servings || null);
      setScale(1); // reset scale on new recipe
    } catch (e: any) {
      setError(e.message || 'Failed to fetch recipe');
    } finally {
      setLoading(false);
    }
  };

  // Scaled servings
  const numericServings = getNumericServings(servings);
  const scaledServings = numericServings !== null ? (numericServings * scale).toFixed(2) : null;

  return (
    <div className="container">
      <h1>Baking Assistant👩🏻‍🍳 *ੈ✩‧</h1>
      <form
        onSubmit={e => {
          e.preventDefault();
          fetchRecipe();
        }}
        style={{ marginBottom: 16 }}
      >
        <input
          type="url"
          placeholder="Paste recipe URL . . . "
          value={url}
          onChange={e => setUrl(e.target.value)}
          style={{ width: 320, marginRight: 8 }}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Fetch Recipe'}
        </button>
      </form>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {ingredients.length > 0 && (
        (() => {
          console.log('FRONTEND INGREDIENTS:', ingredients);
          return (
            <div>
              {servings && (
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                  Servings: {scaledServings || servings} {scale !== 1 && servings ? <span style={{ fontWeight: 'normal' }}>(original: {servings})</span> : null}
                </div>
              )}
              <h2>Ingredients</h2>
              <div style={{ marginBottom: 8 }}>
                <span>📏Scale: </span>
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={scale}
                  onChange={e => setScale(Number(e.target.value) || 1)}
                  style={{ width: 60, marginRight: 8 }}
                />
                <span>x</span>
              </div>

              <ul>
                {ingredients.map((ing, i) => {
                  let qty = null;
                  if (typeof ing.quantity === 'number') qty = ing.quantity;
                  else if (typeof ing.quantity === 'string' && ing.quantity) qty = parseFloat(ing.quantity);
                  const isChecked = checked.has(i);
                  return (
                    <li
                      key={i}
                      onClick={() => {
                        setChecked(prev => {
                          const next = new Set(prev);
                          if (next.has(i)) next.delete(i);
                          else next.add(i);
                          return next;
                        });
                      }}
                      style={{
                        cursor: 'pointer',
                        textDecoration: isChecked ? 'line-through' : 'none',
                        color: isChecked ? '#aaa' : undefined,
                      }}
                    >
                      {qty !== null && !isNaN(qty) ? <b>{(qty * scale).toFixed(3).replace(/\.0+$/, '')}</b> : null}
                      {ing.unit ? ` ${ing.unit}` : ''}
                      {ing.ingredient ? ` ${ing.ingredient}` : ing.original}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })()
      )}
      {instructions.length > 0 && (
        <div>
          <h2>Instructions</h2>
          <ol>
            {instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default App;
