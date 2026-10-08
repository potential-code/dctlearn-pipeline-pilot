import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P25-AITool'

export const Route = createFileRoute('/$p/_portal/ai/tool/$key')({
  component: RouteComponent,
})

function RouteComponent() {
  const { p, key } = Route.useParams()
  return <DCPage C={Page} props={{ site: p, tool: key, screen: 'loading' }} />
}
