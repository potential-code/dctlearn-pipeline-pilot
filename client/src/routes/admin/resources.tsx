import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P54-ResourceReview'

export const Route = createFileRoute('/admin/resources')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DCPage C={Page} />
}
