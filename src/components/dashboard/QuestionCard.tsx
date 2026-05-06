import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Check,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  ShieldAlert,
  LogOut,
  Flag,
  Info,
  Grid3X3,
  Share2,
  X,
  ZoomIn,
  Users,
  Loader2,
  Bookmark,
  StickyNote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Questions } from '@/server/lib/appwrite.types'
import { getQuestionImageUrlFn } from '@/server/functions/questions'

interface Connection {
  $id: string
  connectedUserId: string
  connectedUsername: string | null
}

interface QuestionCardProps {
  question: Questions
  questionIndex: number
  totalQuestions: number
  onNext: () => void
  onPrevious: () => void
  onFeedback: (text: string) => void
  onExitSession: () => void
  onJumpToQuestion?: (index: number) => void
  onFlagQuestion?: (questionId: string) => void
  onUnflagQuestion?: (questionId: string) => void
  onShareQuestion?: (questionId: string, sharedWithId: string) => Promise<void>
  onBookmarkQuestion?: (questionId: string) => Promise<void>
  onUnbookmarkQuestion?: (questionId: string) => Promise<void>
  onMarkAnswered?: (questionId: string) => void
  onSaveNote?: (
    questionId: string,
    noteText: string,
    questionNumber: number,
    poolNumber: number,
    categoryId: string | null,
    categoryName: string | null,
  ) => Promise<void>
  onGetNote?: (questionId: string) => Promise<string | null>
  flaggedQuestionIds?: string[]
  bookmarkedQuestionIds?: string[]
  answeredQuestionIds?: string[]
  noteQuestionIds?: string[]
  questions?: Questions[]
  connections?: Connection[]
  showTimer?: boolean
  elapsedTime?: number
  isPaidUser?: boolean
  categoryId?: string | null
  categoryName?: string | null
}

