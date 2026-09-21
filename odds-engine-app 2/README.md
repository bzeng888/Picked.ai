# Odds Engine — Vite + React

## Resume parsing

Step 3 of the assessment now does **real client-side text extraction**:
- `.pdf` → `pdfjs-dist` (loads pages, concatenates text content items)
- `.docx` → `mammoth` (`extractRawText`)
- legacy `.doc` (binary format) isn't parseable in-browser and shows a clear message asking for PDF/.docx instead
- nothing is uploaded anywhere — parsing happens entirely in the visitor's browser

The pdf.js worker is loaded via Vite's `?url` import (`pdfjs-dist/build/pdf.worker.min.mjs?url`), which Vite bundles automatically — no extra config needed.

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
