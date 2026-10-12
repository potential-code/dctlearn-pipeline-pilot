// client: hand-edited (P16 is a hand-built player now; the bare course URL opens it where the learner left off)
import { createFileRoute } from '@tanstack/react-router'
import Page from '@/pages/P16-Course'

export const Route = createFileRoute('/$p/_portal/learn/$course/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { p, course } = Route.useParams()
  const q = Route.useSearch() as Record<string, unknown>
  return <Page site={p} course={course} screen={str(q.screen)} state={str(q.state)} />
}

const str = (v: unknown) => (typeof v === 'string' ? v : undefined)
