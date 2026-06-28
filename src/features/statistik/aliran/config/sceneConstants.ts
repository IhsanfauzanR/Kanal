// Aliran scene constants — the designer-facing tuning surface.
// Every magic number (heights, positions, durations, colors) lives here so
// component code stays declarative. See KANAL_STAGE_3C_BRIEF.md §5.
//
// 3A guardrails baked in: frost palette (saturation < 15% for water), cold
// singular lighting, contemplative motion (8–12s traversal), geometric
// sources/destinations.

import * as THREE from 'three'

// ---- Coordinate system (§5.1) -------------------------------------------
// Origin = centre of the river plane. X = flow direction (left→right).
export const RIVER = {
  minX: -8,
  maxX: 8,
  minZ: -3,
  maxZ: 3,
  y: -0.05, // slightly below origin so particles float above the surface
} as const

// ---- Camera (§5.2) -------------------------------------------------------
export const CAMERA = {
  position: [0, 4.5, 9] as [number, number, number],
  target: [0, 0, 0] as [number, number, number],
  fov: 45, // narrower than default — more cinematic
  near: 0.1,
  far: 50,
} as const

// ---- OrbitControls constraints (§5.2) -----------------------------------
export const ORBIT = {
  enableDamping: true,
  dampingFactor: 0.05,
  enablePan: false, // keeps the user oriented
  minDistance: 6,
  maxDistance: 14,
  minPolarAngle: Math.PI * 0.15, // no diving under
  maxPolarAngle: Math.PI * 0.45, // no directly overhead
  rotateSpeed: 0.4, // slow, deliberate
} as const

// ---- Camera rig idle drift + dolly (§5.3) -------------------------------
export const CAMERA_RIG = {
  idleDelay: 3, // seconds of stillness before drift begins
  driftXAmp: 0.3,
  driftXFreq: 0.05,
  driftYAmp: 0.15,
  driftYFreq: 0.07,
  dollyDurationMs: 800,
} as const

// ---- Lighting (§5.4) — cold, singular, no shadows -----------------------
export const LIGHTING = {
  ambient: { color: '#a8b5b8', intensity: 0.15 }, // cool gray base
  key: {
    color: '#d8e4e6', // cool white, NOT warm
    intensity: 0.55,
    position: [3, 8, 4] as [number, number, number], // above-front
  },
  hemisphere: { sky: '#0f1419', ground: '#000000', intensity: 0.25 },
} as const

// ---- Fog (§5.5) — Zinc-950 atmosphere, hides scene edges ----------------
export const FOG = {
  color: '#09090b',
  near: 12,
  far: 35,
} as const

// ---- Palette (frost; 3A rules 1 & 4) ------------------------------------
export const COLORS = {
  base: '#09090b', // Zinc-950 — river/fog base
  accent: '#7CB1AE', // Glacial Teal ≈ oklch(65% 0.06 200), income
  expense: '#C16B5B', // muted red ≈ oklch(62% 0.12 25), expense
  sourcePrism: '#2a3a3c', // dark teal-tinted zinc
  destRidge: '#2a2d30', // Zinc-800-ish, achromatic
  label: '#a1a1aa', // Zinc-400
} as const

// ---- Sources — 5 income prisms (§5.6) -----------------------------------
export const SOURCES = {
  x: -8,
  zOffsets: [-2.4, -1.2, 0, 1.2, 2.4],
  prismSize: 0.18, // square cross-section
  material: {
    color: COLORS.sourcePrism,
    metalness: 0.1,
    roughness: 0.7,
    emissive: COLORS.accent,
    emissiveIntensity: 0.08,
  },
  pulse: { min: 0.06, max: 0.12, periodSec: 4 },
} as const

