// Hairline divider with an optional mono label (§3). Used for section breaks
// like RINCIAN / TRANSAKSI. Label-less form is a plain hairline.

interface SectionDividerProps {
  label?: string
  className?: string
}

export function SectionDivider({ label, className }: SectionDividerProps) {
  if (!label) {
    return <div className={`h-px bg-kanal-line ${className ?? ''}`} />
  }
  return (
    <div className={`flex items-center gap-3 ${className ?? ''}`}>
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-kanal-fg3">
        {label}
      </span>
      <span className="h-px flex-1 bg-kanal-line" />
    </div>
  )
}
