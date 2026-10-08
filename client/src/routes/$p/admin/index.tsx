import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P35-SubAdmin'

export const Route = createFileRoute('/$p/admin/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { p } = Route.useParams()
  return <DCPage C={Page} props={{ site: p }} />
}
