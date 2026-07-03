// Subtle install prompt (Stage Final §4.6). On Android/Chrome the browser fires
// `beforeinstallprompt`; we stash it and offer a quiet dismissible banner at the
// foot of Beranda. Declining hides it for 7 days. Never shown once installed.

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'kanal:install-dismissed'
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function recentlyDismissed(): boolean {
  try {
    const ts = Number(localStorage.getItem(DISMISS_KEY) || 0)
    return ts > 0 && Date.now() - ts < WEEK_MS
  } catch {
    return false
  }
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export function PwaInstallBanner() {
  const reduce = useReducedMotion()
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setEvt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      /* ignore */
    }
    setVisible(false)
  }

  const install = async () => {
    if (!evt) return
    await evt.prompt()
    await evt.userChoice
    setVisible(false)
    setEvt(null)
  }

  return (
    <AnimatePresence>
      {visible && evt && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          className="mx-[22px] mb-4 flex items-center gap-3 rounded-[14px] border border-kanal-line bg-kanal-surf px-4 py-3"
        >
          <p className="min-w-0 flex-1 text-[13px] leading-snug text-kanal-fg2">
            Pasang Kanal di layar utama untuk akses cepat.
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="flex-none p-1 text-[13px] text-kanal-fg3 transition-transform active:scale-95"
          >
            Nanti
          </button>
          <button
            type="button"
            onClick={install}
            className="flex-none rounded-[9px] border border-kanal-teal-bd bg-kanal-teal-tint px-3 py-1.5 text-[13px] font-medium text-kanal-teal transition-transform active:scale-[0.97]"
          >
            Pasang
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
