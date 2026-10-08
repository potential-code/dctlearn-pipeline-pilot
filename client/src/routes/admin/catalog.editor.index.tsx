import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P59-CourseEditor'

export const Route = createFileRoute('/admin/catalog/editor/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DCPage C={Page} props={{ course: 'C01' }} />
}
