// Generates the PWA / favicon / OG raster assets from the Kanal mark SVGs.
// Run: node scripts/gen-icons.mjs   (dev-time only; outputs to public/).
import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pub = join(root, 'public')
const iconsDir = join(pub, 'icons')
mkdirSync(iconsDir, { recursive: true })

const standard = readFileSync(join(pub, 'favicon.svg'), 'utf8')
const maskable = readFileSync(join(pub, 'icon-maskable.svg'), 'utf8')

function png(svg, size) {
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    font: { loadSystemFonts: true },
  })
    .render()
    .asPng()
}

const jobs = [
  ['icons/icon-192.png', standard, 192],
  ['icons/icon-512.png', standard, 512],
  ['icons/icon-180.png', standard, 180],
  ['icons/favicon-32.png', standard, 32],
  ['icons/icon-512-maskable.png', maskable, 512],
]
for (const [out, svg, size] of jobs) {
  writeFileSync(join(pub, out), png(svg, size))
  console.log('wrote', out, `(${size}px)`)
}

// Open Graph card (1200×630): dark field, the mark, wordmark, teal accent line.
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#09090b"/>
  <g transform="translate(232 174) scale(0.55)">
    <rect x="178" y="128" width="26" height="256" rx="13" fill="#fafafa"/>
    <rect x="308" y="128" width="26" height="256" rx="13" fill="#fafafa"/>
    <rect x="228" y="243" width="56" height="26" rx="13" fill="#77aeab"/>
  </g>
  <text x="562" y="330" font-family="Geist, Segoe UI, Arial, sans-serif" font-size="150" font-weight="500" letter-spacing="-6" fill="#fafafa">Kanal</text>
  <rect x="566" y="366" width="110" height="4" rx="2" fill="#77aeab"/>
  <text x="566" y="428" font-family="Consolas, monospace" font-size="30" fill="#71717a">Pencatat keuangan pribadi yang tenang.</text>
</svg>`
writeFileSync(join(pub, 'og-image.png'), png(og, 1200))
console.log('wrote og-image.png (1200×630)')
