import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P48-MentorPool'

export const Route = createFileRoute('/admin/mentors')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DCPage C={Page} />
}
