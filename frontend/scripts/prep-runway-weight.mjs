#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const prepDir = path.join(root, "public", "prep-runway");
const analysisPath = path.join(prepDir, "analysis-data.js");
const ledgerPath = path.join(prepDir, "data-ledger.html");
const cacheBustFiles = [
  "report.html",
  "analysis.html",
  "meal-patterns.html",
  "training-analytics.html",
  "data-ledger.html",
  "sheets.html",
];

const args = process.argv.slice(2);
const valueAfter = (flag, fallback = undefined) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const hasFlag = (flag) => args.includes(flag);

const weight = Number.parseFloat(valueAfter("--weight", ""));
const explicitDate = valueAfter("--date");
const note = valueAfter("--note", "Timing caveat");
const cacheVersion = valueAfter("--cache-version");
const shouldWrite = hasFlag("--write");
const shouldSkipCacheBust = hasFlag("--no-cache-bust");

const fail = (message) => {
  console.error(`prep:weight failed: ${message}`);
  process.exit(1);
};

if (!Number.isFinite(weight)) fail("provide --weight <number>");

const todayDate = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
};

const dateFromArg = explicitDate || todayDate();
if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFromArg)) fail("--date must be YYYY-MM-DD");

const date = new Date(`${dateFromArg}T12:00:00-04:00`);
const day = date.toLocaleDateString("en-US", { weekday: "short", timeZone: "America/New_York" });
const month = date.getMonth() + 1;
const dayOfMonth = date.getDate();
const dateShort = `${month}/${dayOfMonth}`;
const label = `${day} ${dateShort}`;

const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const formatSigned = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  const rounded = Number(Number(value).toFixed(1));
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
};

const loadData = () => {
  const source = fs.readFileSync(analysisPath, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: analysisPath });
  return sandbox.window.PREP_ANALYSIS_DATA;
};

const replaceObjectAtProperty = (source, property, replacement) => {
  const propertyIndex = source.indexOf(`"${property}": {`);
  if (propertyIndex === -1) return { source, changed: false, reason: `${property} not found` };
  const objectStart = source.indexOf("{", propertyIndex);
  let depth = 0;
  for (let index = objectStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) {
        const objectEnd = index + 1;
        const formatted = JSON.stringify(replacement, null, 2)
          .split("\n")
          .map((line) => `  ${line}`)
          .join("\n");
        return {
          source: `${source.slice(0, objectStart)}${formatted}${source.slice(objectEnd)}`,
          changed: source.slice(objectStart, objectEnd) !== formatted,
          reason: property,
        };
      }
    }
  }
  return { source, changed: false, reason: `${property} object end not found` };
};

const replaceArrayAtProperty = (source, property, replacement) => {
  const propertyIndex = source.indexOf(`"${property}": [`);
  if (propertyIndex === -1) return { source, changed: false, reason: `${property} not found` };
  const arrayStart = source.indexOf("[", propertyIndex);
  let depth = 0;
  for (let index = arrayStart; index < source.length; index += 1) {
    if (source[index] === "[") depth += 1;
    if (source[index] === "]") {
      depth -= 1;
      if (depth === 0) {
        const arrayEnd = index + 1;
        const formatted = JSON.stringify(replacement, null, 2)
          .split("\n")
          .map((line) => `  ${line}`)
          .join("\n");
        return {
          source: `${source.slice(0, arrayStart)}${formatted}${source.slice(arrayEnd)}`,
          changed: source.slice(arrayStart, arrayEnd) !== formatted,
          reason: property,
        };
      }
    }
  }
  return { source, changed: false, reason: `${property} array end not found` };
};

