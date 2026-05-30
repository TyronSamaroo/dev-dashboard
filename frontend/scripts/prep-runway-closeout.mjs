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
const dataLedgerPath = path.join(prepDir, "data-ledger.html");
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
const inputPath = valueAfter("--input");
const explicitWeight = valueAfter("--weight");
const explicitDate = valueAfter("--date");
const cacheVersion = valueAfter("--cache-version");
const shouldWrite = hasFlag("--write");
const shouldPatchDataLedger = !hasFlag("--today-only");
const shouldSkipCacheBust = hasFlag("--no-cache-bust");

const fail = (message) => {
  console.error(`prep:closeout failed: ${message}`);
  process.exit(1);
};

const readStdin = () => {
  if (process.stdin.isTTY) return "";
  return fs.readFileSync(0, "utf8");
};

const input = inputPath ? fs.readFileSync(inputPath, "utf8") : readStdin();
if (!input.trim()) {
  fail("provide a Claude closeout via --input <file> or stdin");
}

const normalizeNumber = (value) => {
  if (value === null || value === undefined) return null;
  const cleaned = String(value)
    .replace(/\*\*/g, "")
    .replace(/[−–—]/g, "-")
    .replace(/[~,]/g, "")
    .replace(/[^\d.+-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === ".") return null;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeTime = (value) => String(value || "")
  .trim()
  .replace(/\s+/g, " ")
  .replace(/\s*AM\b/i, "a")
  .replace(/\s*PM\b/i, "p")
  .replace(/^0/, "")
  .toLowerCase();

const normalizeDuration = (value) => String(value || "")
  .trim()
  .replace(/\s+/g, "")
  .replace(/^(\d+)h(\d+)m$/i, (_, hours, minutes) => `${hours}:${minutes.padStart(2, "0")}:00`)
  .replace(/^(\d+)h$/i, (_, hours) => `${hours}:00:00`)
  .replace(/^(\d+)m$/i, (_, minutes) => `0:${minutes.padStart(2, "0")}:00`);

const durationToMinutes = (duration) => {
  const normalized = normalizeDuration(duration);
  const parts = normalized.split(":").map((part) => Number.parseFloat(part));
  if (parts.length === 3 && parts.every(Number.isFinite)) {
    return parts[0] * 60 + parts[1] + parts[2] / 60;
  }
  if (parts.length === 2 && parts.every(Number.isFinite)) {
    return parts[0] + parts[1] / 60;
  }
  return null;
};

const durationForTitle = (duration) => {
  const minutes = durationToMinutes(duration);
  if (minutes === null) return normalizeDuration(duration);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainder = Math.round(minutes % 60);
    return `${hours}h${String(remainder).padStart(2, "0")}m`;
  }
  return `${Math.round(minutes)}m`;
};

const durationForTable = (duration) => {
  const normalized = normalizeDuration(duration);
  const parts = normalized.split(":");
  if (parts.length === 2) return `${parts[0]}:${parts[1].padStart(2, "0")}`;
  if (parts.length === 3 && parts[0] === "0") return `${parts[1]}:${parts[2].padStart(2, "0")}`;
  if (parts.length === 3) return `${parts[0]}:${parts[1].padStart(2, "0")}:${parts[2].padStart(2, "0")}`;
  return normalized;
};

const formatMinutes = (minutes, suffix = "m") => {
  if (!Number.isFinite(minutes)) return "—";
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainder = Math.round(minutes % 60);
    return `${hours}h${String(remainder).padStart(2, "0")}${suffix}`;
  }
  return `${Math.round(minutes)}${suffix}`;
};

const formatOneDecimal = (value) => (Number.isFinite(value) ? Number(value.toFixed(1)) : "—");

const formatKpm = (workout) => {
  if (!workout.calories || !workout.minutes) return "0.00";
  return (workout.calories / workout.minutes).toFixed(2);
};

const formatPercentMax = (avgHr) => {
  if (!Number.isFinite(avgHr)) return 0;
  return Math.round((avgHr / 187) * 100);
};

const tableTime = (value) => String(value || "—")
  .replace(/(\d)(a)$/i, "$1 AM")
  .replace(/(\d)(p)$/i, "$1 PM")
  .replace(/\b(am|pm)\b/gi, (match) => match.toUpperCase());

const compactSleep = (value) => String(value || "")
  .replace(/\s+/g, "")
  .replace(/hours?/gi, "h")
  .replace(/mins?|minutes?/gi, "m");

const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const splitMarkdownRow = (line) => line
  .trim()
  .replace(/^\|/, "")
  .replace(/\|$/, "")
  .split("|")
  .map((cell) => cell.trim());

