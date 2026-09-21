
import React, { useState, useEffect, useMemo, useContext, createContext, useRef } from "react";
import {
  SlidersHorizontal, LayoutGrid, FileText, Gauge as GaugeIcon, ArrowRight, ChevronLeft, ChevronRight,
  Upload, Check, Building2, Briefcase, Landmark, Home as HomeIcon, Copy, AlertTriangle, ArrowDown,
  Lock, Eye, EyeOff, X, Settings,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

/* ============================== ICONS ============================== */
const ICON_MAP = {
  sliders: SlidersHorizontal, layout: LayoutGrid, file: FileText, gauge: GaugeIcon,
  arrowRight: ArrowRight, chevronLeft: ChevronLeft, chevronRight: ChevronRight, upload: Upload,
  check: Check, building: Building2, briefcase: Briefcase, landmark: Landmark, home: HomeIcon,
  copy: Copy, alert: AlertTriangle, arrowDown: ArrowDown, lock: Lock, eye: Eye, eyeOff: EyeOff,
  x: X, gear: Settings,
};
function Icon({ name, size = 18, className = "", strokeWidth = 1.8 }) {
  const Cmp = ICON_MAP[name];
  if (!Cmp) return null;
  return <Cmp size={size} strokeWidth={strokeWidth} className={className} />;
}

/* ============================== DOMAIN DATA ============================== */
const SECTORS = [
  { key: "ib", label: "Investment Banking", icon: "landmark", baseWeight: 0.5,
    tiers: ["Bulge Bracket", "Elite Boutique", "Middle Market"],
    keywords: ["dcf","lbo","valuation","m&a","financial modeling","pitch book","comps","equity research","capital markets"],
    peerBenchmark: 24 },
  { key: "consulting", label: "Management Consulting", icon: "briefcase", baseWeight: 0.6,
    tiers: ["MBB", "Tier-2 Strategy", "Big 4 Consulting"],
    keywords: ["case study","hypothesis-driven","frameworks","stakeholder","strategy","market sizing","client engagement"],
    peerBenchmark: 29 },
  { key: "pe", label: "Private Equity", icon: "building", baseWeight: 0.22,
    tiers: ["Mega-Fund", "Upper Middle Market", "Growth Equity"],
    keywords: ["deal sourcing","underwriting","irr","due diligence","portfolio company","buyout","capital structure","value creation"],
    peerBenchmark: 14 },
  { key: "re", label: "Real Estate Investment", icon: "home", baseWeight: 0.85,
    tiers: ["Institutional REPE", "Regional Developer", "Brokerage / Advisory"],
    keywords: ["cap rate","noi","acquisitions","underwriting","development","asset management","pro forma","entitlement"],
    peerBenchmark: 34 },
];
const LEVELS = [
  { key: "intern", label: "Internship", adj: 8 },
  { key: "entry", label: "Entry-Level / Analyst", adj: 0 },
  { key: "associate", label: "Associate", adj: -4 },
  { key: "experienced", label: "Experienced / Mid-Career", adj: -5 },
];
const OFFICES = [
  { key: "tier1", label: "Tier-1 Hub (NYC, London, SF, HK)", adj: -4 },
  { key: "tier2", label: "Secondary Regional Office", adj: 6 },
];
const CYCLES = [
  { key: "peak", label: "Peak Campus Cycle (Jun–Sep)", factor: 0 },
  { key: "off", label: "Off-Cycle (Oct–Jan)", factor: 0.5 },
  { key: "late", label: "Late / Rolling (Feb–May)", factor: 1 },
];
const VISAS = [
  { key: "citizen", label: "US Citizen — No Sponsorship Needed", factor: 0 },
  { key: "pr", label: "Permanent Resident", factor: 0 },
  { key: "opt", label: "OPT / CPT (Time-Limited)", factor: 0.5 },
  { key: "sponsor", label: "Requires Employer Sponsorship (H-1B, etc.)", factor: 1 },
];

/* ============================== THEME SYSTEM ============================== */
const PRESETS = {
  wallStreetNavy: { label: "Wall Street Navy", primary: "#0E1A2B", accent: "#B08D57", mode: "dark" },
  consultingTeal: { label: "Consulting Teal", primary: "#0B2523", accent: "#3FB6A0", mode: "dark" },
  siliconDark: { label: "Silicon Dark", primary: "#111318", accent: "#6C8CFF", mode: "dark" },
  minimalSlate: { label: "Minimal Slate", primary: "#F3F3F1", accent: "#33383F", mode: "light" },
};
const RADII = { sharp: "3px", subtle: "10px", rounded: "22px" };
const CARD_STYLES = ["flatBordered", "elevatedShadow", "glassmorphism"];
const FONT_THEMES = {
  serifSans: { label: "Serif Display / Sans Body", display: "'Source Serif 4', Georgia, serif", body: "'Inter', system-ui, sans-serif" },
  allSans: { label: "All Sans", display: "'Inter', system-ui, sans-serif", body: "'Inter', system-ui, sans-serif" },
  monoTech: { label: "Mono Display / Sans Body", display: "'IBM Plex Mono', monospace", body: "'Inter', system-ui, sans-serif" },
};
const FONT_MONO = "'IBM Plex Mono', monospace";

function mix(hexA, hexB, t) {
  const a = hexA.replace("#", ""), b = hexB.replace("#", "");
  const ar = parseInt(a.substring(0,2),16), ag = parseInt(a.substring(2,4),16), ab = parseInt(a.substring(4,6),16);
  const br = parseInt(b.substring(0,2),16), bg = parseInt(b.substring(2,4),16), bb = parseInt(b.substring(4,6),16);
  const r = Math.round(ar + (br-ar)*t), g = Math.round(ag + (bg-ag)*t), bl = Math.round(ab + (bb-ab)*t);
  return `rgb(${r}, ${g}, ${bl})`;
}
function relLuminance(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0,2),16)/255, g = parseInt(h.substring(2,4),16)/255, b = parseInt(h.substring(4,6),16)/255;
  return 0.2126*r + 0.7152*g + 0.0722*b;
}

const AdminContext = createContext(null);
function useAdmin() { return useContext(AdminContext); }

function useTokens(config) {
  return useMemo(() => {
    const mode = config.theme.mode || (relLuminance(config.theme.primary) > 0.55 ? "light" : "dark");
    const primary = config.theme.primary;
    const accent = config.theme.accent;
    const isDark = mode === "dark";
    const bg = primary;
    const surface = isDark ? mix(primary, "#ffffff", 0.09) : "#FFFFFF";
    const surfaceRaised = isDark ? mix(primary, "#ffffff", 0.14) : mix(primary, "#000000", 0.03);
    const text = isDark ? "#F2F0EA" : "#1A1D21";
    const textMuted = isDark ? "rgba(242,240,234,0.64)" : "rgba(26,29,33,0.62)";
    const border = isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)";
    const positive = isDark ? "#7FCB9E" : "#2F6B48";
    const negative = isDark ? "#E5936F" : "#9C4B32";
    const radius = RADII[config.theme.radius] || RADII.subtle;
    const fonts = FONT_THEMES[config.theme.font] || FONT_THEMES.serifSans;
    return { mode, primary, accent, bg, surface, surfaceRaised, text, textMuted, border, positive, negative, radius, fonts };
  }, [config.theme]);
}
function cardSx(tokens, style) {
  if (style === "elevatedShadow") {
    return { background: tokens.surface, borderRadius: tokens.radius, border: "1px solid transparent",
      boxShadow: tokens.mode === "dark" ? "0 16px 40px -18px rgba(0,0,0,0.6)" : "0 16px 40px -18px rgba(20,20,20,0.22)" };
  }
  if (style === "glassmorphism") {
    return { background: tokens.mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.55)",
      backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
      border: `1px solid ${tokens.mode === "dark" ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.5)"}`,
      borderRadius: tokens.radius };
  }
  return { background: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius };
}

