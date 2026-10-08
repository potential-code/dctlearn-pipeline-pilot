import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P60-Translations'

export const Route = createFileRoute('/admin/translations')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DCPage C={Page} />
}