const isSeparatorRow = (cells) => cells.every((cell) => /^:?-{2,}:?$/.test(cell));

const extractMetric = (section, metric) => {
  const escapedMetric = metric.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matcher = new RegExp(`\\|\\s*(?:[*_]+)?${escapedMetric}(?:[*_]+)?\\s*\\|\\s*([^|\\n]+)`, "i");
  const match = section.match(matcher);
  return match ? match[1].trim() : null;
};

const extractSection = (text, starts, stops) => {
  const startPattern = Array.isArray(starts) ? starts.join("|") : starts;
  const stopPattern = Array.isArray(stops) ? stops.join("|") : stops;
  const matcher = new RegExp(`(?:^|\\n)(?:#{1,6}\\s*)?(?:${startPattern})[^\\n]*\\n([\\s\\S]*?)(?=\\n(?:#{1,6}\\s*)?(?:${stopPattern})[^\\n]*\\n|$)`, "i");
  const match = text.match(matcher);
  return match ? match[1] : "";
};

const parseDate = () => {
  if (explicitDate) {
    const explicitMatch = explicitDate.match(/^(202\d)-(\d{2})-(\d{2})$/);
    if (!explicitMatch) fail("--date must be YYYY-MM-DD");
    const date = new Date(`${explicitDate}T12:00:00`);
    const day = date.toLocaleDateString("en-US", { weekday: "short", timeZone: "America/New_York" });
    return {
      date: explicitDate,
      day,
      dateShort: `${Number(explicitMatch[2])}/${Number(explicitMatch[3])}`,
      label: `${day} ${Number(explicitMatch[2])}/${Number(explicitMatch[3])}`,
    };
  }

  const match = input.match(/\b(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(\d{1,2})\/(\d{1,2})\b/i);
  if (!match) fail("could not find date like Wed 5/27");
  const day = match[1][0].toUpperCase() + match[1].slice(1, 3).toLowerCase();
  const month = Number(match[2]);
  const dayOfMonth = Number(match[3]);
  const date = `2026-${String(month).padStart(2, "0")}-${String(dayOfMonth).padStart(2, "0")}`;
  return {
    date,
    day,
    dateShort: `${month}/${dayOfMonth}`,
    label: `${day} ${month}/${dayOfMonth}`,
  };
};

const parseMacros = () => {
  const section = extractSection(input, ["[^\\n]*Macros"], ["AM Markers", "Sleep", "Workouts", "Day Totals"]);
  const calories = normalizeNumber(extractMetric(section || input, "Calories"));
  const protein = normalizeNumber(extractMetric(section || input, "Protein"));
  const fat = normalizeNumber(extractMetric(section || input, "Fat"));
  const carbs = normalizeNumber(extractMetric(section || input, "Carbs"));
  return { calories, protein, fat, carbs };
};

const parseMarkers = () => {
  const section = extractSection(input, ["AM Markers", "AM Recovery", "Recovery"], ["Sleep", "Workouts", "Day Totals", "Macros"]);
  const weight = normalizeNumber(explicitWeight ?? extractMetric(section || input, "Weight"));
  const rhr = normalizeNumber(extractMetric(section || input, "RHR"));
  const hrv = normalizeNumber(extractMetric(section || input, "HRV"));
  return { weight, rhr, hrv };
};

const parseSleep = () => {
  const section = extractSection(input, ["Sleep"], ["AM Markers", "Workouts", "Day Totals", "Macros"]);
  const lines = section.split(/\r?\n/);
  let tableRow = null;
  for (let index = 0; index < lines.length; index += 1) {
    const cells = splitMarkdownRow(lines[index]);
    if (cells.length >= 5 && !isSeparatorRow(cells) && /[ap]m?|^\d{1,2}:\d{2}/i.test(cells[0])) {
      tableRow = cells;
    }
  }

  const stages = {
    core: section.match(/Core\s+([\dhm\s]+)/i)?.[1]?.trim() ?? null,
    rem: section.match(/REM\s+([\dhm\s]+)/i)?.[1]?.trim() ?? null,
    deep: section.match(/Deep\s+([\dhm\s]+)/i)?.[1]?.trim() ?? null,
    awake: section.match(/Awake\s+([\dhm\s~]+)/i)?.[1]?.trim()?.replace(/^~/, "") ?? null,
  };

  if (!tableRow) {
    return { bed: null, wake: null, asleep: null, inBed: null, efficiency: null, stages };
  }

  return {
    bed: normalizeTime(tableRow[0]),
    wake: normalizeTime(tableRow[1]),
    asleep: compactSleep(tableRow[2]),
    inBed: compactSleep(tableRow[3]),
    efficiency: normalizeNumber(tableRow[4]),
    stages,
  };
};

const parseWorkoutRows = () => {
  const section = extractSection(input, ["Workouts"], ["Day Totals", "AM Markers", "Sleep", "Macros"]);
  const rows = [];
  const lines = section.split(/\r?\n/);
  let headers = null;

  for (const line of lines) {
    if (!line.trim().startsWith("|")) continue;
    const cells = splitMarkdownRow(line);
    if (isSeparatorRow(cells)) continue;
    if (!headers) {
      headers = cells.map((cell) => cell.toLowerCase());
      continue;
    }
    const row = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });
    if (!row.activity) continue;
    rows.push({
      activity: row.activity,
      start: normalizeTime(row.start),
      end: normalizeTime(row.end),
      duration: normalizeDuration(row.duration),
      minutes: durationToMinutes(row.duration),
      avgHr: normalizeNumber(row["avg hr"]),
      maxHr: normalizeNumber(row.max),
      minHr: normalizeNumber(row.min),
      calories: normalizeNumber(row["apple cal"]),
    });
  }

  return rows;
};

