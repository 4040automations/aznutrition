# AZNutrition

Look up nutrition facts, **Nutri-Score**, NOVA processing level, ingredients, and additives
for any food product — from a **UPC/EAN barcode** or an **Amazon product link**.

Powered by the free & open [Open Food Facts](https://world.openfoodfacts.org) database.

🔗 **Live site:** [aznutrition.4040automations.com](https://aznutrition.4040automations.com/)

## Features

- 🔎 **Smart search** — paste a barcode or Amazon link; the input type is auto-detected.
- 🟢 **Nutri-Score** A–E grading with color-coded badges, plus NOVA & Eco-Score.
- 🧪 **Ingredients & additives** with plain-language notes from Open Food Facts panels.
- 🗂️ **Recent searches sidebar** — persisted in your browser (localStorage), with thumbnails and grades.
- 🛒 **Amazon fallback** — if a link has no barcode, it searches by brand instead.
- 📱 Responsive, dark, accessible UI with skeleton loaders.

## Tech stack

- [Next.js 14](https://nextjs.org/) (App Router) + React 18 + TypeScript
- Tailwind CSS design system
- App Router route handlers for the API (`/api/product`, `/api/brand`, `/api/amazon`)
- `axios` + `cheerio` for Amazon page parsing (server-side only)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build && npm start   # production build
```

## Project structure

```
app/
  api/            Route handlers (product, brand, amazon)
  layout.tsx      Root layout, metadata, fonts
  page.tsx        Client orchestrator (search → detail / grid)
  globals.css     Design tokens + Open Food Facts panel styling
components/        UI: Sidebar, SearchBar, ProductDetail, ProductGrid, …
lib/
  off.ts          Client data layer + input classifier
  types.ts        Shared domain types
  nutriscore.ts   Grade/NOVA helpers
  useRecentSearches.ts  localStorage-backed recent-search store
```

## Notes

- Amazon actively blocks automated requests, so link lookups can fail intermittently the app gracefully falls back to a brand search or prompts for the barcode.
- Nutrition data quality depends on Open Food Facts community contributions.
