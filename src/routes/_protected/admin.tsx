import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { isAdminFn } from '@/server/functions/users'

export const Route = createFileRoute('/_protected/admin')({
  beforeLoad: async () => {
    const { isAdmin, isExamAdmin } = await isAdminFn()
    // Allow both full admins and exam admins to access admin panel
    if (!isAdmin && !isExamAdmin) {
      throw redirect({ to: '/dashboard' })
    }
    return { isAdmin, isExamAdmin }
  },
  component: AdminLayout,
})

function AdminLayout() {
  return <Outlet />
}
