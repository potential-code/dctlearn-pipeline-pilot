import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P19-MenteeRegister'

export const Route = createFileRoute('/$p/_portal/mentoring/register')({
  component: RouteComponent,
})

function RouteComponent() {
  const { p } = Route.useParams()
  return <DCPage C={Page} props={{ site: p, screen: 'prefilled' }} />
}
