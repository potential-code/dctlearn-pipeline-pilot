import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P18-MentorProfile'

export const Route = createFileRoute('/$p/_portal/mentoring/mentor/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { p, id } = Route.useParams()
  return <DCPage C={Page} props={{ site: p, mentor: id }} />
}
