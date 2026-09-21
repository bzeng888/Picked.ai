# Odds Engine — Vite + React

## Admin config persistence

The Admin Dashboard's theme, copy, and scoring-weight edits apply live to the app immediately (as before), but only persist across page reloads once you click **Save Changes** — which writes the config to `localStorage` under the key `odds-engine-admin-config-v1`. **Reset to Defaults** clears that storage key and restores the original config. An "Unsaved changes" badge appears in the Admin header whenever the live config differs from what's actually saved, so it's clear when a reload would lose your edits.

## Scenario Calculator ("What-If Simulator")

A fourth top-level tab that starts from a candidate's actual submitted intake + resume results and lets them live-adjust five levers to see the effect on their probability:

1. Target Firm Tier (segmented control, using the sector's own tier names)
2. Application Timing (now four stages: Early/On-Cycle, Standard Window, Late Submission, Off-Cycle)
3. Office Location Tier (Tier-1 Hub vs. Regional/Secondary)
4. Networking / Referral Status (Cold Apply vs. Warm Contact/Referral — a flat +8% bonus, since this lever isn't part of the formal intake)
5. Resume / Skill Alignment Multiplier (0–25% slider layered on top of the real extracted keyword-match fraction, capped at 100%)

Under the hood, `computeScenarioTotal()` reuses the exact same `computeScore()` engine the Results Dashboard uses (same sector base rate, level/visa/GPA/consulting-bridge factors held at the candidate's real baseline) with only the four relevant fields overridden, then layers the referral bonus on top — so the calculator's baseline always matches the Results Dashboard exactly, and it automatically reflects live Admin weight changes since it reads `config.weights` the same way.

Each lever shows a live two-sentence rationale card, and the right-hand panel shows a live gauge plus a delta vs. baseline (`+12% Net Increase` / `-8% Net Decrease`).

## Consulting Background Bridge classifier

`classifyConsultingBridge()` is a dedicated function that scans the parsed resume text for:
- **Named consulting firms/tiers:** McKinsey, BCG, Bain (MBB); Deloitte, PwC, EY, KPMG (Big 4); Oliver Wyman, L.E.K., Roland Berger, Strategy&, Accenture Strategy (Tier-2 Strategy)
- **Consulting skill terms:** management consulting, client advisory, cross-functional leadership, project management, financial modeling, due diligence, market entry, valuation, operations, business transformation, plus the existing case-study/frameworks/stakeholder set

All keyword matching (this classifier, sector keywords, firm tiers) now uses word-boundary matching (`containsKeyword`) instead of plain substring search, so short tokens like "EY" no longer false-match inside unrelated words like "they."

When a bridge is detected for a non-consulting target sector, it:
- Applies an explicit **+10% to +20%** positive score modifier (scaled by how many bridge terms were found), shown as its own line item under Leadership & Track Record
- Shows a **"Consulting Background Bridge: Detected"** callout with the subtext *"Recognized strategy/advisory experience with transferable skill alignment"* in both the Extracted Data Preview (Assessment Step 3) and the Results Dashboard

## Scoring calibration notes

- **Consulting Background Bridge** is a new positive factor: prior consulting-flavored resume content (case work, frameworks, client engagement, cross-functional/project delivery) now scores as its own lever when targeting IB/PE/RE, instead of only showing up as a level-mismatch penalty.
- **Education / GPA Alignment** is a new positive factor when a GPA is detected in the parsed document (scaled above a 3.0 baseline).
- The "Experienced / Mid-Career" and "Associate" level penalties were softened (previously -8%/-5%, now -5%/-4%) since a flat lateral-hire penalty was overweighting cross-industry moves.
- Positive factors on the Results Dashboard are now grouped into three categories — **Prestige & Brand**, **Technical / Analytical Keywords**, **Leadership & Track Record** — as expandable sections, and a "Strength Highlights" box appears automatically when consulting-bridge skills are detected for a non-consulting target sector.

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
