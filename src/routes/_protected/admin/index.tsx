import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'motion/react'
import {
  Users as UsersIcon,
  FileQuestion,
  HelpCircle,
  TrendingUp,
  Activity,
  Crown,
  Gift,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { getCurrentUserProfileFn, listUsersFn } from '@/server/functions/users'
import { listAllCategoriesFn } from '@/server/functions/categories'
import { listAllQuestionsFn } from '@/server/functions/questions'
import { listAllTicketsFn } from '@/server/functions/support'
import type {
  Users as UserType,
  SupportTickets,
} from '@/server/lib/appwrite.types'

export const Route = createFileRoute('/_protected/admin/')({
  loader: async () => {
    const [
      profileResult,
      usersResult,
      categoriesResult,
      questionsResult,
      ticketsResult,
    ] = await Promise.all([
      getCurrentUserProfileFn(),
      listUsersFn().catch(() => ({ users: [] })),
      listAllCategoriesFn().catch(() => ({ categories: [] })),
      listAllQuestionsFn().catch(() => ({ questions: [], total: 0 })),
      listAllTicketsFn().catch(() => ({ tickets: [] })),
    ])

    const userProfile = profileResult.user
    const isExamAdmin =
      userProfile?.accessLevel === 'exam_admin' && !userProfile?.isAdmin

    return {
      userProfile,
      isExamAdmin,
      users: usersResult.users,
      categories: categoriesResult.categories,
      questions: questionsResult.questions,
      tickets: ticketsResult.tickets,
    }
  },
  component: AdminOverviewPage,
})

function AdminOverviewPage() {
  const { userProfile, isExamAdmin, users, categories, questions, tickets } =
    Route.useLoaderData()

  // Filter out admin users for stats
  const nonAdminUsers = users.filter((u: UserType) => !u.isAdmin)
  const paidUsers = nonAdminUsers.filter((u: UserType) => u.planType === 'paid')
  const freeUsers = nonAdminUsers.filter((u: UserType) => u.planType === 'free')

  const openTickets = tickets.filter(
    (t: SupportTickets) => t.status === 'open' || t.status === null,
  ).length

  const stats = [
    {
      icon: UsersIcon,
      label: 'Total Users',
      value: nonAdminUsers.length,
      subtext: 'Excluding admin',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Crown,
      label: 'Paid Users',
      value: paidUsers.length,
      subtext: `${freeUsers.length} free users`,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      icon: FileQuestion,
      label: 'Questions',
      value: questions.length,
      subtext: `${categories.length} categories`,
      color: 'from-violet-500 to-purple-500',
      bgColor: 'bg-violet-500/10',
    },
    {
      icon: HelpCircle,
      label: 'Open Tickets',
      value: openTickets,
      subtext: `${tickets.length} total`,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500/10',
    },
  ]

  // Filter out admin from recent users display
  const recentUsers = nonAdminUsers.slice(0, 5)
  const recentTickets = tickets.slice(0, 5)

  return (
    <AdminLayout userProfile={userProfile} isExamAdmin={isExamAdmin}>
      <div className="max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1
            className="text-3xl font-semibold text-white mb-2"
            style={{ fontFamily: '"Instrument Sans", sans-serif' }}
          >
            Admin Overview
          </h1>
          <p className="text-stone-400">
            Monitor and manage your platform from here.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="p-5 rounded-2xl bg-stone-900 border border-stone-800"
            >
              <div
                className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center mb-4`}
              >
                <stat.icon
                  className={`w-6 h-6 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                  style={{ stroke: 'url(#gradient)' }}
                />
              </div>
              <p className="text-sm text-stone-400 mb-1">{stat.label}</p>
              <p
                className="text-3xl font-semibold text-white"
                style={{ fontFamily: '"Instrument Sans", sans-serif' }}
              >
                {stat.value}
              </p>
              {stat.subtext && (
                <p className="text-xs text-stone-500 mt-1">{stat.subtext}</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-6 rounded-2xl bg-stone-900 border border-stone-800"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <h2
                className="text-lg font-semibold text-white"
                style={{ fontFamily: '"Instrument Sans", sans-serif' }}
              >
                Recent Users
              </h2>
            </div>

            {recentUsers.length > 0 ? (
              <div className="space-y-3">
                {recentUsers.map((user: UserType) => (
                  <div
                    key={user.$id}
                    className="flex items-center justify-between p-3 rounded-xl bg-stone-800/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {user.username}
                      </p>
                      <p className="text-xs text-stone-400 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          user.planType === 'paid'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-stone-700 text-stone-300'
                        }`}
                      >
                        {user.planType === 'paid' ? (
                          <span className="flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            Paid
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Gift className="w-3 h-3" />
                            Free
                          </span>
                        )}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          user.isActive
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-stone-500 text-center py-8">No users yet</p>
            )}
          </motion.div>

          {/* Recent Tickets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="p-6 rounded-2xl bg-stone-900 border border-stone-800"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-amber-400" />
              </div>
              <h2
                className="text-lg font-semibold text-white"
                style={{ fontFamily: '"Instrument Sans", sans-serif' }}
              >
                Recent Tickets
              </h2>
            </div>

            {recentTickets.length > 0 ? (
              <div className="space-y-3">
                {recentTickets.map((ticket: SupportTickets) => (
                  <div
                    key={ticket.$id}
                    className="flex items-center justify-between p-3 rounded-xl bg-stone-800/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {ticket.subject}
                      </p>
                      <p className="text-xs text-stone-400 truncate">
                        {ticket.message}
                      </p>
                    </div>
                    <span
                      className={`ml-3 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
                        ticket.status === 'resolved' ||
                        ticket.status === 'closed'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : ticket.status === 'in_progress'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-blue-500/10 text-blue-400'
                      }`}
                    >
                      {ticket.status === 'resolved'
                        ? 'Resolved'
                        : ticket.status === 'closed'
                          ? 'Closed'
                          : ticket.status === 'in_progress'
                            ? 'In Progress'
                            : 'Open'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-stone-500 text-center py-8">No tickets yet</p>
            )}
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  )
}
