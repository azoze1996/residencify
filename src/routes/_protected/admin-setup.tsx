import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { motion } from 'motion/react'
import { Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  setupAdminAccessFn,
  getCurrentUserProfileFn,
} from '@/server/functions/users'

export const Route = createFileRoute('/_protected/admin-setup')({
  loader: async () => {
    const profileResult = await getCurrentUserProfileFn()
    return { userProfile: profileResult.user }
  },
  component: AdminSetupPage,
})

function AdminSetupPage() {
  const { userProfile } = Route.useLoaderData()
  const router = useRouter()
  const setupAdmin = useServerFn(setupAdminAccessFn)

  const setupMutation = useMutation({
    mutationFn: async () => {
      return await setupAdmin()
    },
    onSuccess: async () => {
      await router.invalidate()
    },
  })

  const isAlreadyAdmin = userProfile?.isAdmin === true

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl border border-stone-200 shadow-xl p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isAlreadyAdmin ? 'bg-emerald-100' : 'bg-amber-100'}`}
            >
              {isAlreadyAdmin ? (
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              ) : (
                <Shield className="w-8 h-8 text-amber-600" />
              )}
            </div>
          </div>

          {/* Title */}
          <h1
            className="text-2xl font-semibold text-stone-900 text-center mb-2"
            style={{ fontFamily: '"Instrument Sans", sans-serif' }}
          >
            {isAlreadyAdmin ? 'Admin Access Active' : 'Admin Setup'}
          </h1>

          {/* Description */}
          <p className="text-stone-600 text-center mb-8">
            {isAlreadyAdmin
              ? 'You already have admin privileges. You can manage users, questions, and platform settings.'
              : 'Grant yourself admin access to manage the platform. This will create your user profile with full admin privileges.'}
          </p>

          {/* Status or Action */}
          {isAlreadyAdmin ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900">
                      Admin privileges active
                    </p>
                    <p className="text-xs text-emerald-700">
                      Email: {userProfile?.email}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => router.navigate({ to: '/dashboard' })}
                className="w-full h-12 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium"
              >
                Go to Dashboard
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {setupMutation.isError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-red-900">
                      {(setupMutation.error as Error)?.message ||
                        'Failed to setup admin access'}
                    </p>
                  </div>
                </div>
              )}

              {setupMutation.isSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <p className="text-sm text-emerald-900">
                      Admin access granted successfully!
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={() => setupMutation.mutate()}
                disabled={setupMutation.isPending || setupMutation.isSuccess}
                className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium disabled:opacity-50"
              >
                {setupMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : setupMutation.isSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Setup Complete
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Grant Admin Access
                  </>
                )}
              </Button>

              {setupMutation.isSuccess && (
                <Button
                  onClick={() => router.navigate({ to: '/dashboard' })}
                  variant="outline"
                  className="w-full h-12 rounded-xl font-medium"
                >
                  Go to Dashboard
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <p className="text-xs text-stone-500 text-center mt-6">
          This page is only accessible to authenticated users.
        </p>
      </motion.div>
    </div>
  )
}
