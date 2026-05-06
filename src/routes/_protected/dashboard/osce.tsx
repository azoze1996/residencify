import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { motion, AnimatePresence } from 'motion/react'
import { z } from 'zod'
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  User,
  Bookmark,
  BookmarkCheck,
  Image as ImageIcon,
  Search,
  Filter,
  X,
  Share2,
  Users,
  Loader2,
  Clock,
  Calendar,
  AlertCircle,
  Send,
  Timer,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { getCurrentUserProfileFn } from '@/server/functions/users'
import {
  listOsceSpecialtiesFn,
  listOsceTopicsFn,
} from '@/server/functions/osce'
import {
  toggleBookmarkFn,
  getBookmarkedIdsFn,
} from '@/server/functions/bookmarks'
import {
  getConnectionsFn,
  shareOsceTopicFn,
} from '@/server/functions/connections'
import { submitOsceFeedbackFn } from '@/server/functions/feedback'
import type { OsceTopics, OsceSpecialties } from '@/server/lib/appwrite.types'

interface Interaction {
  text: string
  reply: string
}

interface Connection {
  $id: string
  connectedUserId: string
  connectedUsername: string | null
}

const searchSchema = z.object({
  topic: z.string().optional(),
})

export const Route = createFileRoute('/_protected/dashboard/osce')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps: { search } }) => {
    const [
      profileResult,
      specialtiesResult,
      topicsResult,
      bookmarksResult,
      connectionsResult,
    ] = await Promise.all([
      getCurrentUserProfileFn(),
      listOsceSpecialtiesFn().catch(() => ({ specialties: [] })),
      listOsceTopicsFn().catch(() => ({ topics: [] })),
      getBookmarkedIdsFn({ data: { itemType: 'osce' } }).catch(() => ({
        bookmarkedIds: [],
      })),
      getConnectionsFn().catch(() => ({ connections: [] })),
    ])

    return {
      userProfile: profileResult.user,
      specialties: specialtiesResult.specialties as OsceSpecialties[],
      topics: topicsResult.topics as OsceTopics[],
      bookmarkedIds: bookmarksResult.bookmarkedIds,
      connections: connectionsResult.connections as Connection[],
      // Pass search params for bookmark navigation
      bookmarkTopicId: search.topic,
    }
  },
  component: OscePracticePage,
})

