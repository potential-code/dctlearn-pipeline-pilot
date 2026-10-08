import { createFileRoute, Outlet } from '@tanstack/react-router'
import { requireRole } from '@/session/guards'

export const Route = createFileRoute('/$p/admin')({
  beforeLoad: requireRole(['sub_admin']),
  component: Outlet,
})
