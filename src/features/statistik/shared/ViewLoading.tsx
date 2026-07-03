// Suspense fallback for lazily-loaded views (§9 code-splitting). A quiet pulse
// bar matching the view container — no spinner (anti-slop: skeletal, not a
// generic circular loader). Pulse is gated on motion-safe.

export function ViewLoading() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-2xl border border-kanal-line bg-kanal-bg">
      <div className="h-5 w-24 rounded bg-kanal-skeleton motion-safe:animate-pulse" />
    </div>
  )
}
