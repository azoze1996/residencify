import { redirect, Outlet } from '@tanstack/react-router'
import { createFileRoute } from '@tanstack/react-router'
import { safeGetCurrentUser } from '@/server/functions/safe-auth'
import { ensureUserProfileFn } from '@/server/functions/users'

export const Route = createFileRoute('/_protected')({
  loader: async ({ location }) => {
    const currentUser = await safeGetCurrentUser()

    if (!currentUser) {
      if (location.pathname !== '/sign-in') {
        throw redirect({ to: '/sign-in', search: { redirect: location.href } })
      }
      return { currentUser: null }
    }

    // Ensure user profile exists (creates one if not)
    try {
      await ensureUserProfileFn()
    } catch (error) {
      console.error('Failed to ensure user profile:', error)
    }

    return { currentUser }
  },
  component: ProtectedLayout,
})

function ProtectedLayout() {
  return <Outlet />
}
