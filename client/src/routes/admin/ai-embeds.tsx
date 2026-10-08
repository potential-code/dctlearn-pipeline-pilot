import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P61-AIEmbeds'

export const Route = createFileRoute('/admin/ai-embeds')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DCPage C={Page} />
}
