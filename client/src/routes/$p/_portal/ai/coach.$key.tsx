import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P24-AICoach'

export const Route = createFileRoute('/$p/_portal/ai/coach/$key')({
  component: RouteComponent,
})

function RouteComponent() {
  const { p, key } = Route.useParams()
  return <DCPage C={Page} props={{ site: p, coach: key, screen: 'conversation' }} />
}
