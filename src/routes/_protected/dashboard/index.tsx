import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import {
  BookOpen,
  Clock,
  ArrowRight,
  FileQuestion,
  Target,
  Stethoscope,
  Info,
  CheckCircle2,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { getCurrentUserProfileFn } from '@/server/functions/users'
import { getUserCategoriesFn } from '@/server/functions/categories'
import {
  getAllUserSessionsFn,
  getUserSessionStatsFn,
} from '@/server/functions/sessions'
import { getQuestionCountsForCategoriesFn } from '@/server/functions/questions'
import { getCompletedCategoryIdsFn } from '@/server/functions/progress'
import {
  listOsceTopicsFn,
  listOsceSpecialtiesFn,
} from '@/server/functions/osce'
import { listBookmarksFn } from '@/server/functions/bookmarks'
import type { UserSessions, Categories } from '@/server/lib/appwrite.types'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_protected/dashboard/')({
  loader: async () => {
    const [
      profileResult,
      categoriesResult,
      sessionsResult,
      questionCounts,
      sessionStats,
      completedCategories,
      osceTopics,
      osceSpecialties,
      bookmarks,
    ] = await Promise.all([
      getCurrentUserProfileFn(),
      getUserCategoriesFn().catch(() => ({ categories: [], userDomain: '' })),
      getAllUserSessionsFn().catch(() => ({ sessions: [] })),
      getQuestionCountsForCategoriesFn().catch(() => ({ poolCounts: {} })),
      getUserSessionStatsFn().catch(() => ({
        totalSessions: 0,
        completedSessions: 0,
        inProgressSessions: 0,
        totalQuestionsAnswered: 0,
        totalTimeSpent: 0,
      })),
      getCompletedCategoryIdsFn().catch(() => ({ completedIds: [] })),
      listOsceTopicsFn().catch(() => ({ topics: [] })),
      listOsceSpecialtiesFn().catch(() => ({ specialties: [] })),
      listBookmarksFn().catch(() => ({ bookmarks: [] })),
    ])

    // Calculate OSCE progress from bookmarks (viewed topics)
    const osceBookmarks = bookmarks.bookmarks.filter(
      (b: { itemType: string }) => b.itemType === 'osce',
    )

    return {
      userProfile: profileResult.user,
      categories: categoriesResult.categories,
      userDomain: categoriesResult.userDomain,
      sessions: sessionsResult.sessions,
      poolCounts: questionCounts.poolCounts as Record<number, number>,
      sessionStats,
      completedCategoryIds: completedCategories.completedIds,
      osceTopics: osceTopics.topics,
      osceSpecialties: osceSpecialties.specialties,
      osceViewedCount: osceBookmarks.length,
    }
  },
  component: DashboardIndexPage,
})

