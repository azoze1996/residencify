import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Lock, User } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { getCurrentUserProfileFn } from '@/server/functions/users'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { createSessionClient } from '@/server/lib/appwrite'
import { getAppwriteSessionFn } from '@/server/functions/auth'

// Server function to change password
const changePasswordFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8),
    }),
  )
  .handler(async ({ data }) => {
    const session = await getAppwriteSessionFn()
    if (!session) throw new Error('Not authenticated')

    const client = await createSessionClient(session)
    await client.account.updatePassword({
      password: data.newPassword,
      oldPassword: data.currentPassword,
    })

    return { success: true }
  })

export const Route = createFileRoute('/_protected/dashboard/settings')({
  loader: async () => {
    const profileResult = await getCurrentUserProfileFn()
    return {
      userProfile: profileResult.user,
    }
  },
  component: SettingsPage,
})

function SettingsPage() {
  const { userProfile } = Route.useLoaderData()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const changePassword = useServerFn(changePasswordFn)

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match')
      }
      return await changePassword({
        data: {
          currentPassword,
          newPassword,
        },
      })
    },
    onSuccess: () => {
      toast.success('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to change password')
    },
  })

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'medical_student':
        return 'Medical Student'
      case 'intern':
        return 'Intern'
      case 'trainee_resident':
        return 'Trainee Resident'
      default:
        return category
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1
            className="text-3xl font-semibold text-slate-900 dark:text-white mb-2"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Manage your account settings and preferences.
          </p>
        </motion.div>

        {/* Profile Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="p-6 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 shadow-lg dark:shadow-slate-900/30 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2
              className="text-xl font-semibold text-slate-900 dark:text-white"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              Profile Information
            </h2>
          </div>

          {userProfile && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500 dark:text-slate-400">
                    Username
                  </Label>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {userProfile.username}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-500 dark:text-slate-400">
                    Email
                  </Label>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {userProfile.email}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500 dark:text-slate-400">
                    Category
                  </Label>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {getCategoryLabel(userProfile.accessCategory)}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-500 dark:text-slate-400">
                    Plan Type
                  </Label>
                  <p className="font-medium text-slate-900 dark:text-white capitalize">
                    {userProfile.planType}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500 dark:text-slate-400">
                    Start Date
                  </Label>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {formatDate(userProfile.startDate)}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-500 dark:text-slate-400">
                    End Date
                  </Label>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {formatDate(userProfile.endDate)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Change Password */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="p-6 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 shadow-lg dark:shadow-slate-900/30 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h2
              className="text-xl font-semibold text-slate-900 dark:text-white"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              Change Password
            </h2>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              changePasswordMutation.mutate()
            }}
            className="space-y-4"
          >
            <div>
              <Label
                htmlFor="currentPassword"
                className="text-slate-700 dark:text-slate-300"
              >
                Current Password
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                className="mt-1.5 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <Label
                htmlFor="newPassword"
                className="text-slate-700 dark:text-slate-300"
              >
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
                required
                minLength={8}
                className="mt-1.5 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <Label
                htmlFor="confirmPassword"
                className="text-slate-700 dark:text-slate-300"
              >
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="mt-1.5 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"
              />
            </div>

            <Button
              type="submit"
              disabled={
                changePasswordMutation.isPending ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
            >
              {changePasswordMutation.isPending
                ? 'Changing...'
                : 'Change Password'}
            </Button>
          </form>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
