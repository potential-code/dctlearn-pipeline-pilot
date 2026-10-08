import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P33-Judge'

export const Route = createFileRoute('/judge/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DCPage C={Page} />
}
