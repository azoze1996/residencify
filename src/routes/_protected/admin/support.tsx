import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import {
  HelpCircle,
  Search,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Trash2,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { getCurrentUserProfileFn } from '@/server/functions/users'
import {
  listAllTicketsFn,
  respondToTicketFn,
  deleteTicketFn,
} from '@/server/functions/support'
import type { SupportTickets } from '@/server/lib/appwrite.types'

export const Route = createFileRoute('/_protected/admin/support')({
  loader: async () => {
    const [profileResult, ticketsResult] = await Promise.all([
      getCurrentUserProfileFn(),
      listAllTicketsFn().catch(() => ({ tickets: [] })),
    ])

    return {
      userProfile: profileResult.user,
      tickets: ticketsResult.tickets,
    }
  },
  component: AdminSupportPage,
})

function AdminSupportPage() {
  const { userProfile, tickets: initialTickets } = Route.useLoaderData()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showRespondDialog, setShowRespondDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<SupportTickets | null>(
    null,
  )

  // Response form state
  const [responseData, setResponseData] = useState({
    adminResponse: '',
    status: 'in_progress' as 'open' | 'in_progress' | 'resolved' | 'closed',
  })

  const listTickets = useServerFn(listAllTicketsFn)
  const respondToTicket = useServerFn(respondToTicketFn)
  const deleteTicket = useServerFn(deleteTicketFn)

  const { data: ticketsData, refetch } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: () => listTickets(),
    initialData: { tickets: initialTickets },
  })

  const respondMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTicket) return
      return await respondToTicket({
        data: {
          id: selectedTicket.$id,
          adminResponse: responseData.adminResponse,
          status: responseData.status,
        },
      })
    },
    onSuccess: () => {
      toast.success('Response sent successfully')
      setShowRespondDialog(false)
      setSelectedTicket(null)
      setResponseData({ adminResponse: '', status: 'in_progress' })
      void refetch()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send response')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTicket) return
      return await deleteTicket({ data: { id: selectedTicket.$id } })
    },
    onSuccess: () => {
      toast.success('Ticket deleted successfully')
      setShowDeleteDialog(false)
      setSelectedTicket(null)
      void refetch()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete ticket')
    },
  })

  const openRespondDialog = (ticket: SupportTickets) => {
    setSelectedTicket(ticket)
    setResponseData({
      adminResponse: ticket.adminResponse || '',
      status:
        (ticket.status as 'open' | 'in_progress' | 'resolved' | 'closed') ||
        'in_progress',
    })
    setShowRespondDialog(true)
  }

  const filteredTickets = ticketsData.tickets.filter(
    (ticket: SupportTickets) => {
      const matchesSearch =
        ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.message.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'open' &&
          (!ticket.status || ticket.status === 'open')) ||
        ticket.status === filterStatus

      return matchesSearch && matchesStatus
    },
  )

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />
      case 'in_progress':
        return <Clock className="w-4 h-4 text-amber-400" />
      default:
        return <AlertCircle className="w-4 h-4 text-blue-400" />
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

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return 'bg-emerald-500/10 text-emerald-400'
      case 'in_progress':
        return 'bg-amber-500/10 text-amber-400'
      default:
        return 'bg-blue-500/10 text-blue-400'
    }
  }

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-400'
      case 'medium':
        return 'bg-amber-500/10 text-amber-400'
      default:
        return 'bg-stone-700 text-stone-400'
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

  // Stats
  const openCount = ticketsData.tickets.filter(
    (t: SupportTickets) => !t.status || t.status === 'open',
  ).length
  const inProgressCount = ticketsData.tickets.filter(
    (t: SupportTickets) => t.status === 'in_progress',
  ).length
  const resolvedCount = ticketsData.tickets.filter(
    (t: SupportTickets) => t.status === 'resolved' || t.status === 'closed',
  ).length

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
            Support Tickets
          </h1>
          <p className="text-stone-400">
            Manage and respond to user support requests.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-6"
        >
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-2xl font-semibold text-white">{openCount}</p>
                <p className="text-sm text-blue-400">Open</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-2xl font-semibold text-white">
                  {inProgressCount}
                </p>
                <p className="text-sm text-amber-400">In Progress</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-2xl font-semibold text-white">
                  {resolvedCount}
                </p>
                <p className="text-sm text-emerald-400">Resolved</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex gap-4 mb-6"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tickets..."
              className="pl-10 bg-stone-900 border-stone-800 text-white placeholder:text-stone-500"
            />
          </div>
          <div className="w-48">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-stone-900 border-stone-800 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-stone-800 border-stone-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Tickets List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-4"
        >
          {filteredTickets.map((ticket: SupportTickets) => (
            <div
              key={ticket.$id}
              className="p-5 rounded-2xl bg-stone-900 border border-stone-800"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(ticket.status)}`}
                    >
                      {getStatusIcon(ticket.status)}
                      {getStatusLabel(ticket.status)}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-medium ${getPriorityColor(ticket.priority)}`}
                    >
                      {ticket.priority || 'low'} priority
                    </span>
                    <span className="text-xs text-stone-500">
                      {formatDate(ticket.$createdAt)}
                    </span>
                  </div>

                  <h3 className="text-lg font-medium text-white mb-2">
                    {ticket.subject}
                  </h3>
                  <p className="text-stone-400 mb-4">{ticket.message}</p>

                  {ticket.adminResponse && (
                    <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                      <p className="text-xs font-medium text-violet-400 mb-2">
                        Admin Response
                      </p>
                      <p className="text-sm text-violet-200">
                        {ticket.adminResponse}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => openRespondDialog(ticket)}
                    className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {ticket.adminResponse ? 'Update' : 'Respond'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTicket(ticket)
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

          {filteredTickets.length === 0 && (
            <div className="text-center py-16 rounded-2xl bg-stone-900 border border-stone-800">
              <HelpCircle className="w-12 h-12 text-stone-600 mx-auto mb-3" />
              <p className="text-stone-500">No tickets found</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Respond Dialog */}
      <Dialog open={showRespondDialog} onOpenChange={setShowRespondDialog}>
        <DialogContent className="bg-stone-900 border-stone-800 text-white max-w-xl">
          <DialogHeader>
            <DialogTitle>Respond to Ticket</DialogTitle>
            <DialogDescription className="text-stone-400">
              {selectedTicket?.subject}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Original Message */}
            <div className="p-4 rounded-xl bg-stone-800/50">
              <p className="text-xs font-medium text-stone-400 mb-2">
                User Message
              </p>
              <p className="text-sm text-stone-300">
                {selectedTicket?.message}
              </p>
            </div>

            <div>
              <Label className="text-stone-300">Your Response</Label>
              <Textarea
                value={responseData.adminResponse}
                onChange={(e) =>
                  setResponseData({
                    ...responseData,
                    adminResponse: e.target.value,
                  })
                }
                placeholder="Type your response..."
                rows={5}
                className="mt-1.5 bg-stone-800 border-stone-700 text-white resize-none"
              />
            </div>

            <div>
              <Label className="text-stone-300">Update Status</Label>
              <Select
                value={responseData.status}
                onValueChange={(v) =>
                  setResponseData({
                    ...responseData,
                    status: v as 'open' | 'in_progress' | 'resolved' | 'closed',
                  })
                }
              >
                <SelectTrigger className="mt-1.5 bg-stone-800 border-stone-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-stone-800 border-stone-700">
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRespondDialog(false)
                setSelectedTicket(null)
                setResponseData({ adminResponse: '', status: 'in_progress' })
              }}
              className="border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => respondMutation.mutate()}
              disabled={
                respondMutation.isPending || !responseData.adminResponse
              }
              className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600"
            >
              <Send className="w-4 h-4" />
              {respondMutation.isPending ? 'Sending...' : 'Send Response'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-stone-900 border-stone-800 text-white">
          <DialogHeader>
            <DialogTitle>Delete Ticket</DialogTitle>
            <DialogDescription className="text-stone-400">
              Are you sure you want to delete this ticket? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setSelectedTicket(null)
              }}
              className="border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