function OscePracticePage() {
  const {
    userProfile,
    specialties,
    topics,
    bookmarkedIds,
    connections,
    bookmarkTopicId,
  } = Route.useLoaderData()
  const navigate = useNavigate()

  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(
    null,
  )
  const [selectedTopic, setSelectedTopic] = useState<OsceTopics | null>(null)
  const [revealedInteractions, setRevealedInteractions] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [bookmarkedTopicIds, setBookmarkedTopicIds] =
    useState<string[]>(bookmarkedIds)

  // Share dialog state
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [topicToShare, setTopicToShare] = useState<OsceTopics | null>(null)
  const [isSharing, setIsSharing] = useState(false)

  // Feedback dialog state
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)

  // Timer state
  const [showTimerDialog, setShowTimerDialog] = useState(false)
  const [timerMinutes, setTimerMinutes] = useState(10)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [selectedTimerMinutes, setSelectedTimerMinutes] = useState(10)

  // Ref for timer scroll container
  const timerScrollRef = useRef<HTMLDivElement>(null)

  const toggleBookmark = useServerFn(toggleBookmarkFn)
  const shareOsceTopic = useServerFn(shareOsceTopicFn)
  const submitFeedback = useServerFn(submitOsceFeedbackFn)

  // Check if user has a paid plan
  const isPaidUser = userProfile?.planType === 'paid'

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isTimerRunning && timerEnabled) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev === 0) {
            if (timerMinutes === 0) {
              // Timer finished
              setIsTimerRunning(false)
              toast.info('Time is up!', {
                description: 'Your practice timer has ended.',
              })
              return 0
            }
            setTimerMinutes((m) => m - 1)
            return 59
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerRunning, timerEnabled, timerMinutes])

  // Scroll to selected minute when dialog opens
  useEffect(() => {
    if (showTimerDialog && !timerEnabled && timerScrollRef.current) {
      const itemHeight = 48 // h-12 = 48px
      const scrollPosition = selectedTimerMinutes * itemHeight
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        timerScrollRef.current?.scrollTo({
          top: scrollPosition,
          behavior: 'auto',
        })
      }, 50)
    }
  }, [showTimerDialog, timerEnabled])

  // Handle scroll to detect selected minute with debounce
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleTimerScroll = useCallback(() => {
    if (!timerScrollRef.current) return

    // Clear previous timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    // Debounce: wait for scroll to stop
    scrollTimeoutRef.current = setTimeout(() => {
      if (!timerScrollRef.current) return

      const scrollTop = timerScrollRef.current.scrollTop
      const itemHeight = 48
      const nearestMinute = Math.round(scrollTop / itemHeight)
      const clampedMinute = Math.max(0, Math.min(30, nearestMinute))

      setSelectedTimerMinutes(clampedMinute)

      // Snap to exact position
      timerScrollRef.current.scrollTo({
        top: clampedMinute * itemHeight,
        behavior: 'smooth',
      })
    }, 100)
  }, [])

  // Parse interactions from JSON string
  const parseInteractions = (topic: OsceTopics): Interaction[] => {
    if (!topic.interactions) return []
    try {
      return JSON.parse(topic.interactions)
    } catch {
      return []
    }
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return formatDate(dateStr)
  }

  // Calculate timer progress percentage (for circular ring)
  const getTimerProgress = useCallback(() => {
    const totalSeconds = selectedTimerMinutes * 60
    const remainingSeconds = timerMinutes * 60 + timerSeconds
    const progress = (remainingSeconds / totalSeconds) * 100
    // Convert to stroke dashoffset (circumference = 2 * PI * radius)
    const circumference = 2 * Math.PI * 45 // radius = 45
    return circumference - (progress / 100) * circumference
  }, [timerMinutes, timerSeconds, selectedTimerMinutes])

  // Start timer with custom minutes
  const startTimer = (minutes: number) => {
    setSelectedTimerMinutes(minutes)
    setTimerMinutes(minutes)
    setTimerSeconds(0)
    setTimerEnabled(true)
    setIsTimerRunning(true)
    setShowTimerDialog(false)
  }

  // Reset timer
  const resetTimer = () => {
    setIsTimerRunning(false)
    setTimerEnabled(false)
    setTimerMinutes(10)
    setTimerSeconds(0)
  }

  // Filter topics based on specialty and search
  const filteredTopics = useMemo(() => {
    return topics.filter((topic: OsceTopics) => {
      const matchesSpecialty = selectedSpecialty
        ? topic.specialty === selectedSpecialty
        : true
      const matchesSearch = searchQuery
        ? topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          topic.scenario.toLowerCase().includes(searchQuery.toLowerCase())
        : true
      return matchesSpecialty && matchesSearch
    })
  }, [topics, selectedSpecialty, searchQuery])

  // Get topics count per specialty
  const getTopicCount = (specialtyName: string) => {
    return topics.filter((t: OsceTopics) => t.specialty === specialtyName)
      .length
  }

  // Handle topic selection
  const handleSelectTopic = (topic: OsceTopics) => {
    setSelectedTopic(topic)
    setRevealedInteractions([])
  }

  // Handle back to topic list
  const handleBackToList = () => {
    setSelectedTopic(null)
    setRevealedInteractions([])
    resetTimer()
  }

  // Effect to handle bookmark navigation on mount
  useEffect(() => {
    if (bookmarkTopicId) {
      const topic = topics.find((t: OsceTopics) => t.$id === bookmarkTopicId)
      if (topic) {
        handleSelectTopic(topic)
        toast.success(`Jumped to bookmarked topic: ${topic.title}`)
        // Clear search params after navigation
        void navigate({ to: '/dashboard/osce', search: {} })
      } else {
        toast.error('Bookmarked topic not found')
        void navigate({ to: '/dashboard/osce', search: {} })
      }
    }
  }, [bookmarkTopicId, topics, navigate])

  // Handle reveal interaction
  const handleRevealInteraction = (index: number) => {
    if (!revealedInteractions.includes(index)) {
      setRevealedInteractions((prev) => [...prev, index])
    }
  }

  // Handle bookmark toggle
  const handleToggleBookmark = async (topic: OsceTopics) => {
    try {
      const result = await toggleBookmark({
        data: {
          itemType: 'osce',
          itemId: topic.$id,
          osceTitle: topic.title,
          osceSpecialty: topic.specialty,
        },
      })

      if (result.bookmarked) {
        setBookmarkedTopicIds((prev) => [...prev, topic.$id])
        toast.success('Topic bookmarked')
      } else {
        setBookmarkedTopicIds((prev) => prev.filter((id) => id !== topic.$id))
        toast.success('Bookmark removed')
      }
    } catch {
      toast.error('Failed to update bookmark')
    }
  }

  // Handle opening share dialog
  const handleOpenShareDialog = (topic: OsceTopics, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    setTopicToShare(topic)
    setShowShareDialog(true)
  }

  // Handle sharing with a user
  const handleShareWithUser = async (userId: string) => {
    if (!topicToShare) return

    setIsSharing(true)
    try {
      await shareOsceTopic({
        data: {
          osceTopicId: topicToShare.$id,
          sharedWithId: userId,
        },
      })
      toast.success('OSCE topic shared successfully!')
      setShowShareDialog(false)
      setTopicToShare(null)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to share topic'
      toast.error(message)
    } finally {
      setIsSharing(false)
    }
  }

  // Handle feedback submission
  const handleSubmitFeedback = async () => {
    if (!selectedTopic || !feedbackText.trim()) return

    setIsSubmittingFeedback(true)
    try {
      await submitFeedback({
        data: {
          osceTopicId: selectedTopic.$id,
          feedbackText: feedbackText.trim(),
        },
      })
      toast.success('Feedback submitted successfully!')
      setShowFeedbackDialog(false)
      setFeedbackText('')
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to submit feedback'
      toast.error(message)
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  // Topic practice view
  if (selectedTopic) {
    const interactions = parseInteractions(selectedTopic)
    const isBookmarked = bookmarkedTopicIds.includes(selectedTopic.$id)

    return (
      <DashboardLayout userProfile={userProfile}>
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <Button
              variant="ghost"
              onClick={handleBackToList}
              className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 -ml-2 sm:ml-0"
            >
              <ChevronLeft className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Back to Topics</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Timer Display/Control */}
              {timerEnabled ? (
                <div className="flex items-center">
                  {/* Compact timer pill with glass effect */}
                  <div
                    onClick={() => setShowTimerDialog(true)}
                    className="flex items-center gap-2 bg-gradient-to-br from-slate-900/90 to-slate-800/90 dark:from-slate-950/90 dark:to-slate-900/90 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-full pl-2 pr-1 py-1 shadow-lg shadow-slate-900/20 cursor-pointer hover:from-slate-800/90 hover:to-slate-700/90 dark:hover:from-slate-900/90 dark:hover:to-slate-800/90 transition-all"
                  >
                    {/* Mini circular progress */}
                    <div className="relative w-8 h-8">
                      <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          className="text-slate-700/50 dark:text-slate-800/50"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeDasharray={2 * Math.PI * 14}
                          strokeDashoffset={(() => {
                            const totalSeconds = selectedTimerMinutes * 60
                            const remainingSeconds =
                              timerMinutes * 60 + timerSeconds
                            const progress =
                              (remainingSeconds / totalSeconds) * 100
                            const circumference = 2 * Math.PI * 14
                            return (
                              circumference - (progress / 100) * circumference
                            )
                          })()}
                          strokeLinecap="round"
                          className={`transition-all duration-1000 ${
                            timerMinutes === 0 && timerSeconds <= 30
                              ? 'text-rose-400'
                              : 'text-teal-400'
                          }`}
                        />
                      </svg>
                    </div>

                    {/* Time display */}
                    <div className="flex items-baseline pr-2">
                      <span className="text-base font-semibold text-white tabular-nums tracking-tight font-mono">
                        {timerMinutes.toString().padStart(2, '0')}
                      </span>
                      <span
                        className={`text-base font-semibold mx-0.5 ${
                          timerMinutes === 0 && timerSeconds <= 30
                            ? 'text-rose-400'
                            : 'text-teal-400'
                        }`}
                      >
                        :
                      </span>
                      <span className="text-base font-semibold text-white tabular-nums tracking-tight font-mono">
                        {timerSeconds.toString().padStart(2, '0')}
                      </span>
                    </div>

                    {/* Control buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsTimerRunning(!isTimerRunning)
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all backdrop-blur-sm ${
                          isTimerRunning
                            ? 'bg-white/10 text-slate-300 hover:bg-white/20'
                            : 'bg-teal-500/90 text-white hover:bg-teal-400/90'
                        }`}
                      >
                        {isTimerRunning ? 'Stop' : 'Start'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          resetTimer()
                        }}
                        className="px-3 py-1.5 rounded-full bg-white/5 text-slate-400 text-xs font-medium hover:bg-white/10 transition-all backdrop-blur-sm"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowTimerDialog(true)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 w-9 h-9 sm:w-10 sm:h-10 rounded-full"
                >
                  <Timer className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              )}
              {/* Feedback Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFeedbackDialog(true)}
                className="text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 w-9 h-9 sm:w-10 sm:h-10 rounded-full"
              >
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              {/* Share Button - Only for paid users with connections */}
              {isPaidUser && connections.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenShareDialog(selectedTopic)}
                  className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 w-9 h-9 sm:w-10 sm:h-10 rounded-full"
                >
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => void handleToggleBookmark(selectedTopic)}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${
                  isBookmarked
                    ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                    : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Topic Card - Glass Morphism */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/20 dark:border-slate-700/50 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50"
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-emerald-500/5 pointer-events-none" />

            {/* Topic Header */}
            <div className="relative p-4 sm:p-6 border-b border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <span className="inline-flex px-2.5 py-1 rounded-lg bg-gradient-to-r from-teal-500/10 to-emerald-500/10 dark:from-teal-500/20 dark:to-emerald-500/20 text-teal-700 dark:text-teal-300 text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-2">
                    {selectedTopic.specialty}
                  </span>
                  <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    {selectedTopic.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Added {formatDate(selectedTopic.$createdAt)}
                    </span>
                    {selectedTopic.$updatedAt !== selectedTopic.$createdAt && (
                      <span className="flex items-center gap-1 text-teal-500 dark:text-teal-400">
                        <Clock className="w-3 h-3" />
                        Updated {formatRelativeTime(selectedTopic.$updatedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Scenario */}
            <div className="relative p-4 sm:p-6 bg-gradient-to-br from-slate-50/80 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/30 border-b border-slate-200/50 dark:border-slate-700/50">
              <h2 className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Clinical Scenario
              </h2>
              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {selectedTopic.scenario}
              </p>
              {selectedTopic.scenarioImageUrl && (
                <div className="mt-4">
                  <img
                    src={selectedTopic.scenarioImageUrl}
                    alt="Scenario"
                    className="rounded-xl max-w-full h-auto border border-slate-200/50 dark:border-slate-700/50 shadow-lg"
                  />
                </div>
              )}
            </div>

            {/* Interactions */}
            {interactions.length > 0 && (
              <div className="relative p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {interactions.length}{' '}
                    {interactions.length === 1 ? 'Interaction' : 'Interactions'}
                  </h2>
                  {revealedInteractions.length < interactions.length && (
                    <button
                      onClick={() => {
                        const nextIndex = revealedInteractions.length
                        if (nextIndex < interactions.length) {
                          handleRevealInteraction(nextIndex)
                        }
                      }}
                      className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2 transition-all hover:shadow-lg hover:shadow-teal-500/30 active:scale-[0.98]"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <ChevronRight className="w-4 h-4 text-white" />
                        <span className="text-sm font-medium text-white">
                          Next Step
                        </span>
                      </div>
                    </button>
                  )}
                </div>
                <div className="space-y-3 sm:space-y-4">
                  {interactions.map((interaction, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                    >
                      {/* Question */}
                      <div className="p-3 sm:p-4 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-3 h-3 sm:w-4 sm:h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] sm:text-xs text-slate-400 mb-1">
                              You ask:
                            </p>
                            <p className="text-sm sm:text-base text-white">
                              {interaction.text}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Response */}
                      <div className="p-3 sm:p-4">
                        {revealedInteractions.includes(index) ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-start gap-2 sm:gap-3"
                          >
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/50 dark:to-emerald-900/50 flex items-center justify-center flex-shrink-0">
                              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-teal-600 dark:text-teal-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] sm:text-xs text-slate-400 mb-1">
                                Patient responds:
                              </p>
                              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300">
                                {interaction.reply}
                              </p>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleRevealInteraction(index)}
                              className="w-full group relative overflow-hidden rounded-xl bg-slate-900 dark:bg-white px-5 py-2.5 transition-all hover:shadow-lg hover:shadow-slate-900/20 dark:hover:shadow-white/20 active:scale-[0.98]"
                            >
                              <div className="flex items-center justify-center gap-2">
                                <Eye className="w-4 h-4 text-white dark:text-slate-900" />
                                <span className="text-sm font-medium text-white dark:text-slate-900">
                                  Reveal Response
                                </span>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Reveal All Button */}
                {revealedInteractions.length < interactions.length &&
                  revealedInteractions.length > 0 && (
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={() =>
                          setRevealedInteractions(interactions.map((_, i) => i))
                        }
                        className="w-full group relative overflow-hidden rounded-xl border border-slate-300 dark:border-slate-600 px-5 py-3 transition-all hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 active:scale-[0.98]"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Eye className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            Reveal All Responses
                          </span>
                        </div>
                      </button>
                    </div>
                  )}
              </div>
            )}
          </motion.div>
        </div>

        {/* iOS-style Timer Dialog */}
        <Dialog open={showTimerDialog} onOpenChange={setShowTimerDialog}>
          <DialogContent className="max-w-[90vw] sm:max-w-[340px] bg-slate-950 border-slate-800 p-0 overflow-hidden gap-0">
            {/* Hidden title for accessibility */}
            <DialogHeader className="sr-only">
              <DialogTitle>Set Timer</DialogTitle>
              <DialogDescription>
                Choose your practice duration
              </DialogDescription>
            </DialogHeader>

            {timerEnabled ? (
              /* Active Timer View */
              <div className="flex flex-col items-center py-10 px-6">
                {/* Large circular progress */}
                <div className="relative w-48 h-48 mb-4">
                  <svg
                    className="w-full h-full -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-slate-800"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={2 * Math.PI * 45}
                      strokeDashoffset={getTimerProgress()}
                      strokeLinecap="round"
                      className="text-rose-500 transition-all duration-1000"
                    />
                  </svg>

                  {/* Center time display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-light text-white tabular-nums tracking-tight font-mono">
                        {timerMinutes.toString().padStart(2, '0')}
                      </span>
                      <span className="text-4xl font-light text-white mx-0.5">
                        :
                      </span>
                      <span className="text-4xl font-light text-white tabular-nums tracking-tight font-mono">
                        {timerSeconds.toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Control buttons */}
                <div className="flex items-center gap-3 mt-4 w-full px-4">
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isTimerRunning
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-rose-600 text-white hover:bg-rose-500'
                    }`}
                  >
                    {isTimerRunning ? 'Stop' : 'Start'}
                  </button>
                  <button
                    onClick={resetTimer}
                    className="flex-1 py-3 rounded-xl bg-rose-950/50 text-rose-400 text-sm font-semibold hover:bg-rose-900 transition-all"
                  >
                    Reset
                  </button>
                </div>
              </div>
            ) : (
              /* Timer Setup View */
              <div className="flex flex-col">
                {/* Time picker section */}
                <div className="py-8 px-4">
                  {/* Scrollable minute picker */}
                  <div className="relative h-[180px] overflow-hidden">
                    {/* Gradient overlays */}
                    <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-950 to-transparent z-10 pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950 to-transparent z-10 pointer-events-none" />

                    {/* Selection highlight */}
                    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-12 bg-slate-800/50 rounded-xl border border-slate-700/50" />

                    {/* Minutes column */}
                    <div
                      ref={timerScrollRef}
                      onScroll={handleTimerScroll}
                      className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory"
                      style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                      }}
                    >
                      <div className="py-[66px]">
                        {Array.from({ length: 31 }, (_, i) => i).map((mins) => (
                          <button
                            key={mins}
                            onClick={() => {
                              setSelectedTimerMinutes(mins)
                              if (timerScrollRef.current) {
                                timerScrollRef.current.scrollTo({
                                  top: mins * 48,
                                  behavior: 'smooth',
                                })
                              }
                            }}
                            className={`snap-center w-full h-12 flex items-center justify-center transition-all ${
                              selectedTimerMinutes === mins
                                ? 'text-white text-3xl font-light'
                                : 'text-slate-600 text-2xl font-light'
                            }`}
                          >
                            <span className="tabular-nums">
                              {mins.toString().padStart(2, '0')}
                            </span>
                            <span
                              className={`text-xs ml-1 ${selectedTimerMinutes === mins ? 'text-slate-400' : 'text-slate-700'}`}
                            >
                              min
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Start button */}
                <div className="p-4 pt-2">
                  <button
                    onClick={() => {
                      if (selectedTimerMinutes > 0) {
                        startTimer(selectedTimerMinutes)
                      }
                    }}
                    disabled={selectedTimerMinutes === 0}
                    className="w-full py-3.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Start
                  </button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Share Dialog */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="max-w-[90vw] sm:max-w-[400px] dark:bg-slate-900 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 dark:text-white">
                <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Share OSCE Topic
              </DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                Share "{topicToShare?.title}" with one of your connections.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {connections.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No connections yet</p>
                  <p className="text-xs mt-1">
                    Add connections in the Sharing Center
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {connections.map((conn: Connection) => (
                    <button
                      key={conn.$id}
                      onClick={() => handleShareWithUser(conn.connectedUserId)}
                      disabled={isSharing}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {conn.connectedUsername?.charAt(0).toUpperCase() ||
                              '?'}
                          </span>
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {conn.connectedUsername}
                        </span>
                      </div>
                      {isSharing ? (
                        <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                      ) : (
                        <Share2 className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Feedback Dialog */}
        <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
          <DialogContent className="max-w-[90vw] sm:max-w-[450px] dark:bg-slate-900 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 dark:text-white">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Report Issue
              </DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                Found an error or have feedback about "{selectedTopic?.title}"?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Describe the issue or provide your feedback..."
                className="min-h-[120px] dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowFeedbackDialog(false)}
                className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitFeedback}
                disabled={!feedbackText.trim() || isSubmittingFeedback}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {isSubmittingFeedback ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    )
  }

  // Topic list view
  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
            OSCE Practice
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Practice clinical scenarios and patient interactions
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>
          <Select
            value={selectedSpecialty || 'all'}
            onValueChange={(v) => setSelectedSpecialty(v === 'all' ? null : v)}
          >
            <SelectTrigger className="w-full sm:w-56 dark:bg-slate-800 dark:border-slate-700 dark:text-white">
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="All Specialties" />
            </SelectTrigger>
            <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
              <SelectItem
                value="all"
                className="dark:text-white dark:focus:bg-slate-700"
              >
                All Specialties
              </SelectItem>
              {specialties.map((s: OsceSpecialties) => (
                <SelectItem
                  key={s.$id}
                  value={s.name}
                  className="dark:text-white dark:focus:bg-slate-700"
                >
                  {s.name} ({getTopicCount(s.name)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Specialty Pills (when no filter selected) */}
        {!selectedSpecialty && !searchQuery && (
          <div className="flex flex-wrap gap-2 mb-6">
            {specialties.map((specialty: OsceSpecialties) => (
              <button
                key={specialty.$id}
                onClick={() => setSelectedSpecialty(specialty.name)}
                className="px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 hover:from-teal-100 hover:to-emerald-100 dark:hover:from-teal-900/30 dark:hover:to-emerald-900/30 text-teal-700 dark:text-teal-300 text-xs sm:text-sm font-medium transition-all border border-teal-200/50 dark:border-teal-700/50 flex items-center gap-2"
              >
                {specialty.name}
                <Badge
                  variant="secondary"
                  className="bg-teal-200/50 dark:bg-teal-800/50 text-teal-700 dark:text-teal-300 text-[10px] sm:text-xs"
                >
                  {getTopicCount(specialty.name)}
                </Badge>
              </button>
            ))}
          </div>
        )}

        {/* Active Filter Badge */}
        {(selectedSpecialty || searchQuery) && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {selectedSpecialty && (
              <Badge
                variant="secondary"
                className="bg-teal-600 dark:bg-teal-500 text-white pl-3 pr-1 py-1"
              >
                {selectedSpecialty}
                <button
                  onClick={() => setSelectedSpecialty(null)}
                  className="ml-2 p-0.5 hover:bg-white/20 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {searchQuery && (
              <Badge
                variant="secondary"
                className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 pl-3 pr-1 py-1"
              >
                Search: "{searchQuery}"
                <button
                  onClick={() => setSearchQuery('')}
                  className="ml-2 p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Topics Grid - Clean Glass Morphism Cards without icons */}
        <div className="grid gap-3 sm:gap-4">
          <AnimatePresence mode="popLayout">
            {filteredTopics.map((topic: OsceTopics, index: number) => {
              const isBookmarked = bookmarkedTopicIds.includes(topic.$id)
              const wasUpdated = topic.$updatedAt !== topic.$createdAt

              return (
                <motion.div
                  key={topic.$id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                  className="group relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 rounded-2xl overflow-hidden hover:border-teal-300/50 dark:hover:border-teal-600/50 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 cursor-pointer"
                  onClick={() => handleSelectTopic(topic)}
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 via-transparent to-emerald-500/0 group-hover:from-teal-500/5 group-hover:to-emerald-500/5 transition-all duration-300 pointer-events-none" />

                  <div className="relative p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Specialty tag */}
                        <span className="inline-flex px-2 py-0.5 rounded-md bg-teal-100/50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-[10px] sm:text-xs font-medium mb-2">
                          {topic.specialty}
                        </span>

                        {/* Title */}
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base mb-2 line-clamp-1 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                          {topic.title}
                        </h3>

                        {/* Scenario Preview */}
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                          {topic.scenario}
                        </p>

                        {/* Meta row - removed interaction count */}
                        <div className="flex items-center gap-3 text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
                          {topic.scenarioImageUrl && (
                            <span className="flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              Has image
                            </span>
                          )}
                          {wasUpdated && (
                            <>
                              {topic.scenarioImageUrl && (
                                <span className="text-slate-300 dark:text-slate-600">
                                  •
                                </span>
                              )}
                              <span className="text-teal-500 dark:text-teal-400">
                                Updated
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Share Button - Only for paid users with connections */}
                        {isPaidUser && connections.length > 0 && (
                          <button
                            onClick={(e) => handleOpenShareDialog(topic, e)}
                            className="p-1.5 sm:p-2 rounded-lg transition-all text-slate-300 dark:text-slate-600 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 active:scale-95"
                          >
                            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            void handleToggleBookmark(topic)
                          }}
                          className={`p-1.5 sm:p-2 rounded-lg transition-all active:scale-95 ${
                            isBookmarked
                              ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                              : 'text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {isBookmarked ? (
                            <BookmarkCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          ) : (
                            <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          )}
                        </button>

                        {/* Arrow indicator */}
                        <ChevronRight className="w-4 h-4 text-slate-200 dark:text-slate-700 group-hover:text-teal-500 dark:group-hover:text-teal-400 transition-colors hidden sm:block" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {filteredTopics.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-teal-500 dark:text-teal-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                {searchQuery || selectedSpecialty
                  ? 'No topics match your filters'
                  : 'No OSCE topics available yet'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-[400px] dark:bg-slate-900 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-white">
              <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Share OSCE Topic
            </DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Share "{topicToShare?.title}" with one of your connections.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {connections.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No connections yet</p>
                <p className="text-xs mt-1">
                  Add connections in the Sharing Center
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {connections.map((conn: Connection) => (
                  <button
                    key={conn.$id}
                    onClick={() => handleShareWithUser(conn.connectedUserId)}
                    disabled={isSharing}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {conn.connectedUsername?.charAt(0).toUpperCase() ||
                            '?'}
                        </span>
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {conn.connectedUsername}
                      </span>
                    </div>
                    {isSharing ? (
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                    ) : (
                      <Share2 className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
