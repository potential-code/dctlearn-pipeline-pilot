import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P40-Members'

export const Route = createFileRoute('/$p/admin/members')({
  component: RouteComponent,
})

function RouteComponent() {
  const { p } = Route.useParams()
  return <DCPage C={Page} props={{ site: p }} />
}
