import { Component, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button, EmptyState } from './ui'

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <EmptyState icon={AlertTriangle} title="Something went wrong">
          <p className="mb-1">Your data is safe. It's stored in the database, not in this page.</p>
          <p className="mb-4 font-mono text-xs text-subtle">{this.state.error.message}</p>
          <Button variant="primary" onClick={() => location.reload()}><RotateCcw className="size-4" /> Reload</Button>
        </EmptyState>
      </div>
    )
  }
}
