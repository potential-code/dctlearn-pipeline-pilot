import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P29-CompetitionDashboard'

export const Route = createFileRoute('/$p/_portal/competition/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  const { p } = Route.useParams()
  return <DCPage C={Page} props={{ site: p, screen: 'judging' }} />
}
