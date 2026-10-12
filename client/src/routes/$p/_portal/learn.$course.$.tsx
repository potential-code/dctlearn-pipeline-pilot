// client: hand-edited (P16 course player). /{p}/learn/{course}/<unit>[/<block>]:
//   pre-test · final-check · complete · u2 (the unit) · u2/b3 (one block)
// One route for all of them, so the page stays mounted while the learner moves block to block.
import { createFileRoute } from '@tanstack/react-router'
import Page from '@/pages/P16-Course'

export const Route = createFileRoute('/$p/_portal/learn/$course/$')({
  component: RouteComponent,
})

function RouteComponent() {
  const { p, course, _splat } = Route.useParams()
  const q = Route.useSearch() as Record<string, unknown>
  const [unit, block] = (_splat ?? '').split('/').filter(Boolean)
  return (
    <Page
      site={p}
      course={course}
      unit={unit}
      block={block}
      screen={str(q.screen)}
      state={str(q.state)}
    />
  )
}

const str = (v: unknown) => (typeof v === 'string' ? v : undefined)
