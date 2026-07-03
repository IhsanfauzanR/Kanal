// Per-theme colour palette for the Aliran 3D scene (Stage Final revision:
// light mode recolours the scene — colours ONLY; geometry, motion, lighting
// intensities and camera stay exactly as built in Stage 3C).
//
// Dark values are re-exports of the locked sceneConstants so dark rendering is
// bit-identical. Light values follow the brief §4.5: Zinc-50→100 atmosphere,
// lighter zinc prisms/ridges, darker label text for contrast.

import { COLORS, DESTINATIONS, FOG, LIGHTING, SOURCES, WATER } from './sceneConstants'
import { useThemeStore } from '../../../../data/themeStore'

export interface ScenePalette {
  key: 'dark' | 'light'
  fog: string
  label: string
  sourcePrism: string
  destRidge: string
  waterDeep: string
  waterCrest: string
  waterSpec: string
  hemisphereSky: string
  hemisphereGround: string
  particleIncome: string
  particleExpense: string
  // Additive blending glows on dark but washes out to white on a light field —
  // light mode draws the same particles with normal blending instead.
  additiveParticles: boolean
}

const DARK: ScenePalette = {
  key: 'dark',
  fog: FOG.color,
  label: COLORS.label,
  sourcePrism: SOURCES.material.color,
  destRidge: DESTINATIONS.material.color,
  waterDeep: WATER.colorDeep,
  waterCrest: WATER.colorCrest,
  waterSpec: WATER.spec,
  hemisphereSky: LIGHTING.hemisphere.sky,
  hemisphereGround: LIGHTING.hemisphere.ground,
  particleIncome: COLORS.accent,
  particleExpense: COLORS.expense,
  additiveParticles: true,
}

const LIGHT: ScenePalette = {
  key: 'light',
  fog: '#f4f4f5', // Zinc-100 atmosphere
  label: '#52525b', // Zinc-600 — readable on the light field
  sourcePrism: '#aec4c2', // light frost teal
  destRidge: '#c4c8cc', // light achromatic zinc
  waterDeep: '#ccd8d6', // trough — pale frost
  waterCrest: '#eaf0ef', // crest — near Zinc-100, teal-tinted
  waterSpec: '#7fa39f', // same hue family, quieter on light
  hemisphereSky: '#e9edee',
  hemisphereGround: '#fafafa',
  particleIncome: '#2e6f6a', // darker teal so orbs read on the pale water
  particleExpense: '#a44e3e', // darker muted red
  additiveParticles: false,
}

export function useScenePalette(): ScenePalette {
  const effective = useThemeStore((s) => s.effective)
  return effective === 'light' ? LIGHT : DARK
}