function DashboardIndexPage() {
  const {
    userProfile,
    categories,
    sessions,
    poolCounts,
    sessionStats,
    completedCategoryIds,
    osceTopics,
    osceViewedCount,
  } = Route.useLoaderData()

  const [showFeatureGuide, setShowFeatureGuide] = useState(false)

  // Check if user has seen the dashboard guide
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('hasSeenDashboardGuide')
    if (!hasSeenGuide && categories.length > 0) {
      setShowFeatureGuide(true)
      localStorage.setItem('hasSeenDashboardGuide', 'true')
    }
  }, [categories.length])

  // Calculate total questions across all categories
  const getTotalQuestions = () => {
    let total = 0
    categories.forEach((cat: Categories) => {
      if (cat.poolNumbers) {
        cat.poolNumbers.forEach((poolNum: number) => {
          total += poolCounts[poolNum] || 0
        })
      }
    })
    return total
  }

  const totalQuestions = getTotalQuestions()
  const questionsAnswered = sessionStats.totalQuestionsAnswered
  const mcqProgressPercent =
    totalQuestions > 0
      ? Math.min(Math.round((questionsAnswered / totalQuestions) * 100), 100)
      : 0

  const totalOsceTopics = osceTopics.length
  const osceProgressPercent =
    totalOsceTopics > 0
      ? Math.min(Math.round((osceViewedCount / totalOsceTopics) * 100), 100)
      : 0

  // Calculate completed categories percentage
  const totalCategories = categories.length
  const completedCategoriesCount = completedCategoryIds.length

  // Format time spent
  const formatTimeSpent = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${mins}m`
  }

  const stats = [
    {
      icon: FileQuestion,
      label: 'Total Questions',
      value: totalQuestions,
      gradient:
        'from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: BookOpen,
      label: 'Available Topics',
      value: categories.length,
      gradient:
        'from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      icon: Clock,
      label: 'Active Sessions',
      value: sessions.length,
      gradient:
        'from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
  ]

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="max-w-4xl">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="text-2xl font-semibold text-slate-900 dark:text-white mb-1"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                Welcome back, {userProfile?.username || 'User'}
              </h1>
              <p className="text-slate-600 dark:text-slate-300">
                Continue your journey. Pick up where you left off or start a new
                topic.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFeatureGuide(true)}
              className="h-10 w-10 rounded-full text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-500/10"
            >
              <Info className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className={`p-4 rounded-xl bg-gradient-to-br ${stat.gradient} backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5`}
            >
              <div
                className={`w-8 h-8 rounded-lg ${stat.iconBg} flex items-center justify-center mb-3`}
              >
                <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-0.5">
                {stat.label}
              </p>
              <p
                className="text-lg font-semibold text-slate-900 dark:text-white"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Progress Tracking Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-6"
        >
          <h2
            className="text-lg font-semibold text-slate-900 dark:text-white mb-4"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            Your Progress
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* MCQ Progress Card */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-700/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3
                    className="text-sm font-semibold text-slate-900 dark:text-white"
                    style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                  >
                    MCQ Practice
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Questions answered
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">
                    {questionsAnswered} / {totalQuestions} questions
                  </span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {mcqProgressPercent}%
                  </span>
                </div>
                <Progress
                  value={mcqProgressPercent}
                  className="h-2 bg-blue-100 dark:bg-blue-900/30"
                />
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span>
                    {completedCategoriesCount} / {totalCategories} topics
                    completed
                  </span>
                  <span>
                    Time: {formatTimeSpent(sessionStats.totalTimeSpent)}
                  </span>
                </div>
              </div>
            </div>

            {/* OSCE Progress Card */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border border-teal-200/50 dark:border-teal-700/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h3
                    className="text-sm font-semibold text-slate-900 dark:text-white"
                    style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                  >
                    OSCE Scenarios
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Clinical cases reviewed
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">
                    {osceViewedCount} / {totalOsceTopics} scenarios
                  </span>
                  <span className="font-medium text-teal-600 dark:text-teal-400">
                    {osceProgressPercent}%
                  </span>
                </div>
                <Progress
                  value={osceProgressPercent}
                  className="h-2 bg-teal-100 dark:bg-teal-900/30"
                />
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span>Keep practicing to improve!</span>
                  <Link
                    to="/dashboard/osce"
                    className="text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    View all →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="p-5 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 text-white border border-slate-700/50 shadow-xl"
        >
          <h2
            className="text-lg font-semibold mb-1"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            Ready to practice?
          </h2>
          <p className="text-slate-300 text-sm mb-4">
            Access your question banks and continue learning at your own pace.
          </p>
          <Link
            to="/dashboard/practice"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-slate-900 font-medium text-sm hover:bg-slate-100 transition-colors shadow-lg"
          >
            <BookOpen className="w-4 h-4" />
            Start Practicing
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Recent Sessions */}
        {sessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6"
          >
            <h2
              className="text-lg font-semibold text-slate-900 dark:text-white mb-3"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              Continue where you left off
            </h2>
            <div className="space-y-2">
              {sessions.slice(0, 3).map((session: UserSessions) => {
                // Find the category name for this session
                const category = categories.find(
                  (c: Categories) => c.$id === session.categoryId,
                )
                const categoryName = category?.name || 'Unknown Category'
                const answeredCount = session.answeredQuestions?.length || 0
                const totalQuestions = session.totalQuestions || 0

                return (
                  <div
                    key={session.$id}
                    className="p-3 rounded-xl bg-gradient-to-br from-white via-white to-slate-50/80 dark:from-slate-800/90 dark:via-slate-800/80 dark:to-slate-900/70 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/50 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {categoryName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Question {session.lastQuestionIndex + 1}
                          {totalQuestions > 0 && ` of ${totalQuestions}`} •{' '}
                          {answeredCount} answered
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/dashboard/practice"
                      search={{ category: session.categoryId, resume: 'true' }}
                      className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                    >
                      Resume
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Feature Guide Dialog */}
        <Dialog open={showFeatureGuide} onOpenChange={setShowFeatureGuide}>
          <DialogContent className="max-w-[90vw] sm:max-w-2xl dark:bg-slate-900 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl dark:text-white">
                <Info className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                Practice Dashboard Features
              </DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                Learn how to organize and track your study progress
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4 py-4">
                {/* Mark as Complete Feature */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                      Mark Categories as Complete
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                      Click the checkmark icon on any category card to mark it
                      as complete. This helps you track which topics you've
                      mastered.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Completed categories show a green checkmark</span>
                    </div>
                  </div>
                </div>

                {/* Subcategories Feature */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-800/50 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                      Navigate Subcategories
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Categories with subcategories show a folder icon. Click to
                      explore nested topics and organize your study materials.
                    </p>
                  </div>
                </div>

                {/* Resume Sessions Feature */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800/50 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                      Resume Your Sessions
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Your progress is automatically saved. Click "Resume" on
                      any active session to continue exactly where you left off.
                    </p>
                  </div>
                </div>

                {/* Progress Tracking */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700/50">
                  <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-800/50 flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                      Track Your Progress
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      View your overall progress with MCQ questions and OSCE
                      scenarios. See how many topics you've completed and time
                      spent studying.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  localStorage.removeItem('hasSeenDashboardGuide')
                  toast.success('Guide will show again next time')
                }}
                className="text-xs text-slate-500 dark:text-slate-400"
              >
                Show this again
              </Button>
              <Button
                onClick={() => setShowFeatureGuide(false)}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                Got it!
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