/* ============================== SCORING ENGINE ============================== */
const FACTOR_CATEGORIES = {
  PRESTIGE: "Prestige & Brand",
  TECHNICAL: "Technical / Analytical Keywords",
  LEADERSHIP: "Leadership & Track Record",
};
function computeScore(answers, weights) {
  const sector = SECTORS.find(s => s.key === answers.sector) || SECTORS[0];
  const tierIndex = answers.tierIndex ?? 0;
  const tierAdj = tierIndex === 0 ? -3 : tierIndex === 1 ? 0 : 5;
  const level = LEVELS.find(l => l.key === answers.level) || LEVELS[1];
  const office = OFFICES.find(o => o.key === answers.office) || OFFICES[0];
  const cycle = CYCLES.find(c => c.key === answers.cycle) || CYCLES[0];
  const visa = VISAS.find(v => v.key === answers.visa) || VISAS[0];

  const base = Math.round(weights.baseRate * sector.baseWeight * 10) / 10;
  const resumeMatch = answers.resumeMatch ?? 0.4;
  const resumeBoost = Math.round(resumeMatch * weights.targetSchoolBoost * 10) / 10;
  const timingPenalty = Math.round(cycle.factor * weights.timingPenaltyScale * 10) / 10;
  const visaPenalty = Math.round(visa.factor * weights.visaPenalty * 10) / 10;

  // Education / GPA alignment — a detected GPA above a 3.0 baseline reads as a positive brand/prestige signal.
  const gpaValue = answers.gpaValue ?? null;
  const eduBoost = gpaValue ? Math.max(0, Math.min(10, Math.round((gpaValue - 3.0) * 12))) : 0;

  // Consulting background bridge — prior consulting experience is a genuine asset moving into IB/PE/RE,
  // not a level-mismatch problem, so it's scored as its own positive lever rather than folded into penalties.
  const bridgeMatches = sector.key !== "consulting" ? (answers.bridgeMatches || []) : [];
  const bridgeFraction = Math.min(1, bridgeMatches.length / 5);
  const bridgeBoost = bridgeMatches.length > 0 ? Math.round(bridgeFraction * weights.targetSchoolBoost) : 0;

  const factors = [
    { label: "Firm / Fund Tier", value: tierAdj, note: sector.tiers[tierIndex], category: FACTOR_CATEGORIES.PRESTIGE },
    { label: "Office Market", value: office.adj, note: office.label, category: FACTOR_CATEGORIES.PRESTIGE },
    { label: "Education / GPA Alignment", value: eduBoost,
      note: gpaValue ? `GPA ${gpaValue.toFixed(2)} detected` : "No GPA detected in document", category: FACTOR_CATEGORIES.PRESTIGE },
    { label: "Resume Keyword Alignment", value: resumeBoost, note: `${Math.round(resumeMatch * 100)}% match`, category: FACTOR_CATEGORIES.TECHNICAL },
    { label: "Consulting Background Bridge", value: bridgeBoost,
      note: bridgeMatches.length ? `${bridgeMatches.length} bridge skill${bridgeMatches.length === 1 ? "" : "s"} found` : "No consulting background detected",
      category: FACTOR_CATEGORIES.LEADERSHIP },
    { label: "Role Level Fit", value: level.adj, note: level.label, category: FACTOR_CATEGORIES.LEADERSHIP },
    { label: "Application Timing", value: -timingPenalty, note: cycle.label, category: null },
    { label: "Visa / Work Authorization", value: -visaPenalty, note: visa.label, category: null },
  ];
  const total = Math.max(1, Math.min(97, Math.round(base + factors.reduce((s,f)=>s+f.value,0))));
  let band = "Highly Unlikely";
  if (total > 60) band = "Strong Shot";
  else if (total > 35) band = "Competitive";
  else if (total > 15) band = "Reach";
  return { total, band, base, factors, sector, bridgeMatches, gpaValue };
}
function buildActionPlan(result) {
  const items = [];
  const f = (label) => result.factors.find(x => x.label === label);
  if (f("Application Timing").value < 0) items.push("Shift your applications toward the peak campus cycle — off-cycle and late submissions carry a real, measurable penalty at this tier.");
  if (f("Visa / Work Authorization").value < 0) items.push("Prioritize firms and offices with a track record of sponsorship, or line up OPT-eligible roles as a parallel track.");
  if (f("Resume Keyword Alignment").value < 6) items.push("Rework your resume to surface more sector-specific language — early-stage screening is pattern-matching on exact terminology.");
  if (f("Office Market").value < 0) items.push("Widen your search to secondary-market offices, where seats per applicant run meaningfully higher.");
  if (f("Role Level Fit").value < 0) items.push("Lateral and experienced-hire seats are scarce — a warm referral matters more here than at the entry level.");
  if (f("Firm / Fund Tier").value < 0) items.push("This is the most selective tier in the sector — build a parallel pipeline of tier-two firms as ballast.");
  items.push("Get a warm introduction wherever possible — it remains the single highest-leverage lever across every sector here.");
  return items.slice(0, 5);
}
function buildStrengthHighlight(result) {
  if (!result.bridgeMatches || result.bridgeMatches.length === 0 || result.sector.key === "consulting") return null;
  const skills = result.bridgeMatches.map(prettyKeyword).slice(0, 4).join(", ");
  return `Your consulting background is a genuine asset here, not a mismatch. ${skills} translate directly into what ${result.sector.label} recruiters screen for — structured problem-solving under time pressure, cross-functional project delivery, and client-facing communication. Lead with these explicitly in your resume and interviews rather than assuming the tier gap speaks for itself.`;
}
function scanResume(text, sector) {
  if (!text || text.trim().length < 20) return null;
  const t = text.toLowerCase();
  const found = sector.keywords.filter(k => t.includes(k));
  return { fraction: Math.min(1, found.length / sector.keywords.length), found };
}
const KEYWORD_LABELS = {
  dcf: "DCF Valuation", lbo: "LBO Modeling", irr: "IRR Analysis", noi: "NOI Modeling", "m&a": "M&A",
  "cap rate": "Cap Rate Analysis", valuation: "Valuation", comps: "Comparable Companies",
  "equity research": "Equity Research", "capital markets": "Capital Markets", "pitch book": "Pitch Book",
  "financial modeling": "Financial Modeling", "case study": "Case Interviews",
  "hypothesis-driven": "Hypothesis-Driven Problem Solving", frameworks: "Strategic Frameworks",
  stakeholder: "Stakeholder Management", strategy: "Corporate Strategy", "market sizing": "Market Sizing",
  "client engagement": "Client Engagement", "deal sourcing": "Deal Sourcing", underwriting: "Underwriting",
  "due diligence": "Due Diligence", "portfolio company": "Portfolio Company Ops", buyout: "Buyout Structuring",
  "capital structure": "Capital Structure", "value creation": "Value Creation", acquisitions: "Acquisitions",
  development: "Development", "asset management": "Asset Management", "pro forma": "Pro Forma Modeling",
  entitlement: "Entitlements", python: "Python", sql: "SQL", excel: "Advanced Excel", vba: "VBA",
  bloomberg: "Bloomberg Terminal", tableau: "Tableau", consulting: "Consulting",
};
function prettyKeyword(k) {
  return KEYWORD_LABELS[k] || k.replace(/\b\w/g, c => c.toUpperCase());
}
const GENERAL_KEYWORDS = ["python", "sql", "excel", "vba", "bloomberg", "tableau", "consulting"];
const CONSULTING_BRIDGE_KEYWORDS = Array.from(new Set([
  ...(SECTORS.find(s => s.key === "consulting")?.keywords || []),
  "cross-functional", "project management", "client delivery", "change management",
]));
function extractGpaValue(text) {
  const m = text.match(/GPA[:\s]*([0-4]\.\d{1,2})/i) || text.match(/([0-4]\.\d{1,2})\s*\/\s*4\.0+/);
  return m ? parseFloat(m[1]) : null;
}

function isValidResumeFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  return ["pdf", "doc", "docx"].includes(ext);
}

/** Real client-side PDF text extraction via pdfjs-dist. */
async function extractPdfText(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(" ") + "\n";
  }
  return text.trim();
}

/** Real client-side .docx text extraction via mammoth. */
async function extractDocxText(file) {
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return (result.value || "").trim();
}

/** Dispatches to the right parser by extension; throws on unsupported/legacy formats. */
async function extractResumeText(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "pdf") return extractPdfText(file);
  if (ext === "docx") return extractDocxText(file);
  if (ext === "doc") {
    const err = new Error("Legacy .doc files use a binary format that can't be parsed in the browser — please upload a PDF or .docx instead.");
    err.code = "LEGACY_DOC";
    throw err;
  }
  const err = new Error("Unsupported file type.");
  err.code = "UNSUPPORTED";
  throw err;
}

function deriveCandidateName(text, fileName) {
  const firstLine = (text.split("\n").map(l => l.trim()).find(l => l.length > 0)) || "";
  if (firstLine && firstLine.length <= 60) return firstLine;
  const base = (fileName || "").replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
  return base || "Not detected";
}

/** Scans real extracted text for sector + general keywords, target firm tiers, consulting-bridge skills, and light contact/education signals. */
function analyzeResumeText(rawText, sector, fileName) {
  const text = rawText.trim();
  const lower = text.toLowerCase();
  const allKeywords = Array.from(new Set([...sector.keywords, ...GENERAL_KEYWORDS]));
  const matched = allKeywords.filter(k => lower.includes(k));
  const tiersFound = sector.tiers.filter(t => lower.includes(t.toLowerCase()));
  const bridgeMatches = sector.key !== "consulting" ? CONSULTING_BRIDGE_KEYWORDS.filter(k => lower.includes(k)) : [];
  const fraction = Math.min(1, (matched.length + tiersFound.length) / Math.max(6, sector.keywords.length));

  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(\+?\d[\d\-\s().]{7,}\d)/);
  const gpaValue = extractGpaValue(text);
  const eduMatch = text.match(/(B\.?A\.?|B\.?S\.?|Bachelor(?:'s)?|M\.?B\.?A\.?|Master(?:'s)?)[^\n,.;]{0,60}/i);

  return {
    fraction,
    matched: matched.map(prettyKeyword),
    matchCount: matched.length,
    tiersFound,
    bridgeMatches,
    gpaValue,
    wordCount: text.split(/\s+/).filter(Boolean).length,
    name: deriveCandidateName(text, fileName),
    contact: [emailMatch ? emailMatch[0] : null, phoneMatch ? phoneMatch[0].trim() : null].filter(Boolean).join("  ·  ") || "No email or phone number detected",
    education: gpaValue
      ? `${eduMatch ? eduMatch[0].trim() : "Degree detected"} — GPA ${gpaValue.toFixed(2)}`
      : (eduMatch ? eduMatch[0].trim() : "No education section detected"),
    excerpt: text.slice(0, 240) + (text.length > 240 ? "…" : ""),
  };
}


/* ============================== SHARED UI PARTS ============================== */
function SectionLabel({ children, tokens }) {
  return <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.06em", color: tokens.textMuted, marginBottom: 10 }}>{children}</div>;
}
function Btn({ children, onClick, tokens, variant = "solid", className = "", style = {} }) {
  const base = { borderRadius: tokens.radius, fontFamily: tokens.fonts.body, transition: "opacity .15s ease", cursor: "pointer" };
  const solid = { background: tokens.accent, color: tokens.mode === "dark" ? "#12141A" : "#FFFFFF", border: "1px solid transparent" };
  const outline = { background: "transparent", color: tokens.text, border: `1px solid ${tokens.border}` };
  return (
    <button onClick={onClick} className={"px-5 py-2.5 text-sm font-medium hover:opacity-85 " + className}
      style={{ ...base, ...(variant === "solid" ? solid : outline), ...style }}>
      {children}
    </button>
  );
}

