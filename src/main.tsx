import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Best-effort: reduces automatic eviction under storage pressure. Does not
// protect against the user manually clearing site data in the browser UI —
// see docs/superpowers/specs/2026-07-16-data-durability-backup-design.md.
navigator.storage?.persist?.().catch(() => {
  /* ignore — this is a nice-to-have, not load-bearing */
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
