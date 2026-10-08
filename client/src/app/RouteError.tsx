import type { ErrorComponentProps } from '@tanstack/react-router'

/** Shown if a page throws while rendering; keeps the error visible instead of a blank screen. */
export function RouteError({ error }: ErrorComponentProps) {
  return (
    <div style={{ padding: 32, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 20 }}>This page failed to render</h1>
      <pre style={{ whiteSpace: 'pre-wrap', color: '#B42318' }}>
        {error instanceof Error ? (error.stack ?? error.message) : String(error)}
      </pre>
    </div>
  )
}
