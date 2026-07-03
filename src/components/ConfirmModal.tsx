// Small centred confirm modal (Stage Final). Factual, neutral — no red on the
// confirm button, no alarm language (§4.2: "Hapus akun … Riwayat transaksi tetap
// tersimpan."). Fades + lifts a touch on open; Escape / backdrop cancels.

import { useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

interface ConfirmModalProps {
  open: boolean
  title: string
  body?: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Batal',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  return (
    // Direct keyed children only — a fragment breaks AnimatePresence's exit
    // tracking (ghost overlay that eats taps).
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          className="absolute inset-0 z-[60] bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.18 }}
          onClick={onCancel}
          aria-hidden="true"
        />
      )}
      {open && (
          <motion.div
            key="modal"
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            className="absolute inset-x-6 top-1/2 z-[70] -translate-y-1/2 rounded-2xl border border-kanal-line bg-kanal-bg p-5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: reduce ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="text-[15px] font-medium text-kanal-fg">{title}</div>
            {body && <p className="mt-2 text-[13px] leading-relaxed text-kanal-fg3">{body}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-[10px] px-4 py-2 text-sm font-medium text-kanal-fg2 transition-transform active:scale-[0.98]"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="rounded-[10px] border border-kanal-line bg-kanal-surf2 px-4 py-2 text-sm font-medium text-kanal-fg transition-transform active:scale-[0.98]"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
      )}
    </AnimatePresence>
  )
}
