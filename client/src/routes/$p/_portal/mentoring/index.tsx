import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P17-Mentors'

export const Route = createFileRoute('/$p/_portal/mentoring/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { p } = Route.useParams()
  return <DCPage C={Page} props={{ site: p, screen: 'matched' }} />
}
