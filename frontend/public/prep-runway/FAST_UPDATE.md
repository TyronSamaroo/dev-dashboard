# Prep Runway Fast Update

Use this path for daily closeouts and morning weigh-ins. Do not run the full browser/build/deploy loop unless layout changed or production needs publishing.

## Data-only closeout

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