const parseTotals = () => {
  const section = extractSection(input, ["Day Totals"], ["AM Markers", "Sleep", "Workouts", "Macros"]);
  return {
    steps: normalizeNumber(extractMetric(section || input, "Steps")),
    distance: extractMetric(section || input, "Distance"),
    floors: normalizeNumber(extractMetric(section || input, "Floors")),
    active: normalizeNumber(extractMetric(section || input, "Active kcal")),
    basal: normalizeNumber(extractMetric(section || input, "Basal kcal")),
    totalBurn: normalizeNumber(extractMetric(section || input, "Total burn")),
    exerciseMinutes: normalizeNumber(extractMetric(section || input, "Exercise min")),
    caloriesIn: normalizeNumber(extractMetric(section || input, "Calories in")),
    deficit: normalizeNumber(extractMetric(section || input, "Net deficit (Apple)") ?? extractMetric(section || input, "Net deficit")),
  };
};

const isWarmup = (workout) => /warmup/i.test(workout.activity);
const isWalking = (workout) => /walk/i.test(workout.activity);
const isStair = (workout) => /stair/i.test(workout.activity);
const isLift = (workout) => {
  if (/weight|lift|training/i.test(workout.activity) && !isWarmup(workout)) return true;
  if (/other/i.test(workout.activity) && workout.minutes >= 45 && (workout.avgHr ?? 0) >= 90) return true;
  return false;
};

const strengthAdjustment = (workout) => {
  if (!workout.calories) return null;
  const avgHr = workout.avgHr ?? 0;
  let factor = 0.5;
  if (avgHr >= 110) factor = 0.86;
  else if (avgHr >= 100) factor = 0.75;
  const adjusted = workout.calories * factor;
  return Math.round(adjusted / 5) * 5;
};

const cardioAdjustment = (workout) => {
  if (!workout.calories) return null;
  if (isWalking(workout)) return Math.round(workout.calories * 0.9 / 5) * 5;
  return workout.calories;
};

const dailyCardioCode = (workouts) => {
  const mainCardio = workouts.filter((workout) => isStair(workout) || isWalking(workout));
  if (!mainCardio.length) return "—";
  return mainCardio
    .filter((workout) => !isWalking(workout))
    .map((workout) => `S${Math.round(workout.minutes ?? 0)}`)
    .join(" + ") || mainCardio.map((workout) => `W${Math.round(workout.minutes ?? 0)}`).join(" + ");
};

const dailyLiftCode = (workouts) => {
  const lift = workouts.find((workout) => isLift(workout));
  if (!lift) return "No lift";
  return /other/i.test(lift.activity) ? `Lift ${Math.round(lift.minutes ?? 0)}` : `Weight ${Math.round(lift.minutes ?? 0)}`;
};

const buildWorkoutTitle = (workout) => `${workout.start}-${workout.end} · ${durationForTitle(workout.duration)}`;

const buildReportEvents = (workouts) => {
  const cardioEvents = workouts
    .filter((workout) => isStair(workout) || isWalking(workout))
    .map((workout) => ({
      label: isWalking(workout) ? "Walk" : /a$/.test(workout.start) ? "AM" : "PM",
      title: buildWorkoutTitle(workout),
      meta: `${workout.calories ?? "—"} kcal · ${isWalking(workout) ? "Walk" : "Stair"} · HR ${workout.avgHr ?? "—"}/${workout.maxHr ?? "—"}`,
      type: isWalking(workout) ? "Walking" : "StairMaster",
    }));

  const liftEvents = workouts
    .filter((workout) => isLift(workout))
    .map((workout) => {
      const adjusted = strengthAdjustment(workout);
      return {
        label: "Lift",
        title: buildWorkoutTitle(workout),
        meta: `${workout.calories ?? "—"} → ${adjusted ?? "—"} adj · HR ${workout.avgHr ?? "—"}/${workout.maxHr ?? "—"}`,
        type: /other/i.test(workout.activity) ? "Lift tagged Other" : "Weight Training",
      };
    });

  return { cardioEvents, liftEvents };
};

