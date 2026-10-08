import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P46-Catalog'

export const Route = createFileRoute('/admin/catalog/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DCPage C={Page} />
}
