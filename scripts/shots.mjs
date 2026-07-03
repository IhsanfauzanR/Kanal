// Capture doc screenshots from the running dev server (dev-time only).
// Usage: node scripts/shots.mjs [baseUrl]   (default http://localhost:5174)
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const base = process.argv[2] || 'http://localhost:5174'
const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'screenshots')
mkdirSync(outDir, { recursive: true })

const CHROME = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--hide-scrollbars', '--force-color-profile=srgb'],
})
const page = await browser.newPage()
await page.setViewport({ width: 402, height: 848, deviceScaleFactor: 2 })

async function setTheme(theme) {
  await page.evaluate((t) => {
    localStorage.setItem('kanal:theme', t)
  }, theme)
  await page.reload({ waitUntil: 'networkidle2' })
  await sleep(700)
}

async function clickText(text) {
  await page.evaluate((t) => {
    const el = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === t)
    el?.click()
  }, text)
  await sleep(500)
}

async function clickNav(label) {
  await page.evaluate((l) => {
    const el = [...document.querySelectorAll('nav button')].find((b) => b.textContent.includes(l))
    el?.click()
  }, label)
  await sleep(500)
}

async function shot(name) {
  await page.screenshot({ path: join(outDir, name), type: 'png' })
  console.log('shot', name)
}

await page.goto(base, { waitUntil: 'networkidle2' })

// --- dark ---
await setTheme('dark')
await clickNav('Beranda')
await shot('beranda-dark.png')

await clickNav('Catatan')
await shot('catatan.png')

await clickNav('Aset')
await shot('aset.png')

await clickNav('Statistik')
await sleep(900) // lazy chunk + 3D warmup
await clickText('Kalender')
await shot('kalender.png')
await clickText('Runway')
await sleep(400)
await shot('runway.png')
await clickText('Suasana')
await sleep(400)
await shot('suasana.png')
await clickText('Aliran')
await sleep(1600) // let the river populate
await shot('aliran.png')

// catat sheet (from Beranda)
await clickNav('Beranda')
await clickText('Catat transaksi')
await sleep(500)
await shot('catat-transaksi.png')

// --- light ---
await setTheme('light')
await clickNav('Beranda')
await shot('beranda-light.png')

await browser.close()
console.log('done →', outDir)