const upsertObjectInArray = (source, property, matchDate, replacement) => {
  const propertyIndex = source.indexOf(`"${property}": [`);
  if (propertyIndex === -1) return { source, changed: false, reason: `${property} not found` };
  const arrayStart = source.indexOf("[", propertyIndex);
  let depth = 0;
  let objectStart = -1;
  let insertionIndex = source.indexOf("]", arrayStart);

  for (let index = arrayStart + 1; index < source.length; index += 1) {
    const character = source[index];
    if (character === "{") {
      if (depth === 0) objectStart = index;
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0 && objectStart !== -1) {
        const objectEnd = index + 1;
        const objectText = source.slice(objectStart, objectEnd);
        const rowDate = objectText.match(/"date": "([^"]+)"/)?.[1];
        if (rowDate === matchDate) {
          const formatted = JSON.stringify(replacement, null, 2)
            .split("\n")
            .map((line) => `    ${line}`)
            .join("\n");
          return {
            source: `${source.slice(0, objectStart)}${formatted}${source.slice(objectEnd)}`,
            changed: objectText !== formatted,
            reason: `${property} ${matchDate}`,
          };
        }
        if (rowDate && rowDate > matchDate) {
          insertionIndex = objectStart;
          break;
        }
        objectStart = -1;
      }
    } else if (character === "]" && depth === 0) {
      insertionIndex = index;
      break;
    }
  }

  const formatted = JSON.stringify(replacement, null, 2)
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n");
  const needsCommaBefore = /}\s*$/.test(source.slice(arrayStart, insertionIndex));
  const prefix = needsCommaBefore ? ",\n" : "\n";
  return {
    source: `${source.slice(0, insertionIndex)}${prefix}${formatted}${source.slice(insertionIndex)}`,
    changed: true,
    reason: `${property} ${matchDate} inserted`,
  };
};

const replaceLedgerRow = (html, dateCell, rowHtml) => {
  const escaped = dateCell.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matcher = new RegExp(`\\s*<tr><td class="date-cell">${escaped}</td>[\\s\\S]*?</tr>`);
  if (matcher.test(html)) {
    const next = html.replace(matcher, `\n            ${rowHtml}`);
    return { html: next, changed: next !== html, reason: dateCell };
  }

  const dailySection = html.match(/(<section class="ledger-section" id="daily">[\s\S]*?<tbody>)([\s\S]*?)(\s*<\/tbody>)/);
  if (!dailySection) return { html, changed: false, reason: "daily section not found" };
  const next = html.replace(dailySection[0], `${dailySection[1]}${dailySection[2]}\n            ${rowHtml}${dailySection[3]}`);
  return { html: next, changed: true, reason: `${dateCell} inserted` };
};

const replaceForecastActual = (html, isoDate) => {
  const escaped = isoDate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matcher = new RegExp(`(<tr><td class="date-cell">${escaped}</td><td>${day}</td><td>[^<]+</td><td class="num">([^<]+)</td><td class="num">([^<]+)</td>)<td(?: class="num")?>[^<]+</td><td(?: class="num")?>[^<]+</td><td>[^<]+</td><td class="read">[^<]+</td></tr>`);
  const match = html.match(matcher);
  if (!match) return { html, changed: false, reason: `${isoDate} forecast row not found` };
  const center = Number.parseFloat(match[3]);
  const variance = Number.isFinite(center) ? formatSigned(weight - center) : "—";
  const row = `${match[1]}<td class="num">${weight}</td><td class="num">${variance}</td><td>On track / timing caveat</td><td class="read">Inside the projected range. ${escapeHtml(note)}; confirm with the next standard weigh-in before changing levers.</td></tr>`;
  const next = html.replace(matcher, row);
  return { html: next, changed: next !== html, reason: `${isoDate} forecast actual` };
};