// ---- Destinations — 7 expense ridges (§5.7) -----------------------------
export const DESTINATIONS = {
  x: 8,
  step: {
    baseW: 0.6,
    baseD: 0.3,
    baseH: 0.15,
    midW: 0.45,
    midD: 0.22,
    topW: 0.3,
    topD: 0.15,
  },
  material: {
    color: COLORS.destRidge,
    metalness: 0.15,
    roughness: 0.85,
    // NO emissive — destinations are achromatic, only sources glow.
  },
} as const

// ---- Shared log height scale (§5.6 / §5.7) ------------------------------
// Maps IDR total → Y units. log10 so Rp 100k and Rp 1M aren't a 10× ratio.
export function heightForTotal(total: number): number {
  return Math.log10(total / 10000 + 1) * 1.5
}

// ---- Water field (§5.8, revised) ----------------------------------------
// The whole visible floor is one wavy water surface (user revision). Real
// vertex displacement (not a flat plane + shimmer), frost-toned, lit. A single
// bounded plane covers the view — OrbitControls has no pan and a fixed target,
// so the visible ground is bounded; distance fog + a soft radial edge hide the
// border without chunk streaming. Lives inside SceneFit, so all units are
// scene-space (scaled with the banks for a consistent wave-to-bank ratio).
export const WATER = {
  size: 70, // scene units, square
  segments: 150, // GPU vertex displacement is cheap; calm swells need less
  y: RIVER.y, // mean surface, just below the bank bases at y=0
  amplitude: 0.08, // calm, still water — gentle directional swell, not chop
  colorDeep: '#0a1314', // trough — near-black cold
  colorCrest: '#1d3331', // crest — dark frost teal, low saturation
  spec: '#8fb8b3', // soft cool sheen (broad, not sharp glints)
  edgeStartFraction: 0.45, // radial alpha fade begins → rim
} as const

// Key-light direction for the water shader (points from the light to origin).
export const KEY_LIGHT_DIR: [number, number, number] = [
  LIGHTING.key.position[0],
  LIGHTING.key.position[1],
  LIGHTING.key.position[2],
]

// ---- Particles (§5.9) ---------------------------------------------------
export const PARTICLES = {
  hardCap: 200,
  durationRange: [8, 12] as [number, number], // seconds, full traversal
  sizeMin: 0.04,
  sizeMax: 0.12,
  colorIncome: COLORS.accent,
  colorExpense: COLORS.expense,
  absorbDurationSec: 0.3,
} as const

export function particleSize(amount: number): number {
  const s = 0.04 + Math.log10(amount / 5000 + 1) * 0.025
  return Math.min(PARTICLES.sizeMax, Math.max(PARTICLES.sizeMin, s))
}

// ---- Quality tiers (§8.1) -----------------------------------------------
export const QUALITY = {
  high: { dpr: [1, 2] as [number, number], particleCap: 200, bloom: true },
  medium: { dpr: 1 as const, particleCap: 120, bloom: false },
  low: { dpr: 1 as const, particleCap: 60, bloom: false },
} as const

// ---- Bloom (§5.10) — subtle cinematic glow on the bright particles ------
// Wired via three-stdlib's EffectComposer/UnrealBloomPass (three 0.160-safe),
// not @react-three/postprocessing (its peer wants three ≥0.168). DOF skipped
// (§5.10: optional, drop if perf-risky).
export const BLOOM = {
  strength: 0.55,
  radius: 0.6, // wider, softer halo for a smooth diffuse glow
  threshold: 0.5, // only the bright additive particle cores bloom, not the water
} as const

// ---- Auto performance tiering (§8.1) ------------------------------------
export const PERF = {
  sampleSec: 1, // FPS sampling window
  lowFps: 40, // below this for a sustained streak → downgrade
  streakToDowngrade: 3, // consecutive low windows before stepping down
} as const

// Reusable temp objects so per-frame code never allocates.
export const TMP = {
  object3D: new THREE.Object3D(),
  vec: new THREE.Vector3(),
  color: new THREE.Color(),
} as const
