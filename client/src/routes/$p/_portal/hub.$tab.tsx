import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P52-Hub'

export const Route = createFileRoute('/$p/_portal/hub/$tab')({
  component: RouteComponent,
})

function RouteComponent() {
  const { p, tab } = Route.useParams()
  return <DCPage C={Page} props={{ site: p, tab }} />
}