const loadAnalysisData = () => {
  const source = fs.readFileSync(analysisPath, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: analysisPath });
  return sandbox.window.PREP_ANALYSIS_DATA;
};

const writeObjectInArray = (source, property, matchDate, replacement) => {
  const propertyIndex = source.indexOf(`"${property}": [`);
  if (propertyIndex === -1) return { source, changed: false, reason: `${property} array not found` };
  const arrayStart = source.indexOf("[", propertyIndex);
  let depth = 0;
  let objectStart = -1;
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
        if (objectText.includes(`"date": "${matchDate}"`)) {
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
        objectStart = -1;
      }
    } else if (character === "]" && depth === 0) {
      break;
    }
  }
  return { source, changed: false, reason: `${property} ${matchDate} row not found` };
};

const replaceRowByDateCell = (html, dateCell, rowHtml) => {
  const escaped = dateCell.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matcher = new RegExp(`\\s*<tr><td class="date-cell">${escaped}</td>[\\s\\S]*?</tr>`);
  if (!matcher.test(html)) return { html, changed: false, reason: `${dateCell} row not found` };
  const nextHtml = html.replace(matcher, `\n            ${rowHtml}`);
  return { html: nextHtml, changed: nextHtml !== html, reason: dateCell };
};

const sectionBounds = (html, sectionId) => {
  const sectionStart = html.search(new RegExp(`<(?:section|details)[^>]+id="${sectionId}"`));
  if (sectionStart === -1) return null;
  const nextSectionMatch = html.slice(sectionStart + 1).match(/\n    <(?:section|details)\b/);
  const sectionEnd = nextSectionMatch ? sectionStart + 1 + nextSectionMatch.index : html.length;
  return { start: sectionStart, end: sectionEnd };
};

const upsertDateCellRowInSection = (html, sectionId, dateCell, rowHtml) => {
  const bounds = sectionBounds(html, sectionId);
  if (!bounds) return { html, changed: false, reason: `${sectionId} section not found` };

  const section = html.slice(bounds.start, bounds.end);
  const escapedDate = dateCell.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const existing = new RegExp(`\\n            <tr><td class="date-cell">${escapedDate}</td>[\\s\\S]*?</tr>`);
  let nextSection;
  if (existing.test(section)) {
    nextSection = section.replace(existing, `\n            ${rowHtml}`);
  } else {
    const rowDatePattern = /\n            <tr><td class="date-cell">(\d{4}-\d{2}-\d{2}|[A-Z][a-z]{2} \d{1,2}\/\d{1,2})<\/td>[\s\S]*?<\/tr>/g;
    let insertionIndex = section.indexOf("</tbody>");
    for (const match of section.matchAll(rowDatePattern)) {
      const currentDate = match[1].includes("-")
        ? match[1]
        : `2026-${match[1].split(" ")[1].split("/").map((part) => part.padStart(2, "0")).join("-")}`;
      const targetDate = dateCell.includes("-")
        ? dateCell
        : `2026-${dateCell.split(" ")[1].split("/").map((part) => part.padStart(2, "0")).join("-")}`;
      if (currentDate > targetDate) {
        insertionIndex = match.index;
        break;
      }
    }
    nextSection = `${section.slice(0, insertionIndex)}\n            ${rowHtml}${section.slice(insertionIndex)}`;
  }

  return {
    html: `${html.slice(0, bounds.start)}${nextSection}${html.slice(bounds.end)}`,
    changed: nextSection !== section,
    reason: `${sectionId} ${dateCell}`,
  };
};

