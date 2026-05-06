import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import {
  Send,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Loader } from '@/components/common/Loader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { getCurrentUserProfileFn } from '@/server/functions/users'
import {
  createSupportTicketFn,
  listUserTicketsFn,
} from '@/server/functions/support'
import type { SupportTickets } from '@/server/lib/appwrite.types'

export const Route = createFileRoute('/_protected/dashboard/support')({
  loader: async () => {
    const [profileResult, ticketsResult] = await Promise.all([
      getCurrentUserProfileFn(),
      listUserTicketsFn().catch(() => ({ tickets: [] })),
    ])

    return {
      userProfile: profileResult.user,
      tickets: ticketsResult.tickets,
    }
  },
  component: SupportPage,
})

function SupportPage() {
  const { userProfile, tickets: initialTickets } = Route.useLoaderData()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')

  const createTicket = useServerFn(createSupportTicketFn)
  const listTickets = useServerFn(listUserTicketsFn)

  const {
    data: ticketsData,
    refetch,
    isLoading: isLoadingTickets,
  } = useQuery({
    queryKey: ['user-tickets'],
    queryFn: async () => {
      try {
        return await listTickets()
      } catch (error) {
        console.error('Failed to load tickets:', error)
        return { tickets: [] }
      }
    },
    initialData: { tickets: initialTickets },
  })

  const createTicketMutation = useMutation({
    mutationFn: async () => {
      if (!subject.trim() || !message.trim()) {
        throw new Error('Please fill in all required fields')
      }
      return await createTicket({
        data: {
          subject: subject.trim(),
          message: message.trim(),
          priority,
        },
      })
    },
    onSuccess: () => {
      toast.success(
        'Support ticket submitted successfully! We will respond within 24 hours.',
      )
      setSubject('')
      setMessage('')
      setPriority('medium')
      void refetch()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit ticket. Please try again.')
    },
  })

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case 'in_progress':
        return <Clock className="w-4 h-4 text-amber-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-blue-500" />
    }
  }

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'resolved':
        return 'Resolved'
      case 'closed':
        return 'Closed'
      case 'in_progress':
        return 'In Progress'
      default:
        return 'Open'
    }
  }

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case 'high':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
            High
          </span>
        )
      case 'medium':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
            Medium
          </span>
        )
      case 'low':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
            Low
          </span>
        )
      default:
        return null
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
    <DashboardLayout userProfile={userProfile}>
      <div className="max-w-4xl">
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
            Support Center
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Send your problem and we will respond to you within 24 hours.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* New Ticket Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-6 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 shadow-lg dark:shadow-slate-900/30 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <Send className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h2
                className="text-xl font-semibold text-slate-900 dark:text-white"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                New Ticket
              </h2>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                createTicketMutation.mutate()
              }}
              className="space-y-4"
            >
              <div>
                <Label
                  htmlFor="subject"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Subject *
                </Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  required
                  maxLength={200}
                  className="mt-1.5 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <Label
                  htmlFor="priority"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Priority
                </Label>
                <Select
                  value={priority}
                  onValueChange={(v) =>
                    setPriority(v as 'low' | 'medium' | 'high')
                  }
                >
                  <SelectTrigger className="mt-1.5 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - General inquiry</SelectItem>
                    <SelectItem value="medium">
                      Medium - Need help soon
                    </SelectItem>
                    <SelectItem value="high">High - Urgent issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  htmlFor="message"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Message *
                </Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  required
                  rows={5}
                  maxLength={5000}
                  className="mt-1.5 resize-none bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {message.length}/5000 characters
                </p>
              </div>

              <Button
                type="submit"
                disabled={
                  createTicketMutation.isPending ||
                  !subject.trim() ||
                  !message.trim()
                }
                className="w-full"
              >
                {createTicketMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Ticket
                  </>
                )}
              </Button>
            </form>
          </motion.div>

          {/* Tickets List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2
                className="text-xl font-semibold text-slate-900 dark:text-white"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                Your Tickets
              </h2>
            </div>

            {isLoadingTickets ? (
              <div className="flex items-center justify-center py-12">
                <Loader size="lg" />
              </div>
            ) : ticketsData.tickets.length > 0 ? (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {ticketsData.tickets.map((ticket: SupportTickets) => (
                  <div
                    key={ticket.$id}
                    className="p-5 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-slate-900 dark:text-white flex-1 pr-4">
                        {ticket.subject}
                      </h3>
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(ticket.priority)}
                        <div className="flex items-center gap-1.5 text-xs">
                          {getStatusIcon(ticket.status)}
                          <span className="text-slate-600 dark:text-slate-400">
                            {getStatusLabel(ticket.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 line-clamp-2">
                      {ticket.message}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {formatDate(ticket.$createdAt)}
                    </p>

                    {ticket.adminResponse && (
                      <div className="mt-4 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50">
                        <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 mb-1">
                          Admin Response
                        </p>
                        <p className="text-sm text-emerald-700 dark:text-emerald-200">
                          {ticket.adminResponse}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 shadow-sm">
                <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 mb-1">
                  No tickets yet
                </p>
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  Submit a ticket if you need help
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  )
}
