import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P30-Mentor'

export const Route = createFileRoute('/mentor/grow')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DCPage C={Page} props={{ tab: 'grow' }} />
}
