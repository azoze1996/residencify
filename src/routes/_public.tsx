import { createFileRoute, Outlet } from '@tanstack/react-router'
import { safeGetCurrentUser } from '@/server/functions/safe-auth'

export const Route = createFileRoute('/_public')({
  loader: async () => {
    const currentUser = await safeGetCurrentUser()
    return { currentUser }
  },
  component: PublicLayout,
})

function PublicLayout() {
  return <Outlet />
}
