import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { Crown, Lock, Share2, Users } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { SharingCenter } from '@/components/dashboard/SharingCenter'
import { Button } from '@/components/ui/button'
import { getCurrentUserProfileFn } from '@/server/functions/users'

export const Route = createFileRoute('/_protected/dashboard/sharing')({
  loader: async () => {
    const profileResult = await getCurrentUserProfileFn()
    return {
      userProfile: profileResult.user,
    }
  },
  component: SharingPage,
})

function SharingPage() {
  const { userProfile } = Route.useLoaderData()

  // Check if user has a paid plan
  const isPaidUser = userProfile?.planType === 'paid'

  // Show upgrade message for free users
  if (!isPaidUser) {
    return (
      <DashboardLayout userProfile={userProfile}>
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
              <Lock className="w-10 h-10 text-amber-600 dark:text-amber-400" />
            </div>

            <h1
              className="text-3xl font-bold text-slate-900 dark:text-white mb-4"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              Sharing Center
            </h1>

            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
              Connect with other users in your category and share questions to
              study together. This feature is available exclusively for paid
              plan users.
            </p>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-8 mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Crown className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                <span className="text-lg font-semibold text-amber-800 dark:text-amber-300">
                  Upgrade to Unlock
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-left mb-6">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/60 dark:bg-slate-800/60">
                  <Users className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">
                      Connect with Peers
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Add connections from your same category
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/60 dark:bg-slate-800/60">
                  <Share2 className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">
                      Share Questions
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Share important questions with your connections
                    </p>
                  </div>
                </div>
              </div>

              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-8">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Your Plan
              </Button>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Contact support to upgrade your subscription and unlock all
              features.
            </p>
          </motion.div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="max-w-4xl">
        <SharingCenter />
      </div>
    </DashboardLayout>
  )
}
