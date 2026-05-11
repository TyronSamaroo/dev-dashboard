# tyronsamaroo.dev main site hub

This Vite app is the main public/private web hub served at `https://tyronsamaroo.dev`.
It combines the React portfolio/dashboard app with static artifacts copied in from
`/Users/tyronsamaroo/Documents/Claude_Cowork`.

Last audited: 2026-05-05.

## Project identity

- Local source: `/Users/tyronsamaroo/CodeProjects/dev-dashboard/frontend`
- Parent repo: `/Users/tyronsamaroo/CodeProjects/dev-dashboard`
- Vercel project name: `frontend`
- Vercel project ID: `prj_DuMuspawgKhvQQ9wxoG9EQxdDrJR`
- Vercel org/team ID: `team_2SNur5LgDBxlkxOhyuEfN42R`
- Live domain: `https://tyronsamaroo.dev`

## Commands

Run these from `/Users/tyronsamaroo/CodeProjects/dev-dashboard/frontend`.

```sh
npm install
npm run dev
npm run build
npm run preview
```

Before editing or deploying, check the parent repo status:

```sh
git -C /Users/tyronsamaroo/CodeProjects/dev-dashboard status --short --branch
```

## Route map

| Route | Local file/source | Purpose |
| --- | --- | --- |
| `/` | `src/App.tsx`, `src/pages/*`, `src/components/*` | Main React site/dashboard shell. |
| `/coach-report/` | `public/coach-report/index.html`, `public/coach-report/report.html` | Current private bodybuilding coach report surface. |
| `/coach-report-wk12/` | `public/coach-report-wk12/*` | Older coach report snapshot kept for reference. |
| `/grocery/` | `public/grocery/index.html`, `public/grocery/data.json` | Grocery dashboard and current grocery data. |
| `/grocery/prices/` | `public/grocery/prices/index.html` | Grocery price comparison view. |
| `/grocery/shopping-list/` | `public/grocery/shopping-list/index.html` | Grocery shopping list view. |
| `/grocery/trips/` | `public/grocery/trips/index.html` | Grocery trip history view. |
| `/training-program/` | `public/training-program/index.html` | Training program static surface. |
| `/love/what-i-built-this-week/` | `public/love/what-i-built-this-week/index.html` | Tiffany-facing weekly build/coding review page. |
| `/coding-review/tiffany-week-2026-05-03/` | `public/coding-review/tiffany-week-2026-05-03/index.html` | Redirect shim to the current love/coding-review page. |

## Claude_Cowork source map

These files in `public/` are deployed copies. When possible, update the source in
`Claude_Cowork` first, regenerate/copy the public artifact, then build and deploy.

| Site surface | Source of truth / generator |
| --- | --- |
| Coach report | `/Users/tyronsamaroo/Documents/Claude_Cowork/Bodybuilding/Contest Prep/scripts/build_report.py` and `/Users/tyronsamaroo/Documents/Claude_Cowork/Bodybuilding/Contest Prep/reports/coach-reports/` |
| Grocery dashboard/data | `/Users/tyronsamaroo/Documents/Claude_Cowork/Finance/Groceries/build-data.py`, `/Users/tyronsamaroo/Documents/Claude_Cowork/Finance/Groceries/data.json`, `price-comparison.md`, `shopping-list.md`, and `trip-history/` |
| Training/program artifacts | `/Users/tyronsamaroo/Documents/Claude_Cowork/Bodybuilding/Contest Prep/` |
| Life dashboard/reference surfaces | `/Users/tyronsamaroo/Documents/Claude_Cowork/Dashboard/` |

## Deployment notes

This project has two Vercel config files:

- `/Users/tyronsamaroo/CodeProjects/dev-dashboard/vercel.json`
- `/Users/tyronsamaroo/CodeProjects/dev-dashboard/frontend/vercel.json`

The root config currently contains the more complete static route rewrites. The
frontend config is the one beside `.vercel/project.json`. Live routes have worked
with the current setup, so do not reconcile these configs blindly. Verify the
active deploy path and route behavior before changing either file.

## Cleanup rules

- Do not edit generated `public/` artifacts without checking the source folder first.
- Do not push directly to `main` unless Tyron explicitly asks for it.
- Keep private reports, grocery data, and family-facing pages out of generic cleanup.
- Treat `.DS_Store`, old Vite starter assets, build outputs, and temporary exports as cleanup candidates only after checking current usage.
