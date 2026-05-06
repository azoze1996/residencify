import { useState, useEffect, useCallback, useRef } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  AlertTriangle,
  Crown,
  ChevronLeft,
  Info,
  Bookmark,
  Flag,
  Share2,
  MessageSquare,
  StickyNote,
  Timer,
  ChevronRight,
} from 'lucide-react'
import { z } from 'zod'
import { toast } from 'sonner'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { CategoryCard } from '@/components/dashboard/CategoryCard'
import { QuestionCard } from '@/components/dashboard/QuestionCard'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Loader } from '@/components/common/Loader'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getCurrentUserProfileFn } from '@/server/functions/users'
import { getUserCategoriesFn } from '@/server/functions/categories'
import {
  getQuestionCountsForCategoriesFn,
  listQuestionsByPoolFn,
} from '@/server/functions/questions'
import {
  canStartPracticeFn,
  getUserSessionFn,
  saveUserSessionFn,
  deleteUserSessionFn,
} from '@/server/functions/sessions'
import {
  getFlaggedQuestionIdsFn,
  flagQuestionFn,
  unflagQuestionFn,
  getFlaggedQuestionsFn,
} from '@/server/functions/flagged'
import {
  getConnectionsFn,
  shareQuestionFn,
} from '@/server/functions/connections'
import {
  getBookmarkedIdsFn,
  toggleBookmarkFn,
} from '@/server/functions/bookmarks'
import {
  getCompletedCategoryIdsFn,
  toggleCategoryCompletionFn,
} from '@/server/functions/progress'
import { createFeedbackFn } from '@/server/functions/feedback'
import {
  saveQuestionNoteFn,
  getQuestionNoteFn,
  getNoteIdsForQuestionsFn,
} from '@/server/functions/notes'
import { useServerFn } from '@tanstack/react-start'
import type { Categories, Questions } from '@/server/lib/appwrite.types'

const searchSchema = z.object({
  category: z.string().optional(),
  question: z.string().optional(),
  pool: z.string().optional(),
  resume: z.string().optional(),
})

interface Connection {
  $id: string
  connectedUserId: string
  connectedUsername: string | null
}

export const Route = createFileRoute('/_protected/dashboard/practice')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps: { search } }) => {
    const [
      profileResult,
      categoriesResult,
      planValidation,
      questionCounts,
      flaggedIds,
      connectionsResult,
      bookmarkedIds,
      completedCategoryIds,
    ] = await Promise.all([
      getCurrentUserProfileFn(),
      getUserCategoriesFn().catch(() => ({ categories: [], userDomain: '' })),
      canStartPracticeFn().catch(() => ({
        canStart: false,
        message: 'Plan validation failed',
        planType: 'free',
        endDate: '',
      })),
      getQuestionCountsForCategoriesFn().catch(() => ({ poolCounts: {} })),
      getFlaggedQuestionIdsFn().catch(() => ({ flaggedIds: [] })),
      getConnectionsFn().catch(() => ({ connections: [] })),
      getBookmarkedIdsFn({ data: { itemType: 'mcq' } }).catch(() => ({
        bookmarkedIds: [],
      })),
      getCompletedCategoryIdsFn().catch(() => ({ completedIds: [] })),
    ])

    return {
      userProfile: profileResult.user,
      categories: categoriesResult.categories,
      planValidation,
      poolCounts: questionCounts.poolCounts as Record<number, number>,
      initialFlaggedIds: flaggedIds.flaggedIds,
      connections: connectionsResult.connections as Connection[],
      initialBookmarkedIds: bookmarkedIds.bookmarkedIds,
      initialCompletedCategoryIds: completedCategoryIds.completedIds,
      // Pass search params for navigation
      resumeCategoryId: search.category,
      shouldAutoResume: search.resume === 'true',
      bookmarkQuestionId: search.question,
      bookmarkPoolNumber: search.pool ? parseInt(search.pool) : undefined,
    }
  },
  component: PracticePage,
})

