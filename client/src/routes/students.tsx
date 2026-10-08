import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P03-Students'

export const Route = createFileRoute('/students')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DCPage C={Page} />
}
