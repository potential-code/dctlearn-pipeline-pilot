import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P56-Forms'

export const Route = createFileRoute('/admin/surveys')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DCPage C={Page} />
}
