import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P59-CourseEditor'

export const Route = createFileRoute('/admin/catalog/editor/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <DCPage C={Page} props={{ course: id }} />
}
