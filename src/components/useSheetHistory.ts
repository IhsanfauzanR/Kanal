// Back-gesture support for sheets (mobile). While at least one sheet is open,
// the app holds ONE history entry flagged `kanalSheets`; the Android back
// gesture/button then closes the topmost open sheet instead of leaving the
// app. Closing a sheet any other way (button, drag, Escape) consumes the entry
// when it was the last sheet, so history never accumulates.
//
// A single module-level stack (instead of one entry per sheet) makes this
// immune to the async-back race: `history.back()` resolves later than a quick
// re-open, and per-sheet entries would then close the freshly opened sheet.

import { useEffect, useRef } from 'react'

type Entry = { close: () => void }

const FLAG = 'kanalSheets'
const stack: Entry[] = []
let armed = false

function flagged(): boolean {
  return Boolean((window.history.state as { [FLAG]?: boolean } | null)?.[FLAG])
}

function arm() {
  window.history.pushState({ [FLAG]: true }, '')
  armed = true
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    if (stack.length === 0) {
      armed = false
      return
    }
    // Still flagged after the pop → the pop consumed a stale entry above ours
    // (a pending programmatic back). Our entry is intact; nothing to close.
    if (flagged()) return

    armed = false
    const top = stack.pop()
    top?.close()
    // Sheets remain underneath (stacked sheets) — re-arm for them.
    if (stack.length > 0) arm()
  })
}

export function useSheetHistory(open: boolean, onClose: () => void) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return
    const entry: Entry = { close: () => closeRef.current() }
    stack.push(entry)
    if (!armed) arm()

    return () => {
      const i = stack.indexOf(entry)
      if (i === -1) return // already consumed by a popstate close
      stack.splice(i, 1)
      // Last sheet closed programmatically: consume the history entry.
      if (stack.length === 0 && flagged()) {
        armed = false
        window.history.back()
      }
    }
  }, [open])
}
