// Picks the homepage after `vite build`.
// Edit frontend/site-home.txt: a design slug from /site/ (e.g. blueprint-v5, kinetic-v5),
// or "dashboard" to bring back the original React homepage. The React app always lives at /app.html
// and still handles /manage, /projects/* etc. via the catch-all rewrite in vercel.json.
import { readFileSync, copyFileSync, existsSync } from 'node:fs'
const root = new URL('../', import.meta.url)
const dist = new URL('dist/', root)
copyFileSync(new URL('index.html', dist), new URL('app.html', dist))
const home = readFileSync(new URL('site-home.txt', root), 'utf8').trim()
if (home && home !== 'dashboard') {
  const src = new URL(`site/${home}.html`, dist)
  if (!existsSync(src)) { console.error(`set-home: dist/site/${home}.html not found (check frontend/site-home.txt)`); process.exit(1) }
  copyFileSync(src, new URL('index.html', dist))
  console.log(`set-home: homepage = /site/${home}.html`)
} else {
  console.log('set-home: homepage = React dashboard')
}
