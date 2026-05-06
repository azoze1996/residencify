import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  return <Outlet />
}
