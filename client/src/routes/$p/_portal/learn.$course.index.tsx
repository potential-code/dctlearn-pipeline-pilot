import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P16-Course'

export const Route = createFileRoute('/$p/_portal/learn/$course/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { p, course } = Route.useParams()
  return <DCPage C={Page} props={{ site: p, course }} />
}
