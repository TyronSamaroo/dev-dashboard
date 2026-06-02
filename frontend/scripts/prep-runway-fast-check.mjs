#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const prepDir = path.join(root, "public", "prep-runway");

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const hasFlag = (flag) => args.includes(flag);
const scope = valueAfter("--scope", "today");
const tokenIndex = args.indexOf("--tokens");
const tokenEndIndex = tokenIndex >= 0
  ? args.findIndex((arg, index) => index > tokenIndex && arg.startsWith("--"))
  : -1;
const tokens = tokenIndex >= 0
  ? args.slice(tokenIndex + 1, tokenEndIndex === -1 ? undefined : tokenEndIndex)
  : [];

const scopeFiles = {
  today: ["analysis-data.js", "report.html"],
  data: ["analysis-data.js", "data-ledger.html"],
  training: ["analysis-data.js", "training-analytics.html"],
  all: [
    "analysis-data.js",
    "report.html",
    "analysis.html",
    "meal-patterns.html",
    "training-analytics.html",
    "data-ledger.html",
    "sheets.html",
  ],
};

const files = scopeFiles[scope];
if (!files) {
  console.error(`Unknown scope "${scope}". Use one of: ${Object.keys(scopeFiles).join(", ")}`);
  process.exit(1);
}

const readPrepFile = (file) => fs.readFileSync(path.join(prepDir, file), "utf8");
const errors = [];
const warnings = [];

const loadAnalysisData = () => {
  const source = readPrepFile("analysis-data.js");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "analysis-data.js" });
  return sandbox.window.PREP_ANALYSIS_DATA;
};

const isPresent = (value) => value !== null && value !== undefined && value !== "" && value !== "Pending";
const hasAnyEvents = (row) => [...(row.cardioEvents || []), ...(row.liftEvents || [])].length > 0;
const displayWeight = (row) => row?.displayWeight ?? row?.weight;
const isWeightOptional = (row) => row?.weightSource === "not-logged" || row?.weightSource === "trend" || row?.displayWeight === "Not logged";
const rowByDate = (data, date) => (data.reportLedger || []).find((row) => row.date === date);
const closeEnough = (actual, expected, tolerance = 0.05) => Math.abs(Number(actual) - expected) <= tolerance;

const validateLatestClosedRow = (data) => {
  const rows = data.reportLedger || [];
  if (!rows.length) {
    errors.push("analysis-data.js has no reportLedger rows.");
    return;
  }

  const latestClosed = [...rows].reverse().find((row) => isPresent(row?.macros?.calories));
  if (!latestClosed) {
    errors.push("No closed reportLedger row with calories found.");
    return;
  }

  const missing = [];
  if (!isPresent(displayWeight(latestClosed)) && !isWeightOptional(latestClosed)) missing.push("weight or trend weight");
  if (!isPresent(latestClosed.sleep?.total)) missing.push("sleep total");
  for (const key of ["calories", "protein", "fat", "carbs"]) {
    if (!isPresent(latestClosed.macros?.[key])) missing.push(`macros.${key}`);
  }
  if (!hasAnyEvents(latestClosed)) missing.push("cardio/lift events");
  if (!isPresent(latestClosed.burn?.apple)) missing.push("Apple active burn");
  if (!isPresent(latestClosed.burn?.adjusted)) missing.push("adjusted burn");

  if (missing.length) {
    errors.push(`${latestClosed.day} ${latestClosed.dateShort} latest closed row is missing: ${missing.join(", ")}`);
  }

  return latestClosed;
};

