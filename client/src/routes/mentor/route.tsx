import { createFileRoute, Outlet } from '@tanstack/react-router'
import { requireRole } from '@/session/guards'

export const Route = createFileRoute('/mentor')({
  beforeLoad: requireRole(['mentor']),
  component: Outlet,
})