const upsertDataDateRowsInSection = (html, sectionId, date, rowHtmls) => {
  const bounds = sectionBounds(html, sectionId);
  if (!bounds) return { html, changed: false, reason: `${sectionId} section not found` };

  const section = html.slice(bounds.start, bounds.end);
  const escapedDate = date.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rowMatcher = new RegExp(`\\n            <tr[^>]+data-date="${escapedDate}"[\\s\\S]*?</tr>`, "g");
  const existingRows = [...section.matchAll(rowMatcher)];
  const joinedRows = rowHtmls.length ? `\n            ${rowHtmls.join("\n            ")}` : "";
  let nextSection;
  if (existingRows.length) {
    const firstStart = existingRows[0].index;
    const lastMatch = existingRows.at(-1);
    const lastEnd = lastMatch.index + lastMatch[0].length;
    nextSection = `${section.slice(0, firstStart)}${joinedRows}${section.slice(lastEnd)}`;
  } else {
    const rowDatePattern = /\n            <tr[^>]+data-date="(\d{4}-\d{2}-\d{2})"[\s\S]*?<\/tr>/g;
    let insertionIndex = section.indexOf("</tbody>");
    for (const match of section.matchAll(rowDatePattern)) {
      if (match[1] > date) {
        insertionIndex = match.index;
        break;
      }
    }
    nextSection = `${section.slice(0, insertionIndex)}${joinedRows}${section.slice(insertionIndex)}`;
  }

  return {
    html: `${html.slice(0, bounds.start)}${nextSection}${html.slice(bounds.end)}`,
    changed: nextSection !== section,
    reason: `${sectionId} ${date} (${rowHtmls.length} row${rowHtmls.length === 1 ? "" : "s"})`,
  };
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

const dateInfo = parseDate();
const macros = parseMacros();
const markers = parseMarkers();
const sleep = parseSleep();
const workouts = parseWorkoutRows();
const totals = parseTotals();
const analysisData = loadAnalysisData();
const existingRow = (analysisData.reportLedger || []).find((row) => row.date === dateInfo.date);
const previousRow = [...(analysisData.reportLedger || [])]
  .filter((row) => row.date < dateInfo.date && typeof row.weight === "number")
  .at(-1);

const weight = markers.weight ?? existingRow?.weight ?? null;
const delta = weight !== null && previousRow?.weight ? Number((weight - previousRow.weight).toFixed(1)) : existingRow?.delta ?? null;
const { cardioEvents, liftEvents } = buildReportEvents(workouts);
const strengthReported = workouts.filter((workout) => isLift(workout)).reduce((total, workout) => total + (workout.calories ?? 0), 0);
const strengthAdjusted = workouts.filter((workout) => isLift(workout)).reduce((total, workout) => total + (strengthAdjustment(workout) ?? 0), 0);
const cardioReported = workouts.filter((workout) => isStair(workout)).reduce((total, workout) => total + (workout.calories ?? 0), 0);
const cardioAdjusted = workouts.filter((workout) => isStair(workout)).reduce((total, workout) => total + (cardioAdjustment(workout) ?? 0), 0);
const adjustedActive = totals.active !== null
  ? Math.round(totals.active - strengthReported + strengthAdjusted)
  : Math.round(cardioAdjusted + strengthAdjusted);

const reportRow = {
  date: dateInfo.date,
  day: dateInfo.day,
  dateShort: dateInfo.dateShort,
  phase: existingRow?.phase ?? "Agg/Rec",
  weight,
  delta,
  sleep: {
    total: sleep.asleep ?? existingRow?.sleep?.total ?? "Pending",
    detail: sleep.asleep
      ? `Night ${sleep.asleep} · ${sleep.efficiency ?? "—"}% · RHR ${markers.rhr ?? "—"} / HRV ${markers.hrv ?? "—"}`
      : existingRow?.sleep?.detail ?? "Sleep pending",
    rhr: markers.rhr,
    hrv: markers.hrv,
  },
  macros,
  cardioEvents,
  liftEvents,
  burn: {
    adjusted: adjustedActive,
    apple: totals.active,
  },
  decision: `${dateInfo.label} closed: ${macros.calories ?? "—"} cal / ${macros.protein ?? "—"}P / ${macros.fat ?? "—"}F / ${macros.carbs ?? "—"}C, ${totals.steps?.toLocaleString("en-US") ?? "—"} steps, ${totals.active ?? "—"} Apple active kcal, ${liftEvents.length ? liftEvents[0].type.toLowerCase() : "no lift"}, and ${cardioEvents.length ? cardioEvents.map((event) => `${event.type} ${event.title}`).join(" + ") : "no formal cardio"}.`,
};

const overviewRow = `<tr><td class="date-cell">${dateInfo.label}</td><td>${escapeHtml(reportRow.phase.replace("Agg/Rec", "Rec"))}</td><td class="num">${weight ?? "—"}</td><td class="num">${delta === null ? "—" : delta > 0 ? `+${delta}` : delta}</td><td>${sleep.asleep ?? "Pending"}${sleep.efficiency ? ` · ${sleep.efficiency}%` : ""}</td><td class="macro-line"><span class="low">${(macros.calories ?? "Pending").toLocaleString?.("en-US") ?? macros.calories}</span> · P${macros.protein ?? "—"} F${macros.fat ?? "—"} C${macros.carbs ?? "—"}</td><td class="wrap">${dailyCardioCode(workouts)}</td><td>${dailyLiftCode(workouts)}</td><td class="num">${totals.steps?.toLocaleString("en-US") ?? "—"}</td><td class="num">${totals.active?.toLocaleString("en-US") ?? "—"} / ~${adjustedActive.toLocaleString("en-US")}</td><td class="num">${markers.rhr ?? "—"} / ${markers.hrv ?? "—"}</td><td class="status">${liftEvents.some((event) => event.type === "Lift tagged Other") ? "Lift-tagged-Other treated as lift." : "Closed from pasted closeout."}</td></tr>`;
const sourceStamp = `Claude ${dateInfo.label} closeout pasted in Codex chat ${new Date().toISOString().slice(0, 10)}`;
const liftWorkouts = workouts.filter((workout) => isLift(workout));
const mainCardioWorkouts = workouts.filter((workout) => isStair(workout));
const supportCardioWorkouts = workouts.filter((workout) => isStair(workout) || isWalking(workout));
const cardioMinutes = mainCardioWorkouts.reduce((total, workout) => total + (workout.minutes ?? 0), 0);
const strengthMinutes = liftWorkouts.reduce((total, workout) => total + (workout.minutes ?? 0), 0);
const totalMainMinutes = cardioMinutes + strengthMinutes;
const totalReported = cardioReported + strengthReported;
const cardioEventRead = cardioEvents.length
  ? `${cardioEvents.length} cardio event${cardioEvents.length === 1 ? "" : "s"} (${cardioEvents.map((event) => event.type).join(" + ")})`
  : "no cardio events";
const sleepDetail = sleep.asleep
  ? `${sleep.asleep} asleep; ${sleep.inBed ?? "—"} in bed; ${sleep.efficiency ?? "—"}% efficiency; bed ${sleep.bed ?? "—"}; wake ${sleep.wake ?? "—"}; Core ${sleep.stages.core ?? "—"} / REM ${sleep.stages.rem ?? "—"} / Deep ${sleep.stages.deep ?? "—"} / Awake ${sleep.stages.awake ?? "—"}; RHR ${markers.rhr ?? "—"}; HRV ${markers.hrv ?? "—"}`
  : "Sleep pending";

const scorecardRow = `<tr><td class="date-cell">${dateInfo.date}</td><td>${escapeHtml(reportRow.phase.replace("Agg/Rec", "Aggressive/recoverable"))}</td><td class="num">${weight ?? "—"}</td><td>${escapeHtml(sleepDetail)}</td><td class="num">${macros.calories ?? "—"}</td><td class="num">${macros.protein ?? "—"}</td><td class="num">${macros.fat ?? "—"}</td><td class="num">${macros.carbs ?? "—"}</td><td class="num">${formatOneDecimal(cardioMinutes)}</td><td class="num">${cardioReported || "—"}</td><td class="num">${cardioAdjusted || "—"}</td><td class="num">${formatOneDecimal(strengthMinutes)}</td><td class="num">${strengthReported || "—"}</td><td class="num">${strengthAdjusted || "—"}</td><td class="num">${formatMinutes(totalMainMinutes, " main")}</td><td class="num">${totalReported ? `${totalReported.toLocaleString("en-US")} main` : "—"}</td><td class="num">${adjustedActive ? `${adjustedActive.toLocaleString("en-US")} day` : "—"}</td><td class="read">${escapeHtml(`${dateInfo.day} closed from pasted data: ${liftEvents.length ? liftEvents.map((event) => event.type).join(" + ") : "no lift"} plus ${cardioEventRead}.`)}</td><td class="read">${escapeHtml(`${macros.calories ?? "—"} calories with ${macros.protein ?? "—"}g protein; Apple net deficit ${totals.deficit ?? "—"} kcal. Use this as a closed day, not pending data.`)}</td><td class="read">Next AM weight; sleep; RHR; HRV; GI/stool; soreness; Energy/Hunger/Drive.</td></tr>`;

const feedbackRow = `<tr><td class="date-cell">${dateInfo.date}</td><td class="num">${weight ?? "—"}</td><td>GI check pending</td><td>Stool check pending</td><td>Needs score</td><td>Needs score</td><td>Needs score</td><td>Needs check-in</td><td>${escapeHtml(`${macros.calories ?? "—"} calories, ${liftEvents.length ? liftEvents.map((event) => event.type).join(" + ") : "no lift"}, ${dailyCardioCode(workouts)}, ${totals.steps?.toLocaleString("en-US") ?? "—"} steps, ${totals.active?.toLocaleString("en-US") ?? "—"} active kcal`)}</td><td class="read">${escapeHtml(delta === null ? "Scale read pending." : `${delta > 0 ? "Up" : "Down"} ${Math.abs(delta)} from prior weigh-in; interpret through GI, soreness, and subjective scores.`)}</td><td class="read">Close subjective loop: Energy / Hunger / Drive, GI/stool, soreness.</td></tr>`;

const trainingRows = liftWorkouts.map((workout) => {
  const adjusted = strengthAdjustment(workout);
  const kpm = formatKpm(workout);
  const percent = formatPercentMax(workout.avgHr);
  const type = /other/i.test(workout.activity) ? "unlabeled" : "unlabeled";
  const session = /other/i.test(workout.activity) ? "Lift tagged Other" : "Weight Training";
  const read = /other/i.test(workout.activity)
    ? "Watch tagged this as Other, but duration and HR profile read like a lift. Treat as lift in prep decisions, not miscellaneous cardio."
    : "Warmup excluded; strength calories are discounted for planning.";
  return `<tr data-type="${type}" data-date="${dateInfo.date}" data-duration="${(workout.minutes ?? 0).toFixed(2)}" data-reported="${workout.calories ?? 0}" data-adjusted="${adjusted ?? 0}" data-kpm="${kpm}" data-avg-hr="${workout.avgHr ?? 0}" data-max-hr="${workout.maxHr ?? 0}" data-pct="${percent}"><td class="date-cell">${dateInfo.date}</td><td>${session}</td><td class="time">${tableTime(workout.start)}</td><td class="time">${tableTime(workout.end)}</td><td class="time">${durationForTable(workout.duration)}</td><td class="num">${workout.calories ?? "—"}</td><td class="num">~${adjusted ?? "—"}</td><td class="num">${kpm}</td><td class="num">${workout.avgHr ?? "—"}</td><td class="num">${workout.maxHr ?? "—"}</td><td class="num">${percent}%</td><td>Z2/Z3 lift</td><td class="read">${escapeHtml(read)}</td><td class="source">${escapeHtml(sourceStamp)}</td></tr>`;
});

const cardioRows = supportCardioWorkouts.map((workout) => {
  const adjusted = cardioAdjustment(workout);
  const kpm = formatKpm(workout);
  const percent = formatPercentMax(workout.avgHr);
  const type = isWalking(workout) ? "walking" : "stairmaster";
  const session = isWalking(workout) ? "Walking" : "StairMaster";
  const read = isWalking(workout)
    ? "Support movement. Count in day totals and Data, not as the main StairMaster lever."
    : liftWorkouts.length
      ? "Main cardio block paired with lift; count as real StairMaster output."
      : "Main cardio block; count as real StairMaster output.";
  return `<tr data-type="${type}" data-date="${dateInfo.date}" data-duration="${(workout.minutes ?? 0).toFixed(2)}" data-reported="${workout.calories ?? 0}" data-adjusted="${adjusted ?? 0}" data-kpm="${kpm}" data-avg-hr="${workout.avgHr ?? 0}" data-max-hr="${workout.maxHr ?? 0}" data-pct="${percent}"><td class="date-cell">${dateInfo.date}</td><td>${session}</td><td class="time">${tableTime(workout.start)}</td><td class="time">${tableTime(workout.end)}</td><td class="time">${durationForTable(workout.duration)}</td><td class="num">${workout.calories ?? "—"}</td><td class="num">${isWalking(workout) ? `~${adjusted ?? "—"}` : adjusted ?? "—"}</td><td class="num">${kpm}</td><td class="num">${workout.avgHr ?? "—"}</td><td class="num">${workout.maxHr ?? "—"}</td><td class="num">${percent}%</td><td>—</td><td>${isWalking(workout) ? "Low" : "Z3 controlled"}</td><td class="read">${escapeHtml(read)}</td><td class="source">${escapeHtml(sourceStamp)}</td></tr>`;
});

const sleepRow = `<tr><td class="date-cell">${dateInfo.date}</td><td>${dateInfo.day}</td><td class="time">${tableTime(sleep.bed)}</td><td class="time">${tableTime(sleep.wake)}</td><td>${sleep.asleep ?? "—"}</td><td>${sleep.inBed ?? "—"}</td><td class="num">${sleep.efficiency ?? "—"}${sleep.efficiency ? "%" : ""}</td><td>${sleep.stages.core ?? "—"}</td><td>${sleep.stages.rem ?? "—"}</td><td>${sleep.stages.deep ?? "—"}</td><td>${sleep.stages.awake ?? "—"}</td><td class="num">${markers.rhr ?? "—"}</td><td class="num">${markers.hrv ?? "—"}</td><td class="read">${escapeHtml(`${sleep.asleep ?? "Sleep"} logged with RHR ${markers.rhr ?? "—"} and HRV ${markers.hrv ?? "—"}; use with soreness and subjective scores before changing levers.`)}</td><td class="source">${escapeHtml(sourceStamp)}</td></tr>`;

let analysisSource = fs.readFileSync(analysisPath, "utf8");
const reportPatch = writeObjectInArray(analysisSource, "reportLedger", dateInfo.date, reportRow);
analysisSource = reportPatch.source;

const changedFiles = [];
if (shouldWrite && reportPatch.changed) {
  fs.writeFileSync(analysisPath, analysisSource);
  changedFiles.push("analysis-data.js");
}

const dataLedgerPatchReasons = [];
if (shouldPatchDataLedger) {
  let ledgerHtml = fs.readFileSync(dataLedgerPath, "utf8");
  const overviewPatch = replaceRowByDateCell(ledgerHtml, dateInfo.label, overviewRow);
  ledgerHtml = overviewPatch.html;
  dataLedgerPatchReasons.push(overviewPatch.reason);

  const scorecardPatch = upsertDateCellRowInSection(ledgerHtml, "scorecard", dateInfo.date, scorecardRow);
  ledgerHtml = scorecardPatch.html;
  dataLedgerPatchReasons.push(scorecardPatch.reason);

  const feedbackPatch = upsertDateCellRowInSection(ledgerHtml, "feedback-loop", dateInfo.date, feedbackRow);
  ledgerHtml = feedbackPatch.html;
  dataLedgerPatchReasons.push(feedbackPatch.reason);

  const trainingPatch = upsertDataDateRowsInSection(ledgerHtml, "training", dateInfo.date, trainingRows);
  ledgerHtml = trainingPatch.html;
  dataLedgerPatchReasons.push(trainingPatch.reason);

  const cardioPatch = upsertDataDateRowsInSection(ledgerHtml, "cardio", dateInfo.date, cardioRows);
  ledgerHtml = cardioPatch.html;
  dataLedgerPatchReasons.push(cardioPatch.reason);

  const sleepPatch = upsertDateCellRowInSection(ledgerHtml, "sleep", dateInfo.date, sleepRow);
  ledgerHtml = sleepPatch.html;
  dataLedgerPatchReasons.push(sleepPatch.reason);

  if (shouldWrite && dataLedgerPatchReasons.length && ledgerHtml !== fs.readFileSync(dataLedgerPath, "utf8")) {
    fs.writeFileSync(dataLedgerPath, ledgerHtml);
    if (!changedFiles.includes("data-ledger.html")) changedFiles.push("data-ledger.html");
  }
}

const cacheTouched = cacheVersion && !shouldSkipCacheBust ? updateCacheBust(cacheVersion) : [];
for (const file of cacheTouched) {
  if (!changedFiles.includes(file)) changedFiles.push(file);
}

const summary = {
  mode: shouldWrite ? "write" : "dry-run",
  date: dateInfo.label,
  weight,
  macros,
  sleep: {
    asleep: sleep.asleep,
    efficiency: sleep.efficiency,
    rhr: markers.rhr,
    hrv: markers.hrv,
  },
  mainCardio: cardioEvents.map((event) => `${event.title} / ${event.meta}`),
  lift: liftEvents.map((event) => `${event.title} / ${event.meta} / ${event.type}`),
  dayTotals: {
    steps: totals.steps,
    active: totals.active,
    adjustedActive,
  },
  patches: [
    reportPatch.reason,
    ...(shouldPatchDataLedger ? dataLedgerPatchReasons : ["data-ledger skipped"]),
    cacheVersion && !shouldSkipCacheBust ? `cache bust ${cacheVersion}` : "cache bust unchanged",
  ],
  changedFiles,
  deployHint: !shouldWrite
    ? "dry-run only; no files written or deployed"
    : changedFiles.some((file) => file === "analysis-data.js" || file.endsWith(".html"))
      ? "visible prep dashboard changed; deploy only when Tyron explicitly asks for live publish"
      : "local-only change; no deploy needed",
  nextFastCheck: `npm run prep:check -- --tokens "${dateInfo.label}" "${macros.calories ?? ""}" "${cardioEvents[0]?.meta?.split(" ")[0] ?? ""}"`,
};

if (!shouldWrite) {
  console.log("Prep Runway closeout dry-run OK");
  console.log(JSON.stringify(summary, null, 2));
  console.log("Add --write to patch files.");
} else {
  console.log("Prep Runway closeout write OK");
  console.log(JSON.stringify(summary, null, 2));
}
