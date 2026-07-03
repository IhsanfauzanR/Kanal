// Per-view error boundary. Without this, an error thrown while rendering any
// single view unmounts the whole React tree — so one failing view blanks every
// other view too (a cascading failure). This contains the failure to the one
// view and resets automatically when the user switches views (resetKey).

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  resetKey: string
  children: ReactNode
}
interface State {
  error: Error | null
}

export class ViewErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidUpdate(prev: Props) {
    // Switching views clears the error so the next view gets a clean render.
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ViewErrorBoundary]', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (error) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-kanal-line bg-kanal-bg px-6 text-center">
          <p className="text-sm text-kanal-fg2">Tampilan ini gagal dimuat.</p>
          <p className="max-w-[34ch] font-mono text-[11px] leading-relaxed text-kanal-fg4">
            {error.message}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="rounded-[10px] border border-kanal-line bg-kanal-surf px-3.5 py-2 text-[13px] font-medium text-kanal-fg2 transition-transform active:scale-[0.97]"
          >
            Coba lagi
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
