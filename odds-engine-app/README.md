# Odds Engine — Vite + React

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build   # outputs to dist/
npm run preview # serve the build locally to sanity-check it
```

## Deploying to Vercel

1. Push this folder to a GitHub repo (make sure `package.json` is at the **repo root**, not nested inside a subfolder — a nested root is the #1 cause of Vercel 404s on this kind of project).
2. In Vercel, "Add New Project" → import the repo.
3. Framework Preset: **Vite** (Vercel auto-detects this from `package.json` + `vite.config.js`; if it doesn't, set it manually).
   - Build Command: `npm run build` (or `vite build`)
   - Output Directory: `dist`
   - Install Command: `npm install` (default)
4. Deploy. Vercel serves `dist/index.html` for every route once the build succeeds — no `vercel.json` rewrite rules are needed for this single-page app.
