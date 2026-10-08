import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P23-AICoaches'

export const Route = createFileRoute('/$p/_portal/ai/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { p } = Route.useParams()
  return <DCPage C={Page} props={{ site: p }} />
}
