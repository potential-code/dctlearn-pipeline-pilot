import { createFileRoute, Outlet } from '@tanstack/react-router'
import { requireRole } from '@/session/guards'

/** Learner pages of a microsite; sub admins may open them through "View as learner". */
export const Route = createFileRoute('/$p/_portal')({
  beforeLoad: requireRole(['learner', 'sub_admin']),
  component: Outlet,
})
