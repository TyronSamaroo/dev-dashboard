# Prep Runway Fast Update

Use this path for daily closeouts and morning weigh-ins. Do not run the full browser/build/deploy loop unless layout changed or production needs publishing.

## Weight-only check-in

Fastest path when Tyron gives only a morning weight and optional quality note:

```bash
cd frontend
npm run prep:weight -- --date 2026-05-29 --weight 153.3 --note "Timing caveat" --cache-version 20260529-weight --write
npm run prep:check -- --tokens "Fri 5/29" "153.3" "Timing caveat"
npm run prep:check:data -- --tokens "Fri 5/29" "153.3" "timing caveat" "2026-05-29"
```

This updates `analysis-data.js`, the visible Today row, the Data Ledger compact row, the forecast actual row, and shared cache-bust refs. It intentionally leaves macros, sleep, workouts, and burns pending until a real closeout arrives.

## Data-only closeout

Fastest path when Tyron pastes a Claude-style day closeout:

```bash
cd frontend
npm run prep:close -- --input /tmp/prep-closeout.md --weight 153.6 --cache-version 20260528-wed --write
npm run prep:check -- --tokens "Wed 5/27" "945" "548 kcal"
```

This updates `analysis-data.js`, the Data Ledger compact row, Daily Scorecard Detail, Feedback Loop, Training, Cardio, Sleep + Recovery, and shared cache-bust refs. Use `--today-only` when the visible Today page is enough and the raw Data Ledger can wait. Use `--no-cache-bust` when this is local-only.

Latency guardrails:

- Do not run broad `find ..` or broad `rg` across `training-analytics.html`; it contains a huge inline workout dataset.
- For daily data-only edits, do not run Browser, full route sweeps, or Vercel deploy unless Tyron explicitly asks for live publish.
- Close the visible Today row first, then decide whether Data Ledger/detail rows need the same update.

Manual fallback:

1. Update `analysis-data.js` first:
   - `todayStatus`
   - latest `reportLedger` row
   - `sourceMap` / `dataHealth` only if freshness changed
   - cardio summary only if StairMaster sessions changed
2. Run the fast Today check:
   - `cd frontend`
   - `npm run prep:check -- --tokens "Tue 5/26" "1,075" "195P" "21,058"`
3. Stop and report the Today page is locally updated.

## When to update more surfaces

- Update `data-ledger.html` only when Tyron asks for raw rows, filters, or CSV-style evidence.
- Update `training-analytics.html` only when the session explorer/cardio analytics changed.
- Run `npm run build` only after UI/layout/script changes.
- Deploy only when Tyron asks to publish or verify live.

## Classification rules

- Warmups stay out of Daily Master main cards.
- StairMaster sessions are main cardio cards.
- Movie/easy walks count in day totals and Data Ledger movement, not as the main cardio decision unless explicitly requested.
- Current-day pending fields are acceptable; the latest closed day should have weight, sleep, macros, events, Apple active burn, and adjusted burn.