function PracticePage() {
  const {
    userProfile,
    categories,
    planValidation,
    poolCounts,
    initialFlaggedIds,
    connections,
    initialBookmarkedIds,
    initialCompletedCategoryIds,
    resumeCategoryId,
    shouldAutoResume,
    bookmarkQuestionId,
    bookmarkPoolNumber,
  } = Route.useLoaderData()
  const navigate = useNavigate()

  const [selectedCategory, setSelectedCategory] = useState<Categories | null>(
    null,
  )
  const [parentCategory, setParentCategory] = useState<Categories | null>(null)
  const [questions, setQuestions] = useState<Questions[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [useTimer, setUseTimer] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [showStartDialog, setShowStartDialog] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [flaggedQuestionIds, setFlaggedQuestionIds] =
    useState<string[]>(initialFlaggedIds)
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<string[]>([])
  const [viewingSubcategories, setViewingSubcategories] = useState(false)
  const [bookmarkedQuestionIds, setBookmarkedQuestionIds] =
    useState<string[]>(initialBookmarkedIds)
  const [completedCategoryIds, setCompletedCategoryIds] = useState<string[]>(
    initialCompletedCategoryIds,
  )
  const [noteQuestionIds, setNoteQuestionIds] = useState<string[]>([])
  const [showFeatureGuide, setShowFeatureGuide] = useState(false)

  // Use ref to track pending action to avoid state updates during render
  const pendingActionRef = useRef<'resume' | 'fresh' | 'bookmark' | null>(null)
  const [triggerPractice, setTriggerPractice] = useState(0)

  // Server function hooks
  const listQuestionsByPool = useServerFn(listQuestionsByPoolFn)
  const getUserSession = useServerFn(getUserSessionFn)
  const saveUserSession = useServerFn(saveUserSessionFn)
  const deleteUserSession = useServerFn(deleteUserSessionFn)
  const flagQuestion = useServerFn(flagQuestionFn)
  const unflagQuestion = useServerFn(unflagQuestionFn)
  const shareQuestion = useServerFn(shareQuestionFn)
  const toggleBookmark = useServerFn(toggleBookmarkFn)
  const toggleCategoryCompletion = useServerFn(toggleCategoryCompletionFn)
  const createFeedback = useServerFn(createFeedbackFn)
  const saveQuestionNote = useServerFn(saveQuestionNoteFn)
  const getQuestionNote = useServerFn(getQuestionNoteFn)
  const getNoteIdsForQuestions = useServerFn(getNoteIdsForQuestionsFn)

  // Check if user has a paid plan
  const isPaidUser = userProfile?.planType === 'paid'

  // Get subcategories for a parent category
  const getSubcategories = useCallback(
    (parentId: string): Categories[] => {
      return categories.filter((c: Categories) => c.parentId === parentId)
    },
    [categories],
  )

  // Check if category has subcategories
  const hasSubcategories = useCallback(
    (categoryId: string): boolean => {
      return categories.some((c: Categories) => c.parentId === categoryId)
    },
    [categories],
  )

  // Get subcategory count for a category
  const getSubcategoryCount = useCallback(
    (categoryId: string): number => {
      return categories.filter((c: Categories) => c.parentId === categoryId)
        .length
    },
    [categories],
  )

  // Check if category has direct questions (pool numbers assigned)
  const hasDirectQuestions = useCallback((category: Categories): boolean => {
    return !!(category.poolNumbers && category.poolNumbers.length > 0)
  }, [])

  // Calculate question count for a category
  const getQuestionCount = useCallback(
    (category: Categories): number => {
      if (!category.poolNumbers || category.poolNumbers.length === 0) return 0
      return category.poolNumbers.reduce((total, poolNum) => {
        return total + (poolCounts[poolNum] || 0)
      }, 0)
    },
    [poolCounts],
  )

  // Handle category selection with improved logic
  const handleCategorySelect = useCallback(
    (category: Categories) => {
      const subcats = getSubcategories(category.$id)
      const hasPools = hasDirectQuestions(category)

      // If category has subcategories and NO pool numbers, show subcategories
      if (subcats.length > 0 && !hasPools) {
        setParentCategory(category)
        setViewingSubcategories(true)
        return
      }

      // If category has pool numbers (questions), allow practice
      if (hasPools) {
        setSelectedCategory(category)
        setShowStartDialog(true)
        return
      }

      // Category has neither - show message
      toast.info('This category has no questions yet.')
    },
    [getSubcategories, hasDirectQuestions],
  )

  // Go back to parent categories
  const handleBackToParent = useCallback(() => {
    setParentCategory(null)
    setViewingSubcategories(false)
  }, [])

  // Effect to handle bookmark navigation on mount
  useEffect(() => {
    if (bookmarkQuestionId && bookmarkPoolNumber) {
      // Find category that contains this pool number
      const category = categories.find(
        (c: Categories) =>
          c.poolNumbers && c.poolNumbers.includes(bookmarkPoolNumber),
      )

      if (category) {
        setSelectedCategory(category)
        pendingActionRef.current = 'bookmark'
        setTriggerPractice((prev) => prev + 1)
      } else {
        toast.error('Category not found for this question')
        // Clear search params
        void navigate({ to: '/dashboard/practice', search: {} })
      }
    }
  }, [bookmarkQuestionId, bookmarkPoolNumber, categories, navigate])

  // Effect to handle auto-resume from dashboard
  useEffect(() => {
    if (resumeCategoryId && shouldAutoResume) {
      // Find the category
      const category = categories.find(
        (c: Categories) => c.$id === resumeCategoryId,
      )

      if (category) {
        setSelectedCategory(category)
        setUseTimer(false) // Default to no timer for resume
        pendingActionRef.current = 'resume'
        setTriggerPractice((prev) => prev + 1)
        // Clear search params after triggering
        void navigate({ to: '/dashboard/practice', search: {} })
      } else {
        toast.error('Category not found')
        void navigate({ to: '/dashboard/practice', search: {} })
      }
    }
  }, [resumeCategoryId, shouldAutoResume, categories, navigate])

  // Execute practice start
  const executePracticeStart = useCallback(
    async (resume: boolean, bookmarkMode = false) => {
      if (!selectedCategory?.poolNumbers) return
      setIsLoadingQuestions(true)

      try {
        // Always reset state first for a clean slate
        setQuestions([])
        setCurrentQuestionIndex(0)
        setElapsedTime(0)
        setAnsweredQuestionIds([])

        const allQs: Questions[] = []
        for (const pool of selectedCategory.poolNumbers) {
          const res = await listQuestionsByPool({ data: { poolNumber: pool } })
          allQs.push(...res.questions)
        }

        if (allQs.length === 0) {
          toast.error('No questions found.')
          setIsLoadingQuestions(false)
          return
        }

        setQuestions(allQs)

        // Load note IDs for all questions
        try {
          const noteIdsResult = await getNoteIdsForQuestions({
            data: { questionIds: allQs.map((q) => q.$id) },
          })
          setNoteQuestionIds(noteIdsResult.noteIds)
        } catch (error) {
          console.error('Failed to load note IDs:', error)
          setNoteQuestionIds([])
        }

        // Handle bookmark navigation mode
        if (bookmarkMode && bookmarkQuestionId) {
          const questionIndex = allQs.findIndex(
            (q) => q.$id === bookmarkQuestionId,
          )
          if (questionIndex !== -1) {
            setCurrentQuestionIndex(questionIndex)
            setUseTimer(false)
            setElapsedTime(0)
            setAnsweredQuestionIds([])
            toast.success(
              `Jumped to bookmarked question ${questionIndex + 1} of ${allQs.length}`,
            )
            // Clear search params after navigation
            void navigate({ to: '/dashboard/practice', search: {} })
          } else {
            toast.error('Bookmarked question not found in this category')
            setCurrentQuestionIndex(0)
          }
          setIsTimerRunning(false)
          setIsLoadingQuestions(false)
          return
        }

        if (resume) {
          // Try to get existing session for this user
          const session = await getUserSession({
            data: { categoryId: selectedCategory.$id },
          })
          if (session.session) {
            // Resume from saved position with exact state restoration
            const savedIndex = session.session.lastQuestionIndex || 0
            // Ensure index is within bounds
            const validIndex = Math.min(savedIndex, allQs.length - 1)
            setCurrentQuestionIndex(validIndex)
            setElapsedTime(session.session.elapsedTime || 0)
            setUseTimer(session.session.useTimer || false)
            setAnsweredQuestionIds(session.session.answeredQuestions || [])

            // Show detailed resume info
            const answeredCount = session.session.answeredQuestions?.length || 0
            const timeSpent = session.session.elapsedTime || 0
            const minutes = Math.floor(timeSpent / 60)
            const seconds = timeSpent % 60

            toast.success(
              `Session resumed! Question ${validIndex + 1}/${allQs.length} • ${answeredCount} answered • ${minutes}m ${seconds}s`,
              { duration: 4000 },
            )
          } else {
            // No previous session found - start fresh at 0
            toast.info(
              'No saved session found. Starting fresh from question 1.',
            )
            setCurrentQuestionIndex(0)
            setElapsedTime(0)
            setAnsweredQuestionIds([])
          }
        } else {
          // Start fresh - delete any existing session first
          try {
            await deleteUserSession({
              data: { categoryId: selectedCategory.$id },
            })
          } catch {
            /* No session existed, ignore */
          }
          // Explicitly start at question 0 (first question)
          setCurrentQuestionIndex(0)
          setElapsedTime(0)
          setAnsweredQuestionIds([])
          toast.success('Starting fresh from question 1!')
        }

        setIsTimerRunning(true)
        setIsLoadingQuestions(false)
      } catch (err) {
        console.error('Load failed:', err)
        toast.error('Failed to load questions.')
        setIsLoadingQuestions(false)
      }
    },
    [
      selectedCategory,
      listQuestionsByPool,
      getUserSession,
      deleteUserSession,
      bookmarkQuestionId,
      navigate,
      getNoteIdsForQuestions,
    ],
  )

  // Effect to handle practice start after dialog closes
  useEffect(() => {
    if (triggerPractice > 0 && pendingActionRef.current && !showStartDialog) {
      const action = pendingActionRef.current
      pendingActionRef.current = null
      // Execute after a small delay to ensure dialog is fully closed
      const timeoutId = setTimeout(() => {
        if (action === 'bookmark') {
          void executePracticeStart(false, true)
        } else {
          void executePracticeStart(action === 'resume', false)
        }
      }, 50)
      return () => clearTimeout(timeoutId)
    }
  }, [triggerPractice, showStartDialog, executePracticeStart])

  // Exit practice mode
  const exitPractice = useCallback(() => {
    setQuestions([])
    setSelectedCategory(null)
    setCurrentQuestionIndex(0)
    setElapsedTime(0)
    setIsTimerRunning(false)
    setShowSaveDialog(false)
  }, [])

  // Enhanced save and exit with detailed feedback
  const handleSaveAndExit = useCallback(async () => {
    if (!selectedCategory) return

    // Save with complete state information
    await saveUserSession({
      data: {
        categoryId: selectedCategory.$id,
        lastQuestionIndex: currentQuestionIndex,
        answeredQuestions: answeredQuestionIds,
        elapsedTime,
        useTimer,
        totalQuestions: questions.length,
        isCompleted: false,
      },
    })

    const answeredCount = answeredQuestionIds.length
    const minutes = Math.floor(elapsedTime / 60)
    const seconds = elapsedTime % 60

    toast.success(
      `Session saved! Progress: ${currentQuestionIndex + 1}/${questions.length} • ${answeredCount} answered • ${minutes}m ${seconds}s`,
      { duration: 4000 },
    )

    // Call exitPractice after saving
    exitPractice()
  }, [
    selectedCategory,
    saveUserSession,
    currentQuestionIndex,
    answeredQuestionIds,
    elapsedTime,
    useTimer,
    questions.length,
  ])

  // Auto-save session periodically (every 30 seconds)
  useEffect(() => {
    if (!selectedCategory || questions.length === 0 || !isTimerRunning) {
      return
    }

    const autoSaveInterval = setInterval(async () => {
      try {
        await saveUserSession({
          data: {
            categoryId: selectedCategory.$id,
            lastQuestionIndex: currentQuestionIndex,
            answeredQuestions: answeredQuestionIds,
            elapsedTime,
            useTimer,
            totalQuestions: questions.length,
            isCompleted: false,
          },
        })
        console.log('Auto-saved session at question', currentQuestionIndex + 1)
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }, 30000) // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [
    selectedCategory,
    currentQuestionIndex,
    answeredQuestionIds,
    elapsedTime,
    useTimer,
    questions.length,
    isTimerRunning,
    saveUserSession,
  ])

  const handleFeedback = useCallback(
    (txt: string) => {
      if (questions[currentQuestionIndex]) {
        void createFeedback({
          data: {
            questionId: questions[currentQuestionIndex].$id,
            feedbackText: txt,
          },
        })
      }
    },
    [createFeedback, questions, currentQuestionIndex],
  )

  // Question navigation handlers
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }, [currentQuestionIndex, questions.length])

  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }, [currentQuestionIndex])

  const handleJumpToQuestion = useCallback((index: number) => {
    setCurrentQuestionIndex(index)
  }, [])

  // Flag/unflag handlers
  const handleFlagQuestion = useCallback(
    async (questionId: string) => {
      try {
        const question = questions.find((q) => q.$id === questionId)
        if (!question) return

        await flagQuestion({
          data: {
            questionId,
            sessionId: null,
            note: null,
          },
        })
        setFlaggedQuestionIds((prev) => [...prev, questionId])
        toast.success('Question flagged')
      } catch {
        toast.error('Failed to flag question')
      }
    },
    [flagQuestion, questions],
  )

  const handleUnflagQuestion = useCallback(
    async (questionId: string) => {
      try {
        // Find the flag ID first
        const flaggedQuestion = await getFlaggedQuestionsFn()
        const flag = flaggedQuestion.flaggedQuestions.find(
          (fq) => fq.questionId === questionId,
        )

        if (flag) {
          await unflagQuestion({ data: { flagId: flag.$id } })
          setFlaggedQuestionIds((prev) =>
            prev.filter((id) => id !== questionId),
          )
          toast.success('Flag removed')
        }
      } catch {
        toast.error('Failed to remove flag')
      }
    },
    [unflagQuestion],
  )

  // Share handler
  const handleShareQuestion = useCallback(
    async (questionId: string, sharedWithId: string) => {
      try {
        await shareQuestion({ data: { questionId, sharedWithId } })
        toast.success('Question shared successfully!')
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to share question'
        toast.error(message)
      }
    },
    [shareQuestion],
  )

  // Bookmark handlers
  const handleBookmarkQuestion = useCallback(
    async (questionId: string) => {
      try {
        const question = questions.find((q) => q.$id === questionId)
        if (!question) return

        await toggleBookmark({
          data: {
            itemType: 'mcq',
            itemId: questionId,
            questionNumber: question.questionNumber,
            poolNumber: question.poolNumber,
          },
        })
        setBookmarkedQuestionIds((prev) => [...prev, questionId])
        toast.success('Question bookmarked')
      } catch {
        toast.error('Failed to bookmark question')
      }
    },
    [toggleBookmark, questions],
  )

  const handleUnbookmarkQuestion = useCallback(
    async (questionId: string) => {
      try {
        await toggleBookmark({
          data: {
            itemType: 'mcq',
            itemId: questionId,
          },
        })
        setBookmarkedQuestionIds((prev) =>
          prev.filter((id) => id !== questionId),
        )
        toast.success('Bookmark removed')
      } catch {
        toast.error('Failed to remove bookmark')
      }
    },
    [toggleBookmark],
  )

  // Mark answered handler
  const handleMarkAnswered = useCallback((questionId: string) => {
    setAnsweredQuestionIds((prev) => {
      if (prev.includes(questionId)) return prev
      return [...prev, questionId]
    })
  }, [])

  // Note handlers
  const handleSaveNote = useCallback(
    async (
      questionId: string,
      noteText: string,
      questionNumber: number,
      poolNumber: number,
      categoryId: string | null,
      categoryName: string | null,
    ) => {
      try {
        const result = await saveQuestionNote({
          data: {
            questionId,
            noteText,
            questionNumber,
            poolNumber,
            categoryId,
            categoryName,
          },
        })

        // Update note IDs list
        if (result.isNew) {
          setNoteQuestionIds((prev) => [...prev, questionId])
          toast.success('Note saved!')
        } else {
          toast.success('Note updated!')
        }
      } catch (error) {
        console.error('Failed to save note:', error)
        toast.error('Failed to save note')
        throw error
      }
    },
    [saveQuestionNote],
  )

  const handleGetNote = useCallback(
    async (questionId: string): Promise<string | null> => {
      try {
        const result = await getQuestionNote({ data: { questionId } })
        return result.note?.noteText || null
      } catch (error) {
        console.error('Failed to get note:', error)
        return null
      }
    },
    [getQuestionNote],
  )

  // Category completion handler
  const handleToggleCategoryCompletion = useCallback(
    async (categoryId: string) => {
      try {
        const isCompleted = completedCategoryIds.includes(categoryId)
        await toggleCategoryCompletion({
          data: { categoryId, isCompleted: !isCompleted },
        })

        if (isCompleted) {
          setCompletedCategoryIds((prev) =>
            prev.filter((id) => id !== categoryId),
          )
          toast.success('Category marked as incomplete')
        } else {
          setCompletedCategoryIds((prev) => [...prev, categoryId])
          toast.success('Category marked as complete!')
        }
      } catch {
        toast.error('Failed to update category status')
      }
    },
    [toggleCategoryCompletion, completedCategoryIds],
  )

  // Start practice handler
  const handleStartPractice = useCallback((resume: boolean) => {
    setShowStartDialog(false)
    pendingActionRef.current = resume ? 'resume' : 'fresh'
    setTriggerPractice((prev) => prev + 1)
  }, [])

  // Get current display categories based on view mode
  const displayCategories =
    viewingSubcategories && parentCategory
      ? getSubcategories(parentCategory.$id)
      : categories.filter((c: Categories) => !c.parentId)

  // Check if user has seen the feature guide
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('hasSeenPracticeGuide')
    if (!hasSeenGuide && questions.length > 0) {
      setShowFeatureGuide(true)
      localStorage.setItem('hasSeenPracticeGuide', 'true')
    }
  }, [questions.length])

  // Loading state
  if (isLoadingQuestions) {
    return (
      <DashboardLayout userProfile={userProfile}>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  // Question practice mode
  if (questions.length > 0) {
    return (
      <DashboardLayout userProfile={userProfile}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => setShowSaveDialog(true)}
              className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Exit Session
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                {selectedCategory?.name}
              </h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFeatureGuide(true)}
                className="h-8 w-8 rounded-full text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-500/10"
              >
                <Info className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <QuestionCard
            question={questions[currentQuestionIndex]}
            questionIndex={currentQuestionIndex}
            totalQuestions={questions.length}
            onNext={handleNextQuestion}
            onPrevious={handlePreviousQuestion}
            onJumpToQuestion={handleJumpToQuestion}
            onFlagQuestion={handleFlagQuestion}
            onUnflagQuestion={handleUnflagQuestion}
            onShareQuestion={isPaidUser ? handleShareQuestion : undefined}
            onBookmarkQuestion={handleBookmarkQuestion}
            onUnbookmarkQuestion={handleUnbookmarkQuestion}
            onMarkAnswered={handleMarkAnswered}
            onSaveNote={handleSaveNote}
            onGetNote={handleGetNote}
            flaggedQuestionIds={flaggedQuestionIds}
            bookmarkedQuestionIds={bookmarkedQuestionIds}
            answeredQuestionIds={answeredQuestionIds}
            noteQuestionIds={noteQuestionIds}
            questions={questions}
            connections={isPaidUser ? connections : []}
            isPaidUser={isPaidUser}
            onFeedback={handleFeedback}
            showTimer={useTimer}
            elapsedTime={elapsedTime}
            onExitSession={exitPractice}
            categoryId={selectedCategory?.$id || null}
            categoryName={selectedCategory?.name || null}
          />

          {/* Feature Guide Dialog */}
          <Dialog open={showFeatureGuide} onOpenChange={setShowFeatureGuide}>
            <DialogContent className="max-w-[90vw] sm:max-w-2xl dark:bg-slate-900 dark:border-slate-700">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl dark:text-white">
                  <Info className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  Practice Session Features
                </DialogTitle>
                <DialogDescription className="dark:text-slate-400">
                  Here's what you can do while practicing questions
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-4 py-4">
                  {/* Bookmark Feature */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800/50 flex items-center justify-center flex-shrink-0">
                      <Bookmark className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                        Bookmark Questions
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Save important questions for later review. Access all
                        your bookmarks from the Bookmarks page.
                      </p>
                    </div>
                  </div>

                  {/* Flag Feature */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/50">
                    <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-800/50 flex items-center justify-center flex-shrink-0">
                      <Flag className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                        Flag for Review
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Mark questions you want to revisit during this session.
                        Flags help you track challenging questions.
                      </p>
                    </div>
                  </div>

                  {/* Notes Feature */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center flex-shrink-0">
                      <StickyNote className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                        Add Personal Notes
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Write notes on any question to remember key concepts or
                        create your own explanations.
                      </p>
                    </div>
                  </div>

                  {/* Timer Feature */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700/50">
                    <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-800/50 flex items-center justify-center flex-shrink-0">
                      <Timer className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                        Track Your Time
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Your session time is automatically tracked. Enable the
                        timer to practice under time pressure.
                      </p>
                    </div>
                  </div>

                  {/* Feedback Feature */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-800/50 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                        Report Issues
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Found an error or have feedback? Use the feedback button
                        to report issues with questions.
                      </p>
                    </div>
                  </div>

                  {isPaidUser && connections.length > 0 && (
                    /* Share Feature - Paid Users Only */
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700/50">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-800/50 flex items-center justify-center flex-shrink-0">
                        <Share2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                          Share with Connections
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-800/50 text-amber-700 dark:text-amber-300">
                            PREMIUM
                          </span>
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Share interesting questions with your study partners
                          and colleagues.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Navigation Tip */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                      <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                        Quick Navigation
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Use the navigation bar to jump between questions. Your
                        progress is auto-saved every 30 seconds.
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
                    localStorage.removeItem('hasSeenPracticeGuide')
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

          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogContent className="dark:bg-slate-900 dark:border-slate-700">
              <DialogHeader>
                <DialogTitle className="dark:text-white">
                  Exit Session?
                </DialogTitle>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={exitPractice}
                  className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Exit Without Saving
                </Button>
                <Button onClick={handleSaveAndExit}>Save & Exit</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="max-w-4xl mx-auto">
        {!planValidation.canStart && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                <Crown className="inline w-4 h-4 mr-1 mb-1" /> Subscription
                Required
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                {planValidation.message ||
                  'Please renew your plan to start practicing.'}
              </p>
            </div>
          </div>
        )}

        {/* Header with back button when viewing subcategories */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            {viewingSubcategories && parentCategory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToParent}
                className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
              {viewingSubcategories && parentCategory
                ? parentCategory.name
                : 'Practice'}
            </h1>
          </div>

          {/* Feature Guide Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const hasSeenGuide = localStorage.getItem('hasSeenDashboardGuide')
              if (!hasSeenGuide) {
                localStorage.setItem('hasSeenDashboardGuide', 'true')
              }
              // Navigate to dashboard to show the guide
              void navigate({ to: '/dashboard' })
              toast.info('Opening dashboard guide...')
            }}
            className="h-9 w-9 rounded-full text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-500/10"
          >
            <Info className="w-4 h-4" />
          </Button>
        </div>

        {/* Categories Grid */}
        <div className="grid gap-3 sm:gap-4">
          {displayCategories.map((cat: Categories, i: number) => (
            <CategoryCard
              key={cat.$id}
              category={cat}
              index={i}
              onClick={() => handleCategorySelect(cat)}
              hasChildren={hasSubcategories(cat.$id)}
              questionCount={getQuestionCount(cat)}
              subcategoryCount={
                hasSubcategories(cat.$id) ? getSubcategoryCount(cat.$id) : 0
              }
              isCompleted={completedCategoryIds.includes(cat.$id)}
              onToggleComplete={handleToggleCategoryCompletion}
            />
          ))}
        </div>
      </div>

      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent className="dark:bg-slate-900 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              Practice Settings
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between py-4">
            <Label htmlFor="timer-switch" className="dark:text-slate-300">
              Enable Timer
            </Label>
            <Switch
              id="timer-switch"
              checked={useTimer}
              onCheckedChange={setUseTimer}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => handleStartPractice(true)}
              className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Resume Previous
            </Button>
            <Button onClick={() => handleStartPractice(false)}>
              Start Fresh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
