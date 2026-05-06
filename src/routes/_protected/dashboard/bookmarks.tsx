import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { motion, AnimatePresence } from 'motion/react'
import {
  Bookmark,
  BookmarkCheck,
  FileQuestion,
  Stethoscope,
  Trash2,
  ChevronRight,
  Search,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { getCurrentUserProfileFn } from '@/server/functions/users'
import {
  listBookmarksEnrichedFn,
  deleteBookmarkFn,
  getBookmarkStatsFn,
} from '@/server/functions/bookmarks'
import type { Bookmarks } from '@/server/lib/appwrite.types'

interface EnrichedBookmark extends Bookmarks {
  categoryName?: string | null
}

export const Route = createFileRoute('/_protected/dashboard/bookmarks')({
  loader: async () => {
    const [profileResult, bookmarksResult, statsResult] = await Promise.all([
      getCurrentUserProfileFn(),
      listBookmarksEnrichedFn().catch(() => ({ bookmarks: [] })),
      getBookmarkStatsFn().catch(() => ({
        mcqCount: 0,
        osceCount: 0,
        totalCount: 0,
      })),
    ])

    return {
      userProfile: profileResult.user,
      bookmarks: bookmarksResult.bookmarks as EnrichedBookmark[],
      stats: statsResult,
    }
  },
  component: BookmarksPage,
})

function BookmarksPage() {
  const { userProfile, bookmarks } = Route.useLoaderData()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<'all' | 'mcq' | 'osce'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [bookmarksList, setBookmarksList] =
    useState<EnrichedBookmark[]>(bookmarks)
  const [deleteConfirm, setDeleteConfirm] = useState<EnrichedBookmark | null>(
    null,
  )
  const [isDeleting, setIsDeleting] = useState(false)

  const deleteBookmark = useServerFn(deleteBookmarkFn)

  // Filter bookmarks
  const filteredBookmarks = bookmarksList.filter((bookmark) => {
    const matchesTab =
      activeTab === 'all' ? true : bookmark.itemType === activeTab
    const matchesSearch = searchQuery
      ? bookmark.osceTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.osceSpecialty
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        bookmark.questionNumber?.toString().includes(searchQuery) ||
        bookmark.categoryName?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
    return matchesTab && matchesSearch
  })

  // Handle delete
  const handleDelete = async () => {
    if (!deleteConfirm) return

    setIsDeleting(true)
    try {
      await deleteBookmark({ data: { id: deleteConfirm.$id } })
      setBookmarksList((prev) =>
        prev.filter((b) => b.$id !== deleteConfirm.$id),
      )
      toast.success('Bookmark removed')
      setDeleteConfirm(null)
    } catch {
      toast.error('Failed to remove bookmark')
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle bookmark click
  const handleBookmarkClick = (bookmark: EnrichedBookmark) => {
    if (bookmark.itemType === 'mcq') {
      // Navigate to practice with the question and pool info
      void navigate({
        to: '/dashboard/practice',
        search: {
          question: bookmark.itemId,
          pool: bookmark.poolNumber?.toString(),
        },
      })
    } else if (bookmark.itemType === 'osce') {
      // Navigate to OSCE page with the specific topic
      void navigate({
        to: '/dashboard/osce',
        search: {
          topic: bookmark.itemId,
        },
      })
    }
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  // Get display info for bookmark
  const getBookmarkDisplay = (bookmark: EnrichedBookmark) => {
    if (bookmark.itemType === 'mcq') {
      // Build subtitle: prefer category name, fallback to pool number
      let subtitle = 'MCQ Question'
      if (bookmark.categoryName) {
        subtitle = bookmark.categoryName
      } else if (bookmark.poolNumber) {
        subtitle = `Pool ${bookmark.poolNumber}`
      }

      return {
        icon: FileQuestion,
        title: bookmark.questionNumber
          ? `Question #${bookmark.questionNumber}`
          : 'MCQ Question',
        subtitle,
        badge: 'MCQ',
        badgeClass:
          'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      }
    } else {
      return {
        icon: Stethoscope,
        title: bookmark.osceTitle || 'OSCE Topic',
        subtitle: bookmark.osceSpecialty || 'Clinical Scenario',
        badge: 'OSCE',
        badgeClass:
          'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
      }
    }
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Bookmarks
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Your saved questions and OSCE topics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          <div className="bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                  {bookmarksList.length}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                  Total
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <FileQuestion className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                  {bookmarksList.filter((b) => b.itemType === 'mcq').length}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                  MCQ
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                  {bookmarksList.filter((b) => b.itemType === 'osce').length}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                  OSCE
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs & Search */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'all' | 'mcq' | 'osce')}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <TabsList className="bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 w-full sm:w-auto">
              <TabsTrigger
                value="all"
                className="flex-1 sm:flex-none data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white text-xs sm:text-sm"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="mcq"
                className="flex-1 sm:flex-none data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white text-xs sm:text-sm"
              >
                <FileQuestion className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                MCQ
              </TabsTrigger>
              <TabsTrigger
                value="osce"
                className="flex-1 sm:flex-none data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white text-xs sm:text-sm"
              >
                <Stethoscope className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                OSCE
              </TabsTrigger>
            </TabsList>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search bookmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Bookmarks List */}
          <TabsContent value={activeTab} className="mt-0">
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredBookmarks.map((bookmark, index) => {
                  const display = getBookmarkDisplay(bookmark)
                  const Icon = display.icon

                  return (
                    <motion.div
                      key={bookmark.$id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-3 sm:p-4 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all cursor-pointer group"
                      onClick={() => handleBookmarkClick(bookmark)}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-100 dark:bg-slate-700 group-hover:bg-slate-900 dark:group-hover:bg-white flex items-center justify-center flex-shrink-0 transition-colors">
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300 group-hover:text-white dark:group-hover:text-slate-900 transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge
                              variant="secondary"
                              className={`${display.badgeClass} text-[10px] sm:text-xs`}
                            >
                              {display.badge}
                            </Badge>
                            <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(bookmark.$createdAt)}
                            </span>
                          </div>
                          <h3 className="font-medium text-slate-900 dark:text-white truncate text-sm sm:text-base">
                            {display.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
                            {display.subtitle}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteConfirm(bookmark)
                            }}
                            className="w-8 h-8 sm:w-9 sm:h-9 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors hidden sm:block" />
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {filteredBookmarks.length === 0 && (
                <div className="text-center py-12">
                  <BookmarkCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">
                    {searchQuery
                      ? 'No bookmarks match your search'
                      : activeTab === 'all'
                        ? 'No bookmarks yet. Start saving questions and OSCE topics!'
                        : `No ${activeTab.toUpperCase()} bookmarks yet`}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent className="dark:bg-slate-900 dark:border-slate-700 max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">
              Remove Bookmark?
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-slate-400">
              Are you sure you want to remove this bookmark? You can always
              bookmark it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeleting ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
