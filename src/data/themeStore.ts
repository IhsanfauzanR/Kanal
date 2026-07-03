// Theme choice (Stage Final §4.5). Dark stays primary; light is a palette
// translation; "system" follows prefers-color-scheme. The effective theme is
// written to `data-theme` on <html>, which drives every --token in index.css.
//
// Persistence is a plain string under `kanal:theme` (not zustand/persist's
// wrapped JSON) so the inline no-flash bootstrap in index.html reads the same
// value before React mounts.

import { create } from 'zustand'

export type ThemeChoice = 'dark' | 'light' | 'system'
export type EffectiveTheme = 'dark' | 'light'

const STORAGE_KEY = 'kanal:theme'

function systemTheme(): EffectiveTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readStored(): ThemeChoice {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'dark' || v === 'light' || v === 'system') return v
  } catch {
    /* private mode / disabled storage — fall through to default */
  }
  return 'dark'
}

export function resolveTheme(choice: ThemeChoice): EffectiveTheme {
  return choice === 'system' ? systemTheme() : choice
}

function apply(effective: EffectiveTheme) {
  const root = document.documentElement
  root.dataset.theme = effective
  root.classList.toggle('dark', effective === 'dark')
  // Keep the address-bar / status-bar colour in step with the surface.
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])')
  if (meta) meta.content = effective === 'dark' ? '#09090b' : '#fafafa'
}

interface ThemeStore {
  choice: ThemeChoice
  effective: EffectiveTheme
  setChoice: (c: ThemeChoice) => void
}

const initialChoice = readStored()

export const useThemeStore = create<ThemeStore>((set) => ({
  choice: initialChoice,
  effective: resolveTheme(initialChoice),
  setChoice: (choice) => {
    try {
      localStorage.setItem(STORAGE_KEY, choice)
    } catch {
      /* ignore write failures */
    }
    const effective = resolveTheme(choice)
    apply(effective)
    set({ choice, effective })
  },
}))

// Follow the OS when the choice is "system". Registered once at module load.
if (typeof window !== 'undefined' && window.matchMedia) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const onChange = () => {
    const { choice } = useThemeStore.getState()
    if (choice !== 'system') return
    const effective = resolveTheme('system')
    apply(effective)
    useThemeStore.setState({ effective })
  }
  if (mq.addEventListener) mq.addEventListener('change', onChange)
  else mq.addListener(onChange)
}

// Sync the DOM with the store on first import (the inline bootstrap already set
// data-theme, but this reconciles after any storage change during the session).
export function initTheme() {
  apply(useThemeStore.getState().effective)
}
