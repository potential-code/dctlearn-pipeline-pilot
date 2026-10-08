// client: hand-edited (map unit URL slugs to screen presets)
import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P16-Course'

export const Route = createFileRoute('/$p/_portal/learn/$course/$unit')({
  component: RouteComponent,
})

/** URL unit slug → the page's screen preset: u2 → unit2, final-check → quiz. */
function screenFor(unit: string): string {
  if (/^u\d+$/.test(unit)) return `unit${unit.slice(1)}`
  if (unit === 'final-check') return 'quiz'
  return unit
}

function RouteComponent() {
  const { p, course, unit } = Route.useParams()
  return <DCPage C={Page} props={{ site: p, course, screen: screenFor(unit) }} />
}