const updateCacheBust = (version) => {
  const touched = [];
  for (const file of cacheBustFiles) {
    const filePath = path.join(prepDir, file);
    const current = fs.readFileSync(filePath, "utf8");
    const next = current.replace(/analysis-data\.js\?v=[^"']+/g, `analysis-data.js?v=${version}`);
    if (next !== current) {
      if (shouldWrite) fs.writeFileSync(filePath, next);
      touched.push(file);
    }
  }
  return touched;
};

const data = loadData();
const sourceRows = data.reportLedger || [];
const existing = sourceRows.find((row) => row.date === dateFromArg);
const previous = [...sourceRows].filter((row) => row.date < dateFromArg && typeof row.weight === "number").at(-1);
const latestClosed = [...sourceRows]
  .filter((row) => row.date < dateFromArg && Number.isFinite(row.macros?.calories) && Number.isFinite(row.burn?.apple))
  .at(-1);
const start = sourceRows[0]?.weight ?? 169;
const delta = previous?.weight ? Number((weight - previous.weight).toFixed(1)) : existing?.delta ?? null;
const totalDrop = Number((start - weight).toFixed(1));
const nextRowCount = existing ? sourceRows.length : sourceRows.length + 1;
const deltaText = delta === null ? "logged" : `${formatSigned(delta)} vs ${previous?.day || "prior"}`;
const lowerNote = note.slice(0, 1).toLowerCase() + note.slice(1);

const sourceMap = (data.sourceMap || []).map((source) => (
  source.label === "Daily ledger"
    ? {
      ...source,
      status: "current",
      value: `${nextRowCount} rows`,
      text: `Latest complete day is ${latestClosed ? `${latestClosed.day} ${latestClosed.dateShort}` : "pending"}; latest weigh-in is ${weight} on ${label} with ${lowerNote}.`,
    }
    : source
));

const dataHealth = {
  ...(data.dataHealth || {}),
  summary: `${label} weigh-in is ${weight}, ${deltaText}. ${latestClosed ? `${latestClosed.day} ${latestClosed.dateShort}` : "Prior closed day"} remains the latest fully closed day.`,
  rows: (data.dataHealth?.rows || []).map((row) => (
    row.label === "Scale trend"
      ? {
        ...row,
        value: `169 → ${weight}`,
        status: "current",
        read: `-${totalDrop} lb from Sun 5/17 to ${label}; ${deltaText}, with ${lowerNote}.`,
      }
      : row
  )),
};

const todayStatus = {
  ...(data.todayStatus || {}),
  date: dateFromArg,
  label,
  headline: "Scale is down again; confirm with standard timing.",
  subhead: `${weight} is ${deltaText} and inside the current forecast lane. ${note}; do not change levers from this read alone.`,
  cards: [
    {
      label: "Scale",
      tone: "ok",
      value: `${weight} lb`,
      text: `${delta === null ? "Logged" : deltaText}; -${totalDrop} lb since Sun 5/17. ${note}.`,
    },
    {
      label: "Recovery",
      tone: "warn",
      value: "Pending",
      text: "Need sleep, RHR, HRV, GI/stool, soreness.",
    },
    {
      label: "Macros",
      tone: "warn",
      value: "Food pending",
      text: "Need macros before changing calories/cardio.",
    },
    {
      label: "Training",
      tone: "warn",
      value: "Pending",
      text: "Need cardio/lift and active burn.",
    },
    {
      label: "Missing",
      tone: "warn",
      value: "Check-in",
      text: "Energy, hunger, drive, GI/stool, soreness.",
    },
  ],
};

const dayCard = {
  date: dateFromArg,
  label,
  phase: existing?.phase ?? `Agg/Rec D${Math.max(1, sourceRows.length - 3)}`,
  weight,
  delta,
  calories: existing?.macros?.calories ?? null,
  protein: existing?.macros?.protein ?? null,
  lift: existing?.liftEvents?.[0]?.title ?? "Pending",
  adjustedActive: existing?.burn?.adjusted ?? null,
  read: `Scale logged at ${weight}. ${note}; confirm with the next standard weigh-in before changing levers.`,
};

const reportRow = {
  date: dateFromArg,
  day,
  dateShort,
  phase: existing?.phase ?? dayCard.phase,
  weight,
  delta,
  sleep: existing?.sleep ?? {
    total: null,
    detail: `Sleep pending · ${note}`,
    rhr: null,
    hrv: null,
  },
  macros: existing?.macros ?? {
    calories: null,
    protein: null,
    fat: null,
    carbs: null,
  },
  cardioEvents: existing?.cardioEvents ?? [],
  liftEvents: existing?.liftEvents ?? [],
  burn: existing?.burn ?? {
    adjusted: null,
    apple: null,
  },
  decision: `${weight} today: ${deltaText} and inside the current forecast lane. ${note}; wait for sleep, macros, training, active burn, GI/stool, soreness, and Energy/Hunger/Drive before changing levers.`,
};

let analysisSource = fs.readFileSync(analysisPath, "utf8");
analysisSource = analysisSource.replace(/"generatedAt": "[^"]+"/, `"generatedAt": "${new Date().toISOString().slice(0, 16)}:00"`);
analysisSource = replaceArrayAtProperty(analysisSource, "sourceMap", sourceMap).source;
analysisSource = replaceObjectAtProperty(analysisSource, "dataHealth", dataHealth).source;
analysisSource = replaceObjectAtProperty(analysisSource, "todayStatus", todayStatus).source;
analysisSource = upsertObjectInArray(analysisSource, "dayCards", dateFromArg, dayCard).source;
analysisSource = upsertObjectInArray(analysisSource, "reportLedger", dateFromArg, reportRow).source;

let ledgerHtml = fs.readFileSync(ledgerPath, "utf8");
const compactRow = `<tr><td class="date-cell">${label}</td><td>${escapeHtml(dayCard.phase.replace("Agg/Rec", "Rec"))}</td><td class="num">${weight}</td><td class="num">${formatSigned(delta)}</td><td>Pending</td><td class="macro-line"><span class="low">Pending</span></td><td class="wrap">Pending</td><td>Pending</td><td class="num">Pending</td><td class="num">Pending</td><td class="num">Pending</td><td class="status">${escapeHtml(note)}; full day pending.</td></tr>`;
const ledgerPatch = replaceLedgerRow(ledgerHtml, label, compactRow);
ledgerHtml = ledgerPatch.html;
const forecastPatch = replaceForecastActual(ledgerHtml, dateFromArg);
ledgerHtml = forecastPatch.html;

const changedFiles = [];
if (shouldWrite) {
  if (analysisSource !== fs.readFileSync(analysisPath, "utf8")) {
    fs.writeFileSync(analysisPath, analysisSource);
    changedFiles.push("analysis-data.js");
  }
  if (ledgerHtml !== fs.readFileSync(ledgerPath, "utf8")) {
    fs.writeFileSync(ledgerPath, ledgerHtml);
    changedFiles.push("data-ledger.html");
  }
}

const cacheTouched = cacheVersion && !shouldSkipCacheBust ? updateCacheBust(cacheVersion) : [];
for (const file of cacheTouched) {
  if (!changedFiles.includes(file)) changedFiles.push(file);
}

const summary = {
  mode: shouldWrite ? "write" : "dry-run",
  date: label,
  weight,
  delta,
  totalDrop,
  note,
  patches: [
    "todayStatus",
    `dayCards ${dateFromArg}`,
    `reportLedger ${dateFromArg}`,
    ledgerPatch.reason,
    forecastPatch.reason,
    cacheVersion && !shouldSkipCacheBust ? `cache bust ${cacheVersion}` : "cache bust unchanged",
  ],
  changedFiles,
  deployHint: shouldWrite
    ? "visible prep dashboard changed; deploy only when Tyron explicitly asks for live publish"
    : "dry-run only; no files written or deployed",
  nextFastCheck: `npm run prep:check -- --tokens "${label}" "${weight}" "${note}"`,
};

console.log(`Prep Runway weight ${shouldWrite ? "write" : "dry-run"} OK`);
console.log(JSON.stringify(summary, null, 2));
if (!shouldWrite) console.log("Add --write to patch files.");
