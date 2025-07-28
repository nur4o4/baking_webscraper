# Baking Scraper - Recipe Ingredient & Instruction Extractor

A PWA that extracts recipe ingredients and instructions from any URL, with click-to-check ingredients and customizable scaling for baking ratios.

## Features

- **Recipe Extraction**: Paste any recipe URL and automatically extract ingredients and instructions
- **Ingredient Scaling**: Customize recipe quantities with a simple number input (e.g., 0.5x, 2x, 3x)
- **Click-to-Check**: Click ingredients to cross them off as you bake
- **Serving Display**: Shows original and scaled serving amounts
- **PWA Support**: Install as a native app on Chromebooks and other devices

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/nur4o4/baking_webscraper.git
   cd baking_webscraper
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the frontend**:
   ```bash
   npm run build
   ```

4. **Generate the service worker** (for PWA functionality):
   ```bash
   npx workbox generateSW workbox-config.cjs
   ```

## Usage

### Development Mode

1. **Start the backend server**:
   ```bash
   npm run start:server
   ```

2. **In a separate terminal, start the frontend dev server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** and go to `http://localhost:5173`

### Production Mode (Recommended for PWA)

1. **Build the frontend**:
   ```bash
   npm run build
   ```

2. **Generate the service worker**:
   ```bash
   npx workbox generateSW workbox-config.cjs
   ```

3. **Start the production server**:
   ```bash
   npm run start:server
   ```

4. **Open your browser** and go to `http://localhost:3001`

## Installing as a PWA

1. Open the app in Chrome
2. Look for the install icon in the address bar (computer with down arrow)
3. Click "Install" to add to your device's app launcher
4. The app will now work offline and appear as a native app

## Supported Recipe Sites

The app works with most modern recipe websites that use structured data (JSON-LD), including:
- Allrecipes
- JoyFoodSunshine
- Food Network
- Epicurious
- And many more...

## Technical Details

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js with Cheerio for web scraping
- **PWA**: Service Worker for offline functionality
- **Ingredient Parsing**: recipe-ingredient-parser-v2 with Unicode fraction support
- **Scaling**: Real-time quantity calculation with decimal precision

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start:server` - Start production server
- `npm run preview` - Preview production build
- 
---

**Happy Baking! 🍪**
