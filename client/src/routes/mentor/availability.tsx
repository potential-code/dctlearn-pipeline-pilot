import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P31-Availability'

export const Route = createFileRoute('/mentor/availability')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DCPage C={Page} />
}