/* ============================== NAV ============================== */
function NavBar({ view, setView, tokens, copy }) {
  const tabs = [
    { key: "landing", label: "Home", icon: "layout" },
    { key: "assessment", label: "Odds Calculator", icon: "file" },
    { key: "results", label: "Results Dashboard", icon: "gauge" },
  ];
  return (
    <div style={{ borderBottom: `1px solid ${tokens.border}`, background: tokens.bg }} className="sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        <div style={{ fontFamily: tokens.fonts.display, color: tokens.text, fontSize: 17, fontWeight: 600 }}>
          {copy.brandName}
        </div>
        <div className="flex gap-1">
          {tabs.map(t => {
            const active = view === t.key;
            return (
              <button key={t.key} onClick={() => setView(t.key)}
                className="flex items-center gap-2 px-4 py-2 text-sm"
                style={{
                  color: active ? tokens.text : tokens.textMuted,
                  borderBottom: `2px solid ${active ? tokens.accent : "transparent"}`,
                  fontFamily: tokens.fonts.body,
                }}>
                <Icon name={t.icon} size={15} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================== ADMIN LOCK SCREEN ============================== */
function AdminLockScreen({ tokens, config, onUnlock, embedded }) {
  const [value, setValue] = useState("");
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState(false);
  const inputStyle = { width: "100%", background: tokens.mode === "dark" ? "rgba(255,255,255,0.06)" : "#F5F5F4",
    border: `1px solid ${tokens.border}`, borderRadius: 6, padding: "10px 40px 10px 12px", fontSize: 15,
    color: tokens.text, letterSpacing: "0.15em", fontFamily: FONT_MONO };

  const submit = () => {
    if (value === config.security.passcode) {
      onUnlock();
    } else {
      setError(true);
      setValue("");
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <div className={embedded ? "px-5 py-6" : "max-w-sm mx-auto px-6 py-24"}>
      <div className={error ? "admin-shake" : ""} style={{ ...cardSx(tokens, config.theme.cardStyle), padding: embedded ? 24 : 32 }}>
        <Icon name="lock" size={20} style={{ color: tokens.accent }} className="mb-5" />
        <h2 style={{ fontFamily: tokens.fonts.display, color: tokens.text, fontSize: 19, marginBottom: 8 }}>
          Restricted Access — Admin Settings
        </h2>
        <p style={{ color: tokens.textMuted, fontSize: 13, lineHeight: 1.5, marginBottom: 22 }}>
          Enter your 4 to 8 digit admin passcode to unlock theme, copy, and scoring controls.
        </p>
        <div style={{ position: "relative", marginBottom: 14 }}>
          <input
            type={reveal ? "text" : "password"}
            inputMode="numeric"
            maxLength={8}
            value={value}
            placeholder="••••••"
            onChange={e => setValue(e.target.value.replace(/\s/g, ""))}
            onKeyDown={e => e.key === "Enter" && submit()}
            style={inputStyle}
            autoFocus
          />
          <button onClick={() => setReveal(r => !r)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: tokens.textMuted }}>
            <Icon name={reveal ? "eyeOff" : "eye"} size={16} />
          </button>
        </div>
        {error && (
          <div className="flex items-center gap-2 mb-4" style={{ background: "rgba(220,80,60,0.12)", color: tokens.negative, padding: "8px 12px", borderRadius: 6, fontSize: 12.5 }}>
            <Icon name="alert" size={14} /> Invalid Passcode. Please try again.
          </div>
        )}
        <Btn tokens={tokens} onClick={submit} className="w-full">Unlock Dashboard</Btn>
      </div>
    </div>
  );
}

/* ============================== ADMIN VIEW ============================== */
function AdminView({ config, setConfig, tokens, onLock, embedded, onSaveConfig, onResetDefaults, hasUnsavedChanges }) {
  const [copiedMsg, setCopiedMsg] = useState("");
  const [exportText, setExportText] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  const setTheme = (patch) => setConfig(c => ({ ...c, theme: { ...c.theme, ...patch } }));
  const setCopy = (patch) => setConfig(c => ({ ...c, copy: { ...c.copy, ...patch } }));
  const setWeights = (patch) => setConfig(c => ({ ...c, weights: { ...c.weights, ...patch } }));

  const applyPreset = (key) => {
    const p = PRESETS[key];
    setConfig(c => ({ ...c, theme: { ...c.theme, preset: key, primary: p.primary, accent: p.accent, mode: p.mode } }));
  };

  const handleSaveClick = () => {
    onSaveConfig();
    setActionMsg("Configuration saved successfully!");
    setTimeout(() => setActionMsg(""), 2600);
  };
  const handleResetClick = () => {
    onResetDefaults();
    setActionMsg("Reset to defaults.");
    setTimeout(() => setActionMsg(""), 2600);
  };

  const doExport = () => {
    const cssVars = `:root {
  --c-bg: ${tokens.bg};
  --c-surface: ${tokens.surface};
  --c-accent: ${tokens.accent};
  --c-text: ${tokens.text};
  --radius: ${tokens.radius};
  --font-display: ${tokens.fonts.display};
  --font-body: ${tokens.fonts.body};
}`;
    const payload = JSON.stringify(config, null, 2) + "\n\n/* Tailwind / CSS variables */\n" + cssVars;
    setExportText(payload);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(payload).then(
        () => setCopiedMsg("Copied to clipboard."),
        () => setCopiedMsg("Clipboard blocked — copy manually below.")
      );
    } else {
      setCopiedMsg("Copy manually below.");
    }
  };

  const card = cardSx(tokens, config.theme.cardStyle);
  const label = { fontSize: 12, color: tokens.textMuted, fontFamily: tokens.fonts.body, marginBottom: 6, display: "block" };
  const input = { width: "100%", background: tokens.mode === "dark" ? "rgba(255,255,255,0.06)" : "#F5F5F4",
    border: `1px solid ${tokens.border}`, borderRadius: 6, padding: "8px 10px", fontSize: 13.5, color: tokens.text, fontFamily: tokens.fonts.body };

  return (
    <div className={embedded ? "px-5 py-6" : "max-w-6xl mx-auto px-6 py-10"}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div style={{ fontFamily: tokens.fonts.display, color: tokens.text, fontSize: 20 }}>Admin Dashboard</div>
          {hasUnsavedChanges && (
            <span style={{ fontSize: 10.5, fontFamily: FONT_MONO, letterSpacing: "0.04em", padding: "3px 8px", borderRadius: 20,
              background: tokens.mode === "dark" ? "rgba(229,147,111,0.16)" : "rgba(156,75,50,0.1)", color: tokens.negative }}>
              UNSAVED CHANGES
            </span>
          )}
        </div>
        <button onClick={onLock} className="flex items-center gap-2 px-3.5 py-2 text-xs"
          style={{ border: `1px solid ${tokens.border}`, borderRadius: 8, color: tokens.textMuted }}>
          <Icon name="lock" size={13} /> Lock / Log Out
        </button>
      </div>
    <div className={embedded ? "grid grid-cols-1 gap-6" : "grid grid-cols-1 lg:grid-cols-3 gap-6"}>
      {/* THEME & TYPOGRAPHY */}
      <div style={card} className="p-6">
        <SectionLabel tokens={tokens}>THEME &amp; TYPOGRAPHY</SectionLabel>
        <div style={label}>Color preset</div>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {Object.entries(PRESETS).map(([key, p]) => (
            <button key={key} onClick={() => applyPreset(key)}
              className="flex items-center gap-2 px-3 py-2 text-xs"
              style={{ border: `1px solid ${config.theme.preset === key ? tokens.accent : tokens.border}`, borderRadius: 8, color: tokens.text, fontFamily: tokens.fonts.body }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: p.primary, border: `1px solid ${tokens.border}` }} />
              <span style={{ width: 14, height: 14, borderRadius: 4, background: p.accent }} />
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex gap-4 mb-5">
          <div>
            <div style={label}>Primary</div>
            <input type="color" value={rgbToHex(tokens.primary)} onChange={e => setTheme({ primary: e.target.value, preset: "custom" })} />
          </div>
          <div>
            <div style={label}>Accent</div>
            <input type="color" value={rgbToHex(tokens.accent)} onChange={e => setTheme({ accent: e.target.value, preset: "custom" })} />
          </div>
        </div>

        <div style={label}>Border radius</div>
        <div className="flex gap-2 mb-5">
          {Object.keys(RADII).map(r => (
            <button key={r} onClick={() => setTheme({ radius: r })}
              className="px-3 py-1.5 text-xs capitalize"
              style={{ border: `1px solid ${config.theme.radius === r ? tokens.accent : tokens.border}`, borderRadius: RADII[r], color: tokens.text }}>
              {r}
            </button>
          ))}
        </div>

        <div style={label}>Card style</div>
        <div className="flex flex-wrap gap-2 mb-5">
          {CARD_STYLES.map(s => (
            <button key={s} onClick={() => setTheme({ cardStyle: s })}
              className="px-3 py-1.5 text-xs"
              style={{ border: `1px solid ${config.theme.cardStyle === s ? tokens.accent : tokens.border}`, borderRadius: 8, color: tokens.text }}>
              {s === "flatBordered" ? "Flat Bordered" : s === "elevatedShadow" ? "Elevated Shadow" : "Glassmorphism"}
            </button>
          ))}
        </div>

        <div style={label}>Font theme</div>
        <select value={config.theme.font} onChange={e => setTheme({ font: e.target.value })} style={input}>
          {Object.entries(FONT_THEMES).map(([key, f]) => <option key={key} value={key}>{f.label}</option>)}
        </select>
      </div>

      {/* COPY */}
      <div style={card} className="p-6">
        <SectionLabel tokens={tokens}>COPY &amp; COPYWRITING</SectionLabel>
        {[
          ["brandName", "Brand name"],
          ["heroHeadline", "Hero headline"],
          ["heroSubtitle", "Hero subtitle"],
          ["ctaLabel", "CTA button label"],
          ["statsHeadline", "Landing stats headline"],
          ["resultsHeader", "Results section header"],
        ].map(([key, l]) => (
          <div key={key} className="mb-4">
            <div style={label}>{l}</div>
            {key === "heroSubtitle" ? (
              <textarea rows={3} value={config.copy[key]} onChange={e => setCopy({ [key]: e.target.value })} style={input} />
            ) : (
              <input value={config.copy[key]} onChange={e => setCopy({ [key]: e.target.value })} style={input} />
            )}
          </div>
        ))}
      </div>

      {/* SCORING ENGINE */}
      <div style={card} className="p-6">
        <SectionLabel tokens={tokens}>SCORING ENGINE CALIBRATION</SectionLabel>
        <WeightSlider tokens={tokens} label="Base Rate" value={config.weights.baseRate} min={0} max={50}
          suffix="%" onChange={v => setWeights({ baseRate: v })} />
        <WeightSlider tokens={tokens} label="Target-Keyword / Resume Boost" value={config.weights.targetSchoolBoost} min={-30} max={30}
          suffix="%" onChange={v => setWeights({ targetSchoolBoost: v })} />
        <WeightSlider tokens={tokens} label="Timing Penalty Scale" value={config.weights.timingPenaltyScale} min={0} max={40}
          suffix="% max" negative onChange={v => setWeights({ timingPenaltyScale: v })} />
        <WeightSlider tokens={tokens} label="Visa Constraint Penalty" value={config.weights.visaPenalty} min={0} max={30}
          suffix="% max" negative onChange={v => setWeights({ visaPenalty: v })} />

        <div className="mt-6 pt-5" style={{ borderTop: `1px solid ${tokens.border}` }}>
          <SectionLabel tokens={tokens}>EXPORT CONFIG</SectionLabel>
          <Btn tokens={tokens} onClick={doExport} className="w-full flex items-center justify-center gap-2">
            <Icon name="copy" size={14} /> Copy config JSON + CSS variables
          </Btn>
          {copiedMsg && <div style={{ fontSize: 12, color: tokens.textMuted, marginTop: 8 }}>{copiedMsg}</div>}
          {exportText && (
            <textarea readOnly value={exportText} rows={8}
              style={{ ...input, marginTop: 10, fontFamily: FONT_MONO, fontSize: 11 }} />
          )}
        </div>

        <div className="mt-6 pt-5" style={{ borderTop: `1px solid ${tokens.border}` }}>
          <SectionLabel tokens={tokens}>SECURITY</SectionLabel>
          <div style={label}>Admin passcode (4–8 digits)</div>
          <input value={config.security.passcode} maxLength={8}
            onChange={e => setConfig(c => ({ ...c, security: { passcode: e.target.value.replace(/\s/g, "") } }))}
            style={input} />
          <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 6 }}>Takes effect next time the dashboard is locked.</div>
        </div>
      </div>
    </div>

    <div className="flex items-center justify-between gap-3 mt-8 pt-6 flex-wrap" style={{ borderTop: `1px solid ${tokens.border}` }}>
      <div className="flex gap-3">
        <Btn tokens={tokens} onClick={handleSaveClick} className="flex items-center gap-2">
          <Icon name="check" size={14} /> Save Changes
        </Btn>
        <Btn tokens={tokens} variant="outline" onClick={handleResetClick} className="flex items-center gap-2">
          Reset to Defaults
        </Btn>
      </div>
      {actionMsg && (
        <div className="flex items-center gap-2" style={{ fontSize: 12.5, color: tokens.positive }}>
          <Icon name="check" size={13} /> {actionMsg}
        </div>
      )}
    </div>
    </div>
  );
}
function rgbToHex(color) {
  if (color.startsWith("#")) return color;
  const m = color.match(/\d+/g);
  if (!m) return "#000000";
  return "#" + m.slice(0,3).map(n => (+n).toString(16).padStart(2,"0")).join("");
}
function WeightSlider({ tokens, label, value, min, max, suffix, onChange, negative }) {
  return (
    <div className="mb-5">
      <div className="flex justify-between mb-2" style={{ fontSize: 12.5, color: tokens.text, fontFamily: tokens.fonts.body }}>
        <span>{label}</span>
        <span style={{ fontFamily: FONT_MONO, color: tokens.textMuted }}>{negative ? "−" : ""}{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ "--thumb": tokens.accent, width: "100%" }} />
    </div>
  );
}

/* ============================== LANDING VIEW ============================== */
function LandingView({ config, tokens, setView, setAnswers }) {
  const card = cardSx(tokens, config.theme.cardStyle);
  const stats = [
    { v: "1–3%", l: "Typical offer rate, top-tier IB & PE analyst seats" },
    { v: "6–9%", l: "Typical offer rate, MBB first-round to offer" },
    { v: "70%+", l: "Of offers trace back to a referral or warm intro" },
  ];
  return (
    <div>
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-14 grid grid-cols-1 md:grid-cols-5 gap-10 items-center">
        <div className="md:col-span-3">
          <h1 style={{ fontFamily: tokens.fonts.display, color: tokens.text, fontSize: 44, lineHeight: 1.08, fontWeight: 600, letterSpacing: "-0.01em" }}>
            {config.copy.heroHeadline}
          </h1>
          <p style={{ color: tokens.textMuted, fontFamily: tokens.fonts.body, fontSize: 16, marginTop: 18, maxWidth: 480, lineHeight: 1.6 }}>
            {config.copy.heroSubtitle}
          </p>
          <div className="mt-8">
            <Btn tokens={tokens} onClick={() => setView("assessment")} className="flex items-center gap-2 inline-flex">
              {config.copy.ctaLabel} <Icon name="arrowRight" size={15} />
            </Btn>
          </div>
        </div>
        <div className="md:col-span-2" style={{ ...card, padding: 22 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: tokens.textMuted, letterSpacing: "0.05em", marginBottom: 14 }}>
            {config.copy.statsHeadline}
          </div>
          {stats.map((s, i) => (
            <div key={i} className="flex items-baseline justify-between py-3" style={{ borderTop: i > 0 ? `1px solid ${tokens.border}` : "none" }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 22, color: tokens.accent, fontWeight: 600 }}>{s.v}</span>
              <span style={{ fontSize: 12, color: tokens.textMuted, maxWidth: 200, textAlign: "right" }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-20">
        <SectionLabel tokens={tokens}>SUPPORTED SECTORS — SELECT ONE TO BEGIN</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SECTORS.map(s => (
            <button key={s.key} onClick={() => { setAnswers(a => ({ ...a, sector: s.key, tierIndex: 0 })); setView("assessment"); }}
              className="text-left p-5" style={card}>
              <Icon name={s.icon} size={20} className="mb-8" style={{ color: tokens.accent }} />
              <div style={{ color: tokens.text, fontFamily: tokens.fonts.display, fontSize: 16, marginBottom: 6 }}>{s.label}</div>
              <div style={{ color: tokens.textMuted, fontSize: 12.5 }}>{s.tiers.join(" · ")}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================== ASSESSMENT VIEW ============================== */
function AssessmentView({ config, tokens, answers, setAnswers, setView }) {
  const [step, setStep] = useState(1);
  const [resumeText, setResumeText] = useState(answers.resumeText || "");
  const [fileName, setFileName] = useState("");
  const [extractStatus, setExtractStatus] = useState("idle"); // idle | extracting | done | error
  const [extraction, setExtraction] = useState(null);
  const [extractError, setExtractError] = useState("");
  const [toast, setToast] = useState("");
  const fileInputRef = useRef(null);
  const sector = SECTORS.find(s => s.key === answers.sector) || SECTORS[0];
  const card = cardSx(tokens, config.theme.cardStyle);

  const scan = scanResume(resumeText, sector);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3200);
  };

  const handleFile = async (f) => {
    if (!f) return;
    if (!isValidResumeFile(f)) {
      showToast(`Unsupported file type ".${f.name.split(".").pop()}" — please upload a PDF or Word document (.pdf, .doc, .docx).`);
      return;
    }
    setFileName(f.name);
    setExtraction(null);
    setExtractError("");
    setExtractStatus("extracting");
    try {
      const text = await extractResumeText(f);
      if (!text || text.replace(/\s/g, "").length < 30) {
        throw new Error("Could not extract readable text. Please upload a text-based PDF or Word document.");
      }
      setExtraction(analyzeResumeText(text, sector, f.name));
      setExtractStatus("done");
    } catch (err) {
      setExtractError(err && err.message ? err.message : "Could not extract readable text. Please upload a text-based PDF or Word document.");
      setExtractStatus("error");
    }
  };

  const finish = () => {
    let resumeMatch = 0.4;
    let bridgeMatches = [];
    let gpaValue = null;
    if (extraction) {
      resumeMatch = extraction.fraction;
      bridgeMatches = extraction.bridgeMatches;
      gpaValue = extraction.gpaValue;
    } else {
      const m = scanResume(resumeText, sector);
      if (m) resumeMatch = m.fraction;
      if (resumeText.trim().length > 20) {
        bridgeMatches = sector.key !== "consulting" ? CONSULTING_BRIDGE_KEYWORDS.filter(k => resumeText.toLowerCase().includes(k)) : [];
        gpaValue = extractGpaValue(resumeText);
      }
    }
    setAnswers(a => ({ ...a, resumeText, resumeMatch, bridgeMatches, gpaValue, submitted: true }));
    setView("results");
  };

  const onDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const field = { marginBottom: 20 };
  const label = { fontSize: 12.5, color: tokens.textMuted, marginBottom: 8, display: "block", fontFamily: tokens.fonts.body };
  const select = { width: "100%", background: tokens.mode === "dark" ? "rgba(255,255,255,0.06)" : "#F5F5F4",
    border: `1px solid ${tokens.border}`, borderRadius: 6, padding: "10px 12px", fontSize: 14, color: tokens.text };

  const canNext =
    (step === 1 && answers.sector && answers.level && answers.office) ||
    (step === 2 && answers.cycle && answers.visa) ||
    step === 3;

  return (
    <div className="max-w-4xl mx-auto px-6 py-14">
      <div className="flex items-center gap-3 mb-10">
        {[1,2,3].map(n => (
          <React.Fragment key={n}>
            <div className="flex items-center justify-center" style={{
              width: 28, height: 28, borderRadius: "50%", fontSize: 12.5, fontFamily: FONT_MONO,
              background: step >= n ? tokens.accent : "transparent",
              color: step >= n ? (tokens.mode === "dark" ? "#12141A" : "#fff") : tokens.textMuted,
              border: `1px solid ${step >= n ? tokens.accent : tokens.border}` }}>
              {step > n ? <Icon name="check" size={13} /> : n}
            </div>
            {n < 3 && <div style={{ flex: 1, height: 1, background: step > n ? tokens.accent : tokens.border }} />}
          </React.Fragment>
        ))}
      </div>

      <div style={card} className="p-8">
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: tokens.fonts.display, color: tokens.text, fontSize: 22, marginBottom: 24 }}>Role selection</h2>
            <div style={field}>
              <span style={label}>Sector</span>
              <select style={select} value={answers.sector || ""} onChange={e => setAnswers(a => ({ ...a, sector: e.target.value, tierIndex: 0 }))}>
                <option value="" disabled>Select a sector</option>
                {SECTORS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            {sector && (
              <div style={field}>
                <span style={label}>Firm / fund tier</span>
                <select style={select} value={answers.tierIndex ?? 0} onChange={e => setAnswers(a => ({ ...a, tierIndex: Number(e.target.value) }))}>
                  {sector.tiers.map((t, i) => <option key={t} value={i}>{t}</option>)}
                </select>
              </div>
            )}
            <div style={field}>
              <span style={label}>Target role level</span>
              <select style={select} value={answers.level || ""} onChange={e => setAnswers(a => ({ ...a, level: e.target.value }))}>
                <option value="" disabled>Select a level</option>
                {LEVELS.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <span style={label}>Target office</span>
              <select style={select} value={answers.office || ""} onChange={e => setAnswers(a => ({ ...a, office: e.target.value }))}>
                <option value="" disabled>Select an office tier</option>
                {OFFICES.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontFamily: tokens.fonts.display, color: tokens.text, fontSize: 22, marginBottom: 24 }}>Timing &amp; constraints</h2>
            <div style={field}>
              <span style={label}>Application timing</span>
              <select style={select} value={answers.cycle || ""} onChange={e => setAnswers(a => ({ ...a, cycle: e.target.value }))}>
                <option value="" disabled>Select timing</option>
                {CYCLES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <span style={label}>Visa / work authorization</span>
              <select style={select} value={answers.visa || ""} onChange={e => setAnswers(a => ({ ...a, visa: e.target.value }))}>
                <option value="" disabled>Select status</option>
                {VISAS.map(v => <option key={v.key} value={v.key}>{v.label}</option>)}
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontFamily: tokens.fonts.display, color: tokens.text, fontSize: 22, marginBottom: 8 }}>Resume upload</h2>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <p style={{ color: tokens.textMuted, fontSize: 13, margin: 0 }}>
                Upload your resume to scan for {sector.label.toLowerCase()} keywords.
              </p>
              <div className="flex gap-1.5">
                {["PDF", "DOC", "DOCX"].map(b => (
                  <span key={b} style={{ fontSize: 10.5, fontFamily: FONT_MONO, padding: "3px 7px", borderRadius: 4,
                    border: `1px solid ${tokens.border}`, color: tokens.textMuted, letterSpacing: "0.04em" }}>{b}</span>
                ))}
              </div>
            </div>

            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" style={{ display: "none" }}
              onChange={e => handleFile(e.target.files[0])} />

            <div onDragOver={e => e.preventDefault()} onDrop={onDrop} onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="flex flex-col items-center justify-center text-center py-10 mb-5 cursor-pointer"
              style={{ border: `1.5px dashed ${tokens.border}`, borderRadius: tokens.radius }}>
              <Icon name="upload" size={22} style={{ color: tokens.accent }} className="mb-3" />
              <div style={{ color: tokens.text, fontSize: 13.5 }}>{fileName || "Drag a resume here, or click to browse"}</div>
              <div style={{ color: tokens.textMuted, fontSize: 11.5, marginTop: 4 }}>PDF, DOC, or DOCX — up to 10MB</div>
            </div>

            {extractStatus === "extracting" && (
              <div className="flex items-center gap-3 py-4 px-4 mb-5" style={{ border: `1px solid ${tokens.border}`, borderRadius: tokens.radius }}>
                <div className="animate-spin" style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${tokens.border}`, borderTopColor: tokens.accent }} />
                <span style={{ fontSize: 13, color: tokens.textMuted }}>Extracting text from PDF/Word document…</span>
              </div>
            )}

            {extractStatus === "error" && (
              <div className="flex items-start gap-3 py-4 px-4 mb-5" style={{ border: `1px solid ${tokens.negative}`, borderRadius: tokens.radius, background: tokens.mode === "dark" ? "rgba(229,147,111,0.08)" : "rgba(156,75,50,0.06)" }}>
                <Icon name="alert" size={16} style={{ color: tokens.negative, marginTop: 1, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: tokens.text }}>{extractError}</span>
              </div>
            )}

            {extractStatus === "done" && extraction && (
              <div className="mb-5" style={{ border: `1px solid ${tokens.border}`, borderRadius: tokens.radius, padding: 20 }}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="check" size={14} style={{ color: tokens.positive }} />
                  <span style={{ fontSize: 12.5, fontFamily: FONT_MONO, color: tokens.textMuted, letterSpacing: "0.04em" }}>EXTRACTED DATA PREVIEW</span>
                  <span style={{ fontSize: 11, color: tokens.textMuted, marginLeft: "auto" }}>{extraction.wordCount.toLocaleString()} words parsed</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div style={{ fontSize: 11, color: tokens.textMuted, marginBottom: 3 }}>Candidate Name &amp; Contact</div>
                    <div style={{ fontSize: 13.5, color: tokens.text }}>{extraction.name}</div>
                    <div style={{ fontSize: 12, color: tokens.textMuted }}>{extraction.contact}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: tokens.textMuted, marginBottom: 3 }}>Education &amp; GPA</div>
                    <div style={{ fontSize: 13.5, color: tokens.text }}>{extraction.education}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: tokens.textMuted, marginBottom: 3 }}>Target Firm Tiers Mentioned</div>
                    <div style={{ fontSize: 13.5, color: tokens.text }}>{extraction.tiersFound.length > 0 ? extraction.tiersFound.join(" · ") : "None mentioned in document"}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div style={{ fontSize: 11, color: tokens.textMuted, marginBottom: 3 }}>Document Excerpt</div>
                    <div style={{ fontSize: 12.5, color: tokens.textMuted, lineHeight: 1.5, fontStyle: "italic" }}>{extraction.excerpt || "—"}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: tokens.textMuted, marginBottom: 6 }}>Extracted Skill Keywords ({extraction.matchCount} matched)</div>
                <div className="flex flex-wrap gap-2">
                  {extraction.matched.length > 0 ? extraction.matched.map(k => (
                    <span key={k} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 20,
                      background: tokens.mode === "dark" ? "rgba(127,203,158,0.14)" : "rgba(47,107,72,0.1)", color: tokens.positive }}>{k}</span>
                  )) : <span style={{ fontSize: 12, color: tokens.textMuted }}>No sector keywords matched in this document.</span>}
                </div>
                <div style={{ fontSize: 10.5, color: tokens.textMuted, marginTop: 12 }}>Parsed directly from your file in the browser — nothing is uploaded to a server. Name/contact/education are best-effort pattern matches, not guaranteed accurate.</div>
              </div>
            )}

            <details className="mb-1">
              <summary style={{ fontSize: 12, color: tokens.textMuted, cursor: "pointer" }}>Or paste resume text directly for a live keyword scan</summary>
              <textarea rows={5} placeholder="Paste resume text here for keyword scanning…" value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                style={{ width: "100%", marginTop: 10, background: tokens.mode === "dark" ? "rgba(255,255,255,0.06)" : "#F5F5F4",
                  border: `1px solid ${tokens.border}`, borderRadius: 6, padding: "10px 12px", fontSize: 14, color: tokens.text, resize: "vertical" }} />
              {resumeText.trim().length > 20 && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span style={{ fontSize: 12, color: tokens.textMuted }}>Matched keywords:</span>
                  {scan && scan.found.length > 0 ? scan.found.map(k => (
                    <span key={k} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 20, background: tokens.mode==="dark" ? "rgba(127,203,158,0.14)" : "rgba(47,107,72,0.1)", color: tokens.positive }}>{k}</span>
                  )) : <span style={{ fontSize: 12, color: tokens.textMuted }}>none yet — try adding sector-specific terms</span>}
                </div>
              )}
            </details>
          </div>
        )}

        <div className="flex justify-between mt-10">
          <Btn tokens={tokens} variant="outline" onClick={() => step > 1 ? setStep(step-1) : setView("landing")} className="flex items-center gap-1">
            <Icon name="chevronLeft" size={14} /> Back
          </Btn>
          {step < 3 ? (
            <Btn tokens={tokens} onClick={() => canNext && setStep(step+1)} style={{ opacity: canNext ? 1 : 0.45 }} className="flex items-center gap-1">
              Next <Icon name="chevronRight" size={14} />
            </Btn>
          ) : (
            <Btn tokens={tokens} onClick={finish} className="flex items-center gap-1">
              See my odds <Icon name="arrowRight" size={14} />
            </Btn>
          )}
        </div>
      </div>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 70,
          background: tokens.negative, color: "#fff", padding: "10px 16px", borderRadius: 8, fontSize: 13,
          display: "flex", alignItems: "center", gap: 8, maxWidth: "90vw", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.4)" }}>
          <Icon name="alert" size={14} /> {toast}
        </div>
      )}
    </div>
  );
}
function Gauge({ percent, tokens }) {
  const r = 70, c = 2 * Math.PI * r;
  const offset = c * (1 - percent / 100);
  return (
    <svg width="200" height="200" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r={r} fill="none" stroke={tokens.border} strokeWidth="14" />
      <circle cx="100" cy="100" r={r} fill="none" stroke={tokens.accent} strokeWidth="14"
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 100 100)" style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)" }} />
      <text x="100" y="96" textAnchor="middle" fontFamily={FONT_MONO} fontSize="34" fontWeight="600" fill={tokens.text}>{percent}%</text>
      <text x="100" y="118" textAnchor="middle" fontFamily={tokens.fonts.body} fontSize="11" fill={tokens.textMuted}>PROBABILITY</text>
    </svg>
  );
}
function ResultsView({ config, tokens, answers, setView }) {
  const card = cardSx(tokens, config.theme.cardStyle);
  if (!answers.submitted) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <Icon name="gauge" size={26} style={{ color: tokens.textMuted }} className="mx-auto mb-4" />
        <h2 style={{ fontFamily: tokens.fonts.display, color: tokens.text, fontSize: 22, marginBottom: 10 }}>No assessment yet</h2>
        <p style={{ color: tokens.textMuted, fontSize: 14, marginBottom: 24 }}>Complete the intake flow to generate a probability read.</p>
        <Btn tokens={tokens} onClick={() => setView("assessment")}>Start assessment</Btn>
      </div>
    );
  }
  const result = computeScore(answers, config.weights);
  const positives = result.factors.filter(f => f.value >= 0);
  const negatives = result.factors.filter(f => f.value < 0);
  const actions = buildActionPlan(result);
  const peer = result.sector.peerBenchmark;
  const strengthHighlight = buildStrengthHighlight(result);
  const CATEGORY_ORDER = [FACTOR_CATEGORIES.PRESTIGE, FACTOR_CATEGORIES.TECHNICAL, FACTOR_CATEGORIES.LEADERSHIP];
  const positiveGroups = {};
  positives.forEach(f => {
    const cat = f.category || "Other";
    (positiveGroups[cat] = positiveGroups[cat] || []).push(f);
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      <SectionLabel tokens={tokens}>{config.copy.resultsHeader}</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div style={{ ...card, padding: 28 }} className="md:col-span-1 flex flex-col items-center justify-center">
          <Gauge percent={result.total} tokens={tokens} />
          <div style={{ marginTop: 10, padding: "5px 14px", borderRadius: 20, fontSize: 12.5, fontFamily: FONT_MONO,
            background: tokens.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", color: tokens.text }}>
            {result.band}
          </div>
        </div>

        <div style={{ ...card, padding: 24 }} className="md:col-span-2">
          <div style={{ fontFamily: tokens.fonts.body, fontSize: 12.5, color: tokens.textMuted, marginBottom: 14 }}>PEER COMPARISON — TYPICAL ADMITTED CANDIDATE</div>
          {[{ label: "You", value: result.total, color: tokens.accent }, { label: "Typical admit (this seat)", value: peer, color: tokens.textMuted }].map((row, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between mb-1.5" style={{ fontSize: 12.5, color: tokens.text }}>
                <span>{row.label}</span><span style={{ fontFamily: FONT_MONO }}>{row.value}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: tokens.border, overflow: "hidden" }}>
                <div style={{ width: `${row.value}%`, height: "100%", background: row.color, transition: "width .8s ease" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {strengthHighlight && (
        <div className="mb-10" style={{ ...card, padding: 22, borderLeft: `3px solid ${tokens.accent}` }}>
          <div className="flex items-center gap-2 mb-3">
            <Icon name="check" size={14} style={{ color: tokens.accent }} />
            <span style={{ fontSize: 12.5, fontFamily: FONT_MONO, color: tokens.textMuted, letterSpacing: "0.04em" }}>STRENGTH HIGHLIGHTS</span>
          </div>
          <div style={{ fontSize: 13.5, color: tokens.text, lineHeight: 1.6 }}>{strengthHighlight}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div style={{ ...card, padding: 22 }}>
          <div style={{ fontSize: 12.5, color: tokens.positive, fontFamily: FONT_MONO, marginBottom: 14 }}>POSITIVE FACTORS</div>
          {positives.length === 0 && <div style={{ fontSize: 13, color: tokens.textMuted }}>No positive adjustments this run.</div>}
          {CATEGORY_ORDER.filter(cat => positiveGroups[cat] && positiveGroups[cat].length > 0).map(cat => (
            <details key={cat} open className="mb-1">
              <summary style={{ cursor: "pointer", fontSize: 11, fontFamily: FONT_MONO, color: tokens.textMuted, letterSpacing: "0.04em", padding: "6px 0" }}>
                {cat.toUpperCase()}
              </summary>
              {positiveGroups[cat].map(f => (
                <div key={f.label} className="flex justify-between items-start py-2.5" style={{ borderTop: `1px solid ${tokens.border}` }}>
                  <div><div style={{ fontSize: 13.5, color: tokens.text }}>{f.label}</div><div style={{ fontSize: 11.5, color: tokens.textMuted }}>{f.note}</div></div>
                  <div style={{ fontFamily: FONT_MONO, color: tokens.positive, fontSize: 13.5 }}>+{f.value}%</div>
                </div>
              ))}
            </details>
          ))}
        </div>
        <div style={{ ...card, padding: 22 }}>
          <div style={{ fontSize: 12.5, color: tokens.negative, fontFamily: FONT_MONO, marginBottom: 14 }}>PENALTY FACTORS</div>
          {negatives.length === 0 && <div style={{ fontSize: 13, color: tokens.textMuted }}>No penalties this run.</div>}
          {negatives.map(f => (
            <div key={f.label} className="flex justify-between items-start py-2.5" style={{ borderTop: `1px solid ${tokens.border}` }}>
              <div><div style={{ fontSize: 13.5, color: tokens.text }}>{f.label}</div><div style={{ fontSize: 11.5, color: tokens.textMuted }}>{f.note}</div></div>
              <div style={{ fontFamily: FONT_MONO, color: tokens.negative, fontSize: 13.5 }}>{f.value}%</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...card, padding: 24 }}>
        <div style={{ fontSize: 12.5, color: tokens.textMuted, fontFamily: FONT_MONO, marginBottom: 16 }}>PRIORITIZED ACTION PLAN</div>
        {actions.map((a, i) => (
          <div key={i} className="flex gap-3 items-start py-2.5" style={{ borderTop: i > 0 ? `1px solid ${tokens.border}` : "none" }}>
            <Icon name="check" size={14} style={{ color: tokens.accent, marginTop: 3, flexShrink: 0 }} />
            <div style={{ fontSize: 13.5, color: tokens.text, lineHeight: 1.5 }}>{a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================== ADMIN DRAWER (hidden access) ============================== */
function AdminDrawer({ isOpen, onClose, config, setConfig, tokens, isAdminAuthenticated, setIsAdminAuthenticated, onSaveConfig, onResetDefaults, hasUnsavedChanges }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, pointerEvents: isOpen ? "auto" : "none" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)",
        opacity: isOpen ? 1 : 0, transition: "opacity .25s ease" }} />
      <div style={{ position: "absolute", top: 0, right: 0, height: "100%", width: "min(440px, 100vw)",
        background: tokens.bg, borderLeft: `1px solid ${tokens.border}`, overflowY: "auto",
        transform: isOpen ? "translateX(0)" : "translateX(100%)", transition: "transform .3s ease" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${tokens.border}` }}>
          <div style={{ fontFamily: tokens.fonts.display, color: tokens.text, fontSize: 15 }}>Admin Access</div>
          <button onClick={onClose} aria-label="Close admin panel" style={{ color: tokens.textMuted }}>
            <Icon name="x" size={17} />
          </button>
        </div>
        {isAdminAuthenticated ? (
          <AdminView config={config} setConfig={setConfig} tokens={tokens} embedded
            onLock={() => { setIsAdminAuthenticated(false); onClose(); }}
            onSaveConfig={onSaveConfig} onResetDefaults={onResetDefaults} hasUnsavedChanges={hasUnsavedChanges} />
        ) : (
          <AdminLockScreen tokens={tokens} config={config} embedded onUnlock={() => setIsAdminAuthenticated(true)} />
        )}
      </div>
    </div>
  );
}
function Footer({ tokens, brandName, onAdminTrigger }) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between" style={{ borderTop: `1px solid ${tokens.border}`, marginTop: 40 }}>
      <div style={{ fontSize: 11.5, color: tokens.textMuted }}>
        © {new Date().getFullYear()} {brandName}. Illustrative estimates only — not a guarantee of any outcome.
      </div>
      <button onClick={onAdminTrigger} aria-label="Admin settings" className="opacity-30 hover:opacity-100"
        style={{ color: tokens.textMuted, transition: "opacity .2s ease" }}>
        <Icon name="lock" size={14} />
      </button>
    </div>
  );
}

/* ============================== APP ROOT ============================== */
const DEFAULT_CONFIG = {
  theme: { preset: "wallStreetNavy", primary: "#0E1A2B", accent: "#B08D57", mode: "dark", radius: "sharp", cardStyle: "flatBordered", font: "serifSans" },
  copy: {
    brandName: "Odds Engine",
    heroHeadline: "Know your odds before you apply.",
    heroSubtitle: "A data-driven read on your offer probability across investment banking, consulting, private equity, and real estate — before you spend the application.",
    ctaLabel: "Check my odds",
    statsHeadline: "WHAT YOU'RE UP AGAINST",
    resultsHeader: "YOUR RESULTS",
  },
  weights: { baseRate: 12, targetSchoolBoost: 15, timingPenaltyScale: 25, visaPenalty: 20 },
  security: { passcode: "odds2026" },
};

const CONFIG_STORAGE_KEY = "odds-engine-admin-config-v1";

function mergeWithDefaults(saved) {
  return {
    theme: { ...DEFAULT_CONFIG.theme, ...(saved.theme || {}) },
    copy: { ...DEFAULT_CONFIG.copy, ...(saved.copy || {}) },
    weights: { ...DEFAULT_CONFIG.weights, ...(saved.weights || {}) },
    security: { ...DEFAULT_CONFIG.security, ...(saved.security || {}) },
  };
}
function loadInitialConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) return mergeWithDefaults(JSON.parse(raw));
  } catch (e) {
    // corrupted/unavailable localStorage — fall through to defaults
  }
  return DEFAULT_CONFIG;
}

export default function App() {
  const [config, setConfig] = useState(loadInitialConfig);
  const [savedConfig, setSavedConfig] = useState(config);
  const [view, setView] = useState("landing");
  const [answers, setAnswers] = useState({});
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const tokens = useTokens(config);
  const hasUnsavedChanges = useMemo(() => JSON.stringify(config) !== JSON.stringify(savedConfig), [config, savedConfig]);

  const handleSaveConfig = () => {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      // localStorage unavailable (private browsing, quota, etc.) — config still applies live this session
    }
    setSavedConfig(config);
  };
  const handleResetDefaults = () => {
    try {
      localStorage.removeItem(CONFIG_STORAGE_KEY);
    } catch (e) {}
    setConfig(DEFAULT_CONFIG);
    setSavedConfig(DEFAULT_CONFIG);
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        setIsAdminOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    document.body.style.background = tokens.bg;
    document.body.style.color = tokens.text;
  }, [tokens]);

  return (
    <AdminContext.Provider value={{ config, setConfig }}>
      <div style={{ minHeight: "100vh", background: tokens.bg, fontFamily: tokens.fonts.body }}>
        <NavBar view={view} setView={setView} tokens={tokens} copy={config.copy} />
        {view === "landing" && <LandingView config={config} tokens={tokens} setView={setView} setAnswers={setAnswers} />}
        {view === "assessment" && <AssessmentView config={config} tokens={tokens} answers={answers} setAnswers={setAnswers} setView={setView} />}
        {view === "results" && <ResultsView config={config} tokens={tokens} answers={answers} setView={setView} />}
        <Footer tokens={tokens} brandName={config.copy.brandName} onAdminTrigger={() => setIsAdminOpen(true)} />
        <AdminDrawer isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} config={config} setConfig={setConfig}
          tokens={tokens} isAdminAuthenticated={isAdminAuthenticated} setIsAdminAuthenticated={setIsAdminAuthenticated}
          onSaveConfig={handleSaveConfig} onResetDefaults={handleResetDefaults} hasUnsavedChanges={hasUnsavedChanges} />
      </div>
    </AdminContext.Provider>
  );
}