export function QuestionCard({
  question,
  questionIndex,
  totalQuestions,
  onNext,
  onPrevious,
  onFeedback,
  onExitSession,
  onJumpToQuestion,
  onFlagQuestion,
  onUnflagQuestion,
  onShareQuestion,
  onBookmarkQuestion,
  onUnbookmarkQuestion,
  onMarkAnswered,
  onSaveNote,
  onGetNote,
  flaggedQuestionIds = [],
  bookmarkedQuestionIds = [],
  answeredQuestionIds = [],
  noteQuestionIds = [],
  questions = [],
  connections = [],
  showTimer,
  elapsedTime = 0,
  isPaidUser = false,
  categoryId = null,
  categoryName = null,
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [isBlackout, setIsBlackout] = useState(false)
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false)
  const [showNavigator, setShowNavigator] = useState(false)
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null)
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [isBookmarking, setIsBookmarking] = useState(false)

  // Note state
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [isLoadingNote, setIsLoadingNote] = useState(false)

  const isLastQuestion = questionIndex === totalQuestions - 1
  const isFlagged = flaggedQuestionIds.includes(question.$id)
  const isBookmarked = bookmarkedQuestionIds.includes(question.$id)
  const hasNote = noteQuestionIds.includes(question.$id)

  // Fetch secure image URL when question has imageFileId
  useEffect(() => {
    const fetchImageUrl = async () => {
      // Reset state when question changes
      setResolvedImageUrl(null)
      setIsLoadingImage(false)

      // If there's a direct imageUrl, use it
      if (question.imageUrl && question.imageUrl.trim()) {
        setResolvedImageUrl(question.imageUrl.trim())
        return
      }

      // If there's an imageEmbed, try to extract URL from it
      if (question.imageEmbed && question.imageEmbed.trim()) {
        const embedContent = question.imageEmbed.trim()
        // Try to extract src from HTML img tag
        const srcMatch = embedContent.match(/src=["']([^"']+)["']/)
        if (srcMatch && srcMatch[1]) {
          setResolvedImageUrl(srcMatch[1])
          return
        }
        // If it's a plain URL (starts with http)
        if (embedContent.startsWith('http')) {
          setResolvedImageUrl(embedContent)
          return
        }
      }

      // If there's an imageFileId, fetch the secure URL from storage
      if (question.imageFileId && question.imageFileId.trim()) {
        setIsLoadingImage(true)
        try {
          const result = await getQuestionImageUrlFn({
            data: { fileId: question.imageFileId },
          })
          if (result.fileUrl) {
            setResolvedImageUrl(result.fileUrl)
          }
        } catch (error) {
          console.error('Failed to fetch image URL:', error)
          setResolvedImageUrl(null)
        } finally {
          setIsLoadingImage(false)
        }
        return
      }

      // Check hasImage flag as fallback - question might have image but no URL yet
      if (question.hasImage) {
        // Image expected but no source available
        console.log('Question has image flag but no image source')
      }
    }

    void fetchImageUrl()
  }, [
    question.$id,
    question.imageUrl,
    question.imageEmbed,
    question.imageFileId,
    question.hasImage,
  ])

  // Screen capture protection
  useEffect(() => {
    const triggerBlackout = () => {
      setIsBlackout(true)
      setTimeout(() => setIsBlackout(false), 3000)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        e.preventDefault()
        triggerBlackout()
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === 's'
      ) {
        e.preventDefault()
        triggerBlackout()
      }
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        e.preventDefault()
        triggerBlackout()
      }
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) &&
          e.shiftKey &&
          ['i', 'j', 'c'].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault()
        triggerBlackout()
      }
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      triggerBlackout()
    }

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      triggerBlackout()
    }

    // Visibility change detection for screen recording
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched tabs or minimized - could be recording
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('copy', handleCopy)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null)
    setShowAnswer(false)
    setShowFeedbackForm(false)
    setFeedbackText('')
    // Note: resolvedImageUrl is handled by the image fetch effect
  }, [question.$id])

  const options = [
    { key: 'A', text: question.optionA },
    { key: 'B', text: question.optionB },
    { key: 'C', text: question.optionC },
    { key: 'D', text: question.optionD },
  ]

  const handleSelectAnswer = (key: string) => {
    if (!showAnswer) {
      setSelectedAnswer(key)
      setShowAnswer(true)
      // Mark question as answered when user actually selects an answer
      if (onMarkAnswered && !answeredQuestionIds.includes(question.$id)) {
        onMarkAnswered(question.$id)
      }
    }
  }

  const handleToggleFlag = useCallback(() => {
    if (isFlagged) {
      onUnflagQuestion?.(question.$id)
    } else {
      onFlagQuestion?.(question.$id)
    }
  }, [isFlagged, question.$id, onFlagQuestion, onUnflagQuestion])

  const handleShareWithUser = async (userId: string) => {
    if (!onShareQuestion) return
    setIsSharing(true)
    try {
      await onShareQuestion(question.$id, userId)
      setShowShareDialog(false)
    } catch {
      // Error handled by parent
    } finally {
      setIsSharing(false)
    }
  }

  const handleToggleBookmark = useCallback(async () => {
    if (isBookmarking) return
    setIsBookmarking(true)
    try {
      if (isBookmarked) {
        await onUnbookmarkQuestion?.(question.$id)
      } else {
        await onBookmarkQuestion?.(question.$id)
      }
    } finally {
      setIsBookmarking(false)
    }
  }, [
    isBookmarked,
    isBookmarking,
    question.$id,
    onBookmarkQuestion,
    onUnbookmarkQuestion,
  ])

  // Handle opening note dialog and loading existing note
  const handleOpenNoteDialog = useCallback(async () => {
    setShowNoteDialog(true)
    if (onGetNote) {
      setIsLoadingNote(true)
      try {
        const existingNote = await onGetNote(question.$id)
        if (existingNote) {
          setNoteText(existingNote)
        }
      } catch (error) {
        console.error('Failed to load note:', error)
      } finally {
        setIsLoadingNote(false)
      }
    }
  }, [question.$id, onGetNote])

  // Handle saving note
  const handleSaveNote = useCallback(async () => {
    if (!onSaveNote || !noteText.trim()) return
    setIsSavingNote(true)
    try {
      await onSaveNote(
        question.$id,
        noteText.trim(),
        question.questionNumber,
        question.poolNumber,
        categoryId,
        categoryName,
      )
      setShowNoteDialog(false)
    } catch (error) {
      console.error('Failed to save note:', error)
    } finally {
      setIsSavingNote(false)
    }
  }, [
    question.$id,
    question.questionNumber,
    question.poolNumber,
    noteText,
    categoryId,
    categoryName,
    onSaveNote,
  ])

  // Reset note text when dialog closes
  const handleNoteDialogChange = useCallback((open: boolean) => {
    setShowNoteDialog(open)
    if (!open) {
      setNoteText('')
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getOptionStyle = (key: string) => {
    if (!showAnswer)
      return selectedAnswer === key
        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-400'
        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
    if (key === question.correctAnswer)
      return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-400 shadow-[0_0_0_1px_rgba(16,185,129,0.1)]'
    if (selectedAnswer === key)
      return 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-400'
    return 'border-slate-200 dark:border-slate-700 opacity-50'
  }

  const progressPercentage = ((questionIndex + 1) / totalQuestions) * 100

  // Count answered and flagged for display
  const answeredCount = answeredQuestionIds.length
  const flaggedCount = flaggedQuestionIds.length

  return (
    <div className="relative">
      {/* Blackout overlay for security */}
      <AnimatePresence>
        {isBlackout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-8 text-center"
          >
            <ShieldAlert className="w-16 h-16 text-red-500 mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Security Violation
            </h2>
            <p className="text-slate-400 max-w-xs">
              Screenshots and copying are strictly prohibited. Your session is
              protected.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        layout
        style={{ filter: isBlackout ? 'blur(20px)' : 'none' }}
        className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/30 overflow-hidden select-none"
      >
        {/* Enhanced Header with Progress - Mobile Optimized */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          {/* Top row: Question number, timer, and actions */}
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-1.5 sm:gap-3">
              <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                Q {questionIndex + 1}/{totalQuestions}
              </span>
              <button
                onClick={() => setShowNavigator(true)}
                className="flex items-center justify-center w-7 h-7 sm:w-auto sm:h-auto sm:gap-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors active:scale-95"
                aria-label="Navigate questions"
              >
                <Grid3X3 className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Navigate</span>
              </button>
            </div>

            {/* Action buttons - responsive layout */}
            <div className="flex items-center gap-1 sm:gap-2">
              {showTimer && (
                <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="font-mono text-[10px] sm:text-sm">
                    {formatTime(elapsedTime)}
                  </span>
                </div>
              )}

              {/* Share Button - Icon only on mobile */}
              {isPaidUser && onShareQuestion && connections.length > 0 && (
                <button
                  onClick={() => setShowShareDialog(true)}
                  className="flex items-center justify-center w-7 h-7 sm:w-auto sm:h-auto sm:gap-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 active:scale-95"
                  aria-label="Share question"
                >
                  <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              )}

              {/* Flag Button - Icon only on mobile */}
              <button
                onClick={handleToggleFlag}
                className={`flex items-center justify-center w-7 h-7 sm:w-auto sm:h-auto sm:gap-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all active:scale-95 ${
                  isFlagged
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
                aria-label={isFlagged ? 'Remove flag' : 'Flag question'}
              >
                <Flag
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFlagged ? 'fill-amber-500 dark:fill-amber-400' : ''}`}
                />
                <span className="hidden sm:inline">
                  {isFlagged ? 'Flagged' : 'Flag'}
                </span>
              </button>

              {/* Bookmark Button - Icon only on mobile */}
              <button
                onClick={handleToggleBookmark}
                className={`flex items-center justify-center w-7 h-7 sm:w-auto sm:h-auto sm:gap-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all active:scale-95 ${
                  isBookmarked
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
                aria-label={
                  isBookmarked ? 'Remove bookmark' : 'Bookmark question'
                }
              >
                <Bookmark
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isBookmarked ? 'fill-amber-500 dark:fill-amber-400' : ''}`}
                />
                <span className="hidden sm:inline">
                  {isBookmarked ? 'Saved' : 'Save'}
                </span>
              </button>

              {/* Note Button - Icon only on mobile */}
              {onSaveNote && (
                <button
                  onClick={handleOpenNoteDialog}
                  className={`flex items-center justify-center w-7 h-7 sm:w-auto sm:h-auto sm:gap-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all active:scale-95 ${
                    hasNote
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                  aria-label={hasNote ? 'Edit note' : 'Add note'}
                >
                  <StickyNote
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${hasNote ? 'fill-blue-500 dark:fill-blue-400' : ''}`}
                  />
                  <span className="hidden sm:inline">
                    {hasNote ? 'Note' : 'Note'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="h-1 sm:h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] sm:text-xs text-slate-400 dark:text-slate-500">
                {Math.round(progressPercentage)}% complete
              </span>
              <div className="flex items-center gap-1.5 sm:gap-3 text-[9px] sm:text-xs text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-0.5 sm:gap-1">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded bg-emerald-400" />
                  {answeredCount}
                </span>
                <span className="flex items-center gap-0.5 sm:gap-1">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded bg-amber-400" />
                  {flaggedCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-6 md:p-8">
          {/* Image Section with Click to Expand */}
          {isLoadingImage && (
            <div className="mb-3 sm:mb-6 w-full flex justify-center items-center bg-slate-50 dark:bg-slate-700/50 rounded-lg sm:rounded-2xl border border-slate-100 dark:border-slate-600 p-4 sm:p-8">
              <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                <Loader2 className="w-4 h-4 sm:w-6 sm:h-6 animate-spin" />
                <span className="text-[10px] sm:text-sm">Loading image...</span>
              </div>
            </div>
          )}
          {resolvedImageUrl && !isLoadingImage && (
            <div
              className="mb-3 sm:mb-6 w-full flex justify-center bg-slate-50 dark:bg-slate-700/50 rounded-lg sm:rounded-2xl border border-slate-100 dark:border-slate-600 p-1.5 sm:p-2 overflow-hidden cursor-pointer group relative"
              onClick={() => setShowImageDialog(true)}
            >
              <img
                src={resolvedImageUrl}
                alt="Question visual"
                className="max-w-full h-auto max-h-[160px] sm:max-h-[300px] object-contain rounded-md sm:rounded-xl shadow-sm transition-transform group-hover:scale-[1.02]"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg sm:rounded-2xl">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-800/90 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                  <ZoomIn className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Click to expand</span>
                  <span className="sm:hidden">Tap to expand</span>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm sm:text-lg text-slate-900 dark:text-white mb-4 sm:mb-8 font-medium leading-relaxed">
            {question.questionText}
          </p>

          <div className="space-y-2 sm:space-y-3">
            {options.map((option) => (
              <button
                key={option.key}
                onClick={() => handleSelectAnswer(option.key)}
                disabled={showAnswer}
                className={`w-full text-left p-2.5 sm:p-5 rounded-lg sm:rounded-xl border-2 transition-all min-h-[48px] sm:min-h-[64px] active:scale-[0.99] ${getOptionStyle(option.key)}`}
              >
                <div className="flex items-start gap-2 sm:gap-4">
                  <span
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center text-xs sm:text-sm font-semibold shrink-0 ${
                      selectedAnswer === option.key
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    } ${showAnswer && option.key === question.correctAnswer ? 'bg-emerald-500 text-white' : ''}`}
                  >
                    {option.key}
                  </span>
                  <span className="flex-1 text-xs sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
                    {option.text}
                  </span>
                  {showAnswer && option.key === question.correctAnswer && (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0 mt-0.5" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Explanation Section */}
          <AnimatePresence>
            {showAnswer && question.explanation && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-4 sm:mt-8 overflow-hidden"
              >
                <div className="p-3 sm:p-6 rounded-lg sm:rounded-2xl bg-amber-50/50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 text-amber-800 dark:text-amber-300 font-semibold text-xs sm:text-base">
                    <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Explanation</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs sm:text-base">
                    {question.explanation}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feedback Form */}
          <AnimatePresence>
            {showFeedbackForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-3 sm:mt-6 p-3 sm:p-5 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 overflow-hidden"
              >
                <Textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="What's wrong with this question?"
                  className="mb-2 sm:mb-3 bg-white dark:bg-slate-800 text-xs sm:text-base min-h-[60px] sm:min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      onFeedback(feedbackText)
                      setFeedbackText('')
                      setShowFeedbackForm(false)
                    }}
                    className="text-xs sm:text-sm h-8 sm:h-9"
                  >
                    Submit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowFeedbackForm(false)}
                    className="text-xs sm:text-sm h-8 sm:h-9"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Footer - Mobile Optimized */}
        <div className="px-3 sm:px-8 py-2.5 sm:py-5 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 bg-slate-50 dark:bg-slate-800/50">
          {/* Left side buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 order-2 sm:order-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAnswer(false)
                setSelectedAnswer(null)
                onPrevious()
              }}
              disabled={questionIndex === 0}
              className="flex-1 sm:flex-none h-9 sm:h-9 text-xs sm:text-sm"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
              <span className="hidden xs:inline">Previous</span>
              <span className="xs:hidden">Prev</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFeedbackForm(!showFeedbackForm)}
              className="flex-1 sm:flex-none h-9 sm:h-9 text-xs sm:text-sm"
            >
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">Feedback</span>
            </Button>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 order-1 sm:order-2">
            {!showAnswer && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnswer(true)}
                className="flex-1 sm:flex-none h-9 sm:h-9 text-xs sm:text-sm"
              >
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-0.5 sm:mr-2" />
                <span className="hidden xs:inline">Show Answer</span>
                <span className="xs:hidden">Answer</span>
              </Button>
            )}
            {isLastQuestion ? (
              <Button
                size="sm"
                onClick={() => setIsEndDialogOpen(true)}
                className="flex-1 sm:flex-none h-9 sm:h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm"
              >
                Finish{' '}
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5 sm:ml-2" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  setShowAnswer(false)
                  setSelectedAnswer(null)
                  onNext()
                }}
                className="flex-1 sm:flex-none h-9 sm:h-9 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white text-xs sm:text-sm"
              >
                Next{' '}
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5 sm:ml-2" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Image Expand Dialog - Protected from saving */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[90vw] max-h-[90vh] p-0 bg-slate-950 border-slate-800">
          <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4">
            <button
              onClick={() => setShowImageDialog(false)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            {resolvedImageUrl && (
              <img
                src={resolvedImageUrl}
                alt="Question visual - expanded"
                className="max-w-full max-h-[75vh] sm:max-h-[80vh] object-contain rounded-lg select-none"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                style={{ pointerEvents: 'none' }}
              />
            )}
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white/10 text-white/70 text-xs sm:text-sm flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Image saving is disabled</span>
              <span className="sm:hidden">Protected</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Question Dialog - Mobile Optimized */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[400px] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              Share Question
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Share this question with one of your connections.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 sm:py-4">
            {connections.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-slate-500">
                <Users className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs sm:text-sm">No connections yet</p>
                <p className="text-[10px] sm:text-xs mt-1">
                  Add connections in the Sharing Center
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[250px] sm:max-h-[300px] overflow-y-auto">
                {connections.map((conn) => (
                  <button
                    key={conn.$id}
                    onClick={() => handleShareWithUser(conn.connectedUserId)}
                    disabled={isSharing}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 transition-colors disabled:opacity-50 active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-medium text-xs sm:text-sm">
                          {conn.connectedUsername?.charAt(0).toUpperCase() ||
                            '?'}
                        </span>
                      </div>
                      <span className="font-medium text-sm sm:text-base text-slate-900 dark:text-white truncate">
                        {conn.connectedUsername}
                      </span>
                    </div>
                    {isSharing ? (
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                    ) : (
                      <Share2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Question Navigator Dialog - Mobile Optimized */}
      <Dialog open={showNavigator} onOpenChange={setShowNavigator}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[500px] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5" />
              Question Navigator
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Tap a question number to jump to it.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh] sm:max-h-[400px] pr-2 sm:pr-4">
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 sm:gap-2 py-3 sm:py-4">
              {Array.from({ length: totalQuestions }).map((_, index) => {
                const questionAtIndex = questions[index]
                const isCurrentQuestion = index === questionIndex
                const isFlaggedQuestion = questionAtIndex
                  ? flaggedQuestionIds.includes(questionAtIndex.$id)
                  : false
                const isAnsweredQuestion = questionAtIndex
                  ? answeredQuestionIds.includes(questionAtIndex.$id)
                  : false

                return (
                  <button
                    key={index}
                    onClick={() => {
                      onJumpToQuestion?.(index)
                      setShowNavigator(false)
                    }}
                    className={`w-full aspect-square min-h-[40px] sm:min-h-[44px] rounded-lg border-2 text-xs sm:text-sm font-medium transition-all active:scale-95 ${
                      isCurrentQuestion
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                        : isFlaggedQuestion
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                          : isAnsweredQuestion
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                    }`}
                  >
                    {index + 1}
                  </button>
                )
              })}
            </div>
          </ScrollArea>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2 border-t dark:border-slate-700 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-slate-900 dark:bg-white" />
              <span>Current</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700" />
              <span>Flagged</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700" />
              <span>Answered</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Completion Dialog */}
      <Dialog open={isEndDialogOpen} onOpenChange={setIsEndDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[400px] bg-slate-900 text-white border-slate-800 p-4 sm:p-6">
          <DialogHeader className="flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
              <Flag className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
            </div>
            <DialogTitle className="text-lg sm:text-xl">
              Practice Complete!
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs sm:text-sm">
              You've reached the end of this session.
              {flaggedQuestionIds.length > 0 && (
                <span className="block mt-2">
                  You have {flaggedQuestionIds.length} flagged question(s) to
                  review.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              onClick={onExitSession}
              className="w-full bg-white text-black hover:bg-slate-200 font-bold h-11 sm:h-10 text-sm"
            >
              <LogOut className="w-4 h-4 mr-2" /> Exit Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={handleNoteDialogChange}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[500px] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <StickyNote className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              {hasNote ? 'Edit Note' : 'Add Note'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Add personal notes for Question {question.questionNumber}. Notes
              are private and only visible to you.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 sm:py-4">
            {isLoadingNote ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write your notes here... (e.g., key concepts, mnemonics, things to remember)"
                className="min-h-[150px] sm:min-h-[200px] resize-none bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm"
                maxLength={3000}
              />
            )}
            <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
              <span>{noteText.length}/3000 characters</span>
              {noteText.length > 2500 && (
                <span className="text-amber-500">Approaching limit</span>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => handleNoteDialogChange(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNote}
              disabled={isSavingNote || !noteText.trim()}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSavingNote ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <StickyNote className="w-4 h-4 mr-2" />
                  Save Note
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
