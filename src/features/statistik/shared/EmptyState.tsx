// Shared empty state (§5.5, §6.4, §7.6). Quiet, centered, factual copy with an
// optional ghost action. No illustration, no marketing tone.

interface EmptyStateProps {
  message: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  message,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 px-6 text-center ${className ?? ''}`}
    >
      <p className="max-w-[30ch] text-sm leading-relaxed text-kanal-fg2">
        {message}
      </p>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="rounded-[10px] border border-kanal-line bg-kanal-surf px-3.5 py-2 text-[13px] font-medium text-kanal-fg2 transition-transform active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kanal-teal"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
