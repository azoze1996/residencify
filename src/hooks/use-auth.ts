import { signOutFn } from '@/server/functions/auth'
import { useLoaderData } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Models } from 'node-appwrite'

export function useAuth() {
  const { currentUser } = useLoaderData({ from: '__root__' }) as {
    currentUser: Models.User<Models.Preferences>
  }
  const signOut = useServerFn(signOutFn)

  return {
    currentUser,
    signOut,
  }
}
