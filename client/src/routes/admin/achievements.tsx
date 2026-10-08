import { createFileRoute } from '@tanstack/react-router'
import { DCPage } from '@/app/DCPage'
import Page from '@/pages/P58-AchievementsAdmin'

export const Route = createFileRoute('/admin/achievements')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DCPage C={Page} />
}
