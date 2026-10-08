import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P02-Employees'

export const Route = createFileRoute('/professionals')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DCPage C={Page} />
}
