import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import {
  MessageSquareText,
  Clock,
  CheckCircle2,
  Eye,
  Send,
  Trash2,
  User,
  FileQuestion,
  Filter,
  Loader2,
  X,
  ChevronDown,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { getCurrentUserProfileFn } from '@/server/functions/users'
import {
  listAllFeedbackFn,
  respondToFeedbackFn,
  deleteFeedbackFn,
  getFeedbackStatsFn,
} from '@/server/functions/feedback'
import type { Feedback } from '@/server/lib/appwrite.types'

export const Route = createFileRoute('/_protected/admin/feedback')({
  loader: async () => {
    const [profileResult, feedbackResult, statsResult] = await Promise.all([
      getCurrentUserProfileFn(),
      listAllFeedbackFn().catch(() => ({ feedback: [] })),
      getFeedbackStatsFn().catch(() => ({
        total: 0,
        pending: 0,
        reviewed: 0,
        resolved: 0,
      })),
    ])

    return {
      userProfile: profileResult.user,
      feedback: feedbackResult.feedback,
      stats: statsResult,
    }
  },
  component: FeedbackPage,
})

function FeedbackPage() {
  const {
    userProfile,
    feedback: initialFeedback,
    stats: initialStats,
  } = Route.useLoaderData()
  const queryClient = useQueryClient()

  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null,
  )
  const [showResponseDialog, setShowResponseDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [responseText, setResponseText] = useState('')
  const [responseStatus, setResponseStatus] = useState<
    'pending' | 'reviewed' | 'resolved'
  >('reviewed')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const listAllFeedback = useServerFn(listAllFeedbackFn)
  const respondToFeedback = useServerFn(respondToFeedbackFn)
  const deleteFeedback = useServerFn(deleteFeedbackFn)
  const getFeedbackStats = useServerFn(getFeedbackStatsFn)

  const { data: feedbackData } = useQuery({
    queryKey: ['admin-feedback'],
    queryFn: () => listAllFeedback(),
    initialData: { feedback: initialFeedback },
  })

  const { data: statsData } = useQuery({
    queryKey: ['admin-feedback-stats'],
    queryFn: () => getFeedbackStats(),
    initialData: initialStats,
  })

  const feedback = feedbackData?.feedback || []
  const stats = statsData || initialStats

  const filteredFeedback =
    filterStatus === 'all'
      ? feedback
      : feedback.filter((f: Feedback) => {
          if (filterStatus === 'pending') {
            return !f.status || f.status === 'pending'
          }
          return f.status === filterStatus
        })

  const respondMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFeedback) return
      return await respondToFeedback({
        data: {
          id: selectedFeedback.$id,
          adminResponse: responseText.trim(),
          status: responseStatus,
        },
      })
    },
    onSuccess: () => {
      toast.success('Response sent successfully')
      setShowResponseDialog(false)
      setSelectedFeedback(null)
      setResponseText('')
      void queryClient.invalidateQueries({ queryKey: ['admin-feedback'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-feedback-stats'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send response')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFeedback) return
      return await deleteFeedback({ data: { id: selectedFeedback.$id } })
    },
    onSuccess: () => {
      toast.success('Feedback deleted')
      setShowDeleteDialog(false)
      setSelectedFeedback(null)
      void queryClient.invalidateQueries({ queryKey: ['admin-feedback'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-feedback-stats'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete feedback')
    },
  })

  const openResponseDialog = (item: Feedback) => {
    setSelectedFeedback(item)
    setResponseText(item.adminResponse || '')
    setResponseStatus(
      (item.status as 'pending' | 'reviewed' | 'resolved') || 'reviewed',
    )
    setShowResponseDialog(true)
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Resolved
          </span>
        )
      case 'reviewed':
        return (
          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 flex items-center gap-1">
            <Eye className="w-3 h-3" />
            Reviewed
          </span>
        )
      default:
        return (
          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        )
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <AdminLayout userProfile={userProfile}>
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
            Feedback Center
          </h1>
          <p className="text-stone-400">
            Review and respond to user feedback on questions.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-5 rounded-2xl bg-stone-900 border border-stone-800"
          >
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
              <MessageSquareText className="w-6 h-6 text-violet-400" />
            </div>
            <p className="text-sm text-stone-400 mb-1">Total Feedback</p>
            <p
              className="text-3xl font-semibold text-white"
              style={{ fontFamily: '"Instrument Sans", sans-serif' }}
            >
              {stats.total}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="p-5 rounded-2xl bg-stone-900 border border-stone-800"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <p className="text-sm text-stone-400 mb-1">Pending</p>
            <p
              className="text-3xl font-semibold text-white"
              style={{ fontFamily: '"Instrument Sans", sans-serif' }}
            >
              {stats.pending}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="p-5 rounded-2xl bg-stone-900 border border-stone-800"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
              <Eye className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-sm text-stone-400 mb-1">Reviewed</p>
            <p
              className="text-3xl font-semibold text-white"
              style={{ fontFamily: '"Instrument Sans", sans-serif' }}
            >
              {stats.reviewed}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="p-5 rounded-2xl bg-stone-900 border border-stone-800"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-sm text-stone-400 mb-1">Resolved</p>
            <p
              className="text-3xl font-semibold text-white"
              style={{ fontFamily: '"Instrument Sans", sans-serif' }}
            >
              {stats.resolved}
            </p>
          </motion.div>
        </div>

        {/* Feedback List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden"
        >
          <div className="p-6 border-b border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2
              className="text-lg font-semibold text-white"
              style={{ fontFamily: '"Instrument Sans", sans-serif' }}
            >
              User Feedback ({filteredFeedback.length})
            </h2>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="border-stone-700 text-stone-300 hover:bg-stone-800"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {filterStatus === 'all'
                    ? 'All Status'
                    : filterStatus.charAt(0).toUpperCase() +
                      filterStatus.slice(1)}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-stone-800 border-stone-700">
                <DropdownMenuItem
                  onClick={() => setFilterStatus('all')}
                  className="text-stone-300 focus:bg-stone-700 focus:text-white"
                >
                  All Status
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilterStatus('pending')}
                  className="text-stone-300 focus:bg-stone-700 focus:text-white"
                >
                  Pending
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilterStatus('reviewed')}
                  className="text-stone-300 focus:bg-stone-700 focus:text-white"
                >
                  Reviewed
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilterStatus('resolved')}
                  className="text-stone-300 focus:bg-stone-700 focus:text-white"
                >
                  Resolved
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {filteredFeedback.length > 0 ? (
            <div className="divide-y divide-stone-800">
              {filteredFeedback.map((item: Feedback) => (
                <div
                  key={item.$id}
                  className="p-6 hover:bg-stone-800/30 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        {getStatusBadge(item.status)}
                        <span className="text-xs text-stone-500">
                          {formatDate(item.$createdAt)}
                        </span>
                      </div>

                      {/* User & Question Info */}
                      <div className="flex flex-wrap items-center gap-4 mb-3 text-sm">
                        <span className="flex items-center gap-1.5 text-stone-400">
                          <User className="w-4 h-4" />
                          {item.userName || 'Unknown User'}
                        </span>
                        <span className="flex items-center gap-1.5 text-stone-400">
                          <FileQuestion className="w-4 h-4" />Q
                          {item.questionNumber || '?'} (Pool{' '}
                          {item.poolNumber || '?'})
                        </span>
                        {item.userEmail && (
                          <span className="text-stone-500 text-xs">
                            {item.userEmail}
                          </span>
                        )}
                      </div>

                      {/* Feedback Text */}
                      <div className="p-4 rounded-xl bg-stone-800/50 mb-3">
                        <p className="text-stone-300 whitespace-pre-wrap">
                          {item.feedbackText}
                        </p>
                      </div>

                      {/* Admin Response */}
                      {item.adminResponse && (
                        <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                          <p className="text-xs text-violet-400 mb-2 font-medium">
                            Admin Response:
                          </p>
                          <p className="text-stone-300 whitespace-pre-wrap">
                            {item.adminResponse}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 lg:flex-col">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openResponseDialog(item)}
                        className="text-stone-400 hover:text-white hover:bg-stone-800"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {item.adminResponse ? 'Edit Response' : 'Respond'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFeedback(item)
                          setShowDeleteDialog(true)
                        }}
                        className="text-stone-400 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <MessageSquareText className="w-12 h-12 text-stone-600 mx-auto mb-4" />
              <p className="text-stone-400 mb-2">No feedback found</p>
              <p className="text-sm text-stone-500">
                {filterStatus !== 'all'
                  ? 'Try changing the filter to see more feedback.'
                  : 'User feedback on questions will appear here.'}
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="bg-stone-900 border-stone-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Respond to Feedback</DialogTitle>
            <DialogDescription className="text-stone-400">
              Send a response to the user about their feedback on Q
              {selectedFeedback?.questionNumber || '?'}.
            </DialogDescription>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-4 py-4">
              {/* Original Feedback */}
              <div>
                <Label className="text-stone-400 text-xs">
                  Original Feedback
                </Label>
                <div className="mt-1.5 p-4 rounded-xl bg-stone-800/50 text-stone-300">
                  {selectedFeedback.feedbackText}
                </div>
              </div>

              {/* Response */}
              <div>
                <Label className="text-stone-300">Your Response</Label>
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Write your response to the user..."
                  className="mt-1.5 bg-stone-800 border-stone-700 text-white resize-none"
                  rows={4}
                />
              </div>

              {/* Status */}
              <div>
                <Label className="text-stone-300">Update Status</Label>
                <Select
                  value={responseStatus}
                  onValueChange={(value: 'pending' | 'reviewed' | 'resolved') =>
                    setResponseStatus(value)
                  }
                >
                  <SelectTrigger className="mt-1.5 bg-stone-800 border-stone-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-stone-800 border-stone-700">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResponseDialog(false)}
              className="border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => respondMutation.mutate()}
              disabled={respondMutation.isPending || !responseText.trim()}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600"
            >
              {respondMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-stone-900 border-stone-800 text-white">
          <DialogHeader>
            <DialogTitle>Delete Feedback</DialogTitle>
            <DialogDescription className="text-stone-400">
              Are you sure you want to delete this feedback? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <X className="w-4 h-4 mr-2" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
