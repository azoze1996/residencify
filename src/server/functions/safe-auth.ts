import { createServerFn } from '@tanstack/react-start'
import { createSessionClient } from '../lib/appwrite'
import { getCookie } from '@tanstack/react-start/server'

/**
 * Safe version of getCurrentUser that never throws.
 * Returns null for any auth error (expired session, invalid token, etc.)
 */
export const safeGetCurrentUser = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const session = getCookie('appwrite-session-secret')

      if (!session) {
        return null
      }

      const client = await createSessionClient(session)
      const currentUser = await client.account.get()
      return currentUser
    } catch {
      // Any error (expired session, invalid token, network error, etc.)
      // should result in null user - this is expected for guests
      return null
    }
  },
)

/**
 * Safe auth middleware that never throws.
 * Returns { currentUser: null } for any auth error.
 */
export const safeAuthMiddleware = createServerFn({ method: 'GET' }).handler(
  async () => {
    const currentUser = await safeGetCurrentUser()
    return { currentUser }
  },
)
