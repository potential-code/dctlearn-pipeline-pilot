import { createFileRoute, Outlet } from '@tanstack/react-router'
import { requireRole } from '@/session/guards'

export const Route = createFileRoute('/admin')({
  beforeLoad: requireRole(['admin']),
  component: Outlet,
})
