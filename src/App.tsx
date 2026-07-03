import { useEffect } from 'react'
import { AppShell } from './app/AppShell'
import { useTxStore } from './data/txStore'
import { initTheme } from './data/themeStore'

export default function App() {
  // Load transactions from IndexedDB once (seeds from the bundled import on
  // first ever run) and reconcile the theme applied by the inline bootstrap.
  useEffect(() => {
    void useTxStore.getState().init()
    initTheme()
  }, [])

  return <AppShell />
}
