// Shared bottom sheet (Stage Final). One home for the sheet motion so every
// overlay behaves identically: calm spring slide-up (no overshoot — Kanal never
// bounces), backdrop fade, drag-down to dismiss, Escape to close, focus moved
// in on open. prefers-reduced-motion collapses to an instant show/hide and
// disables drag. Anchored to the phone frame (nearest `relative` ancestor).

import { useEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from '@phosphor-icons/react'
import { useSheetHistory } from './useSheetHistory'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  ariaLabel: string
  children: ReactNode
  footer?: ReactNode
  maxHeight?: string
  showClose?: boolean
}

export function BottomSheet({
  open,
  onClose,
  ariaLabel,
  children,
  footer,
  maxHeight = '86%',
  showClose = true,
}: BottomSheetProps) {
  const reduce = useReducedMotion()
  const sheetRef = useRef<HTMLDivElement>(null)

  // Android back gesture/button closes the sheet instead of exiting the app.
  useSheetHistory(open, onClose)

  useEffect(() => {
    if (!open) return
    sheetRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    // Direct keyed children only — a fragment here breaks AnimatePresence's
    // exit tracking and leaves a ghost backdrop that eats every tap.
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          className="absolute inset-0 z-40 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      {open && (
          <motion.div
            key="sheet"
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            tabIndex={-1}
            style={{ maxHeight }}
            className="absolute inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[26px] border-t border-kanal-line bg-kanal-bg shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.45)] focus:outline-none"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={
              reduce
                ? { duration: 0 }
                : { type: 'spring', stiffness: 130, damping: 26, mass: 0.9 }
            }
            drag={reduce ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 650) onClose()
            }}
          >
            <div className="relative flex-none pt-2.5">
              <span
                aria-hidden="true"
                className="mx-auto block h-1 w-9 rounded-full bg-kanal-handle"
              />
              {showClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Tutup"
                  className="absolute right-3 top-1.5 flex p-1 text-kanal-fg3 transition-transform active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kanal-teal"
                >
                  <X size={19} />
                </button>
              )}
            </div>

            <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
              {children}
            </div>

            {footer && <div className="flex-none">{footer}</div>}
          </motion.div>
      )}
    </AnimatePresence>
  )
}