const validateCacheBust = () => {
  const htmlFiles = ["report.html", "analysis.html", "meal-patterns.html", "training-analytics.html", "data-ledger.html", "sheets.html"];
  const versions = new Map();
  for (const file of htmlFiles) {
    const text = readPrepFile(file);
    const match = text.match(/analysis-data\.js\?v=([^"']+)/);
    if (!match) {
      errors.push(`${file} does not load analysis-data.js with a cache-bust version.`);
      continue;
    }
    const version = match[1];
    if (!versions.has(version)) versions.set(version, []);
    versions.get(version).push(file);
  }
  if (versions.size > 1) {
    errors.push(`analysis-data.js cache-bust versions differ: ${[...versions.entries()].map(([version, versionFiles]) => `${version} (${versionFiles.join(", ")})`).join("; ")}`);
  }
};

const validateTokens = () => {
  if (!tokens.length) return;
  const bundle = files.map((file) => readPrepFile(file)).join("\n");
  for (const token of tokens) {
    if (!bundle.includes(token)) {
      errors.push(`scope "${scope}" is missing token: ${token}`);
    }
  }
};

const validateRunwayReconciliation = (data) => {
  const requiredRows = [
    ["2026-05-26", "Tue 5/26"],
    ["2026-05-27", "Wed 5/27"],
    ["2026-05-28", "Thu 5/28"],
    ["2026-05-29", "Fri 5/29"],
    ["2026-05-30", "Sat 5/30"],
    ["2026-05-31", "Sun 5/31"],
    ["2026-06-01", "Mon 6/1"],
    ["2026-06-02", "Tue 6/2"],
  ];
  for (const [date, label] of requiredRows) {
    if (!rowByDate(data, date)) errors.push(`analysis-data.js is missing ${label} in reportLedger.`);
  }

  const checks = [
    {
      date: "2026-05-26",
      ok: (row) => closeEnough(row?.macros?.calories, 1075) && hasAnyEvents(row),
      message: "Tue 5/26 should have closed macros and training/cardio events, not pending cards.",
    },
    {
      date: "2026-05-30",
      ok: (row) => closeEnough(displayWeight(row), 154),
      message: "Sat 5/30 should show the user-corrected 154.0 scale weight.",
    },
    {
      date: "2026-05-31",
      ok: (row) => closeEnough(displayWeight(row), 153.3) && closeEnough(row?.macros?.calories, 1480) && hasAnyEvents(row),
      message: "Sun 5/31 should be a closed day with 153.3 weight, macros, cardio, and lift.",
    },
    {
      date: "2026-06-01",
      ok: (row) => closeEnough(row?.macros?.calories, 1634) && (row?.liftEvents || []).some((event) => /leg/i.test(`${event.label} ${event.type}`)),
      message: "Mon 6/1 should be closed and labeled as leg day, not generic/pending weight training.",
    },
    {
      date: "2026-06-02",
      ok: (row) => closeEnough(displayWeight(row), 155),
      message: "Tue 6/2 should show the 155.0 scale check.",
    },
  ];
  for (const check of checks) {
    const row = rowByDate(data, check.date);
    if (row && !check.ok(row)) errors.push(check.message);
  }
};

const validateNoStaleVisibleText = () => {
  const stalePatterns = [
    {
      file: "data-ledger.html",
      pattern: /Sat 5\/30<\/td><td>Soft landing<\/td><td class="num">Not logged/,
      message: "data-ledger compact row still says Sat 5/30 weight is Not logged.",
    },
    {
      file: "data-ledger.html",
      pattern: /2026-05-30<\/td><td>Sat<\/td><td>Projected final-runway range[^\n]*<td>Not logged<\/td>/,
      message: "data-ledger forecast still says Sat 5/30 is Not logged.",
    },
    {
      file: "data-ledger.html",
      pattern: /2026-05-31<\/td><td>Sun<\/td><td>Projected final-runway range[^\n]*<td>Pending<\/td>/,
      message: "data-ledger forecast still says Sun 5/31 is Pending.",
    },
    {
      file: "data-ledger.html",
      pattern: /2026-06-01<\/td><td>Mon<\/td><td>Coach handoff target range[^\n]*<td>Pending<\/td>/,
      message: "data-ledger forecast still says Mon 6/1 is Pending.",
    },
    {
      file: "report.html",
      pattern: /<tr><td>5\/30 Sat<\/td>[^\n]*<td>Pending<\/td>/,
      message: "report forecast drawer still has Sat 5/30 Pending.",
    },
    {
      file: "report.html",
      pattern: /<tr><td>5\/31 Sun<\/td>[^\n]*<td>Pending<\/td>/,
      message: "report forecast drawer still has Sun 5/31 Pending.",
    },
    {
      file: "report.html",
      pattern: /<tr><td>6\/1 Mon<\/td>[^\n]*<td>Pending<\/td>/,
      message: "report forecast drawer still has Mon 6/1 Pending.",
    },
  ];
  for (const { file, pattern, message } of stalePatterns) {
    if (pattern.test(readPrepFile(file))) errors.push(message);
  }
};

const start = performance.now();
let data;
try {
  data = loadAnalysisData();
} catch (error) {
  errors.push(`analysis-data.js failed to execute: ${error.message}`);
}

let latestClosed;
if (data) {
  latestClosed = validateLatestClosedRow(data);
  validateRunwayReconciliation(data);
  if (!data.todayStatus?.date && !hasFlag("--allow-missing-today")) {
    errors.push("todayStatus.date is missing.");
  }
}

validateCacheBust();
validateNoStaleVisibleText();
validateTokens();

if (warnings.length) {
  console.warn("Prep Runway fast check warnings:");
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length) {
  console.error("Prep Runway fast check FAILED");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const elapsed = Math.round(performance.now() - start);
console.log("Prep Runway fast check OK");
console.log(`Scope: ${scope} (${files.join(", ")})`);
if (latestClosed) {
  const macros = latestClosed.macros;
  const events = [...(latestClosed.cardioEvents || []), ...(latestClosed.liftEvents || [])].length;
  const source = latestClosed.weightSource === "trend" ? " trend" : "";
  const weightText = isWeightOptional(latestClosed) ? "weight not logged" : `${displayWeight(latestClosed)} lb${source}`;
  console.log(`Latest closed: ${latestClosed.day} ${latestClosed.dateShort} · ${weightText} · ${macros.calories} cal · ${macros.protein}P/${macros.fat}F/${macros.carbs}C · ${events} events`);
}
if (data?.todayStatus) {
  console.log(`Open day: ${data.todayStatus.label || data.todayStatus.date} · ${data.todayStatus.headline || "no headline"}`);
}
if (tokens.length) console.log(`Token check: ${tokens.length} token(s) found in scope bundle`);
console.log(`Elapsed: ${elapsed}ms`);
