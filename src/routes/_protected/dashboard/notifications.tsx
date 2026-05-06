import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import {
  Bell,
  Check,
  Info,
  MessageSquare,
  Megaphone,
  AlertCircle,
  ArrowLeft,
  MoreVertical,
  Trash2,
  Eye,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Loader } from '@/components/common/Loader'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { getCurrentUserProfileFn } from '@/server/functions/users'
import {
  getUserNotificationsFn,
  markNotificationReadFn,
} from '@/server/functions/notifications'
import type { Notifications } from '@/server/lib/appwrite.types'
import { useState } from 'react'

interface NotificationWithReadStatus extends Notifications {
  isRead: boolean
  userNotificationId: string
}

export const Route = createFileRoute('/_protected/dashboard/notifications')({
  loader: async () => {
    const [profileResult, notificationsResult] = await Promise.all([
      getCurrentUserProfileFn(),
      getUserNotificationsFn().catch(() => ({
        notifications: [],
        unreadCount: 0,
      })),
    ])

    return {
      userProfile: profileResult.user,
      notifications: notificationsResult.notifications,
      unreadCount: notificationsResult.unreadCount,
    }
  },
  component: NotificationsPage,
})

function NotificationsPage() {
  const navigate = useNavigate()
  const {
    userProfile,
    notifications: initialNotifications,
    unreadCount: initialUnreadCount,
  } = Route.useLoaderData()

  const getNotifications = useServerFn(getUserNotificationsFn)
  const markRead = useServerFn(markNotificationReadFn)

  // State for full notification view dialog
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationWithReadStatus | null>(null)
  const [showNotificationDialog, setShowNotificationDialog] = useState(false)

  const {
    data: notificationsData,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ['user-notifications'],
    queryFn: async () => {
      try {
        return await getNotifications()
      } catch (error) {
        console.error('Failed to load notifications:', error)
        return { notifications: [], unreadCount: 0 }
      }
    },
    initialData: {
      notifications: initialNotifications,
      unreadCount: initialUnreadCount,
    },
  })

  const markReadMutation = useMutation({
    mutationFn: async (userNotificationId: string) => {
      return await markRead({ data: { userNotificationId } })
    },
    onSuccess: () => {
      void refetch()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to mark notification as read')
    },
  })

  // Handle opening notification in full view
  const handleOpenNotification = (notification: NotificationWithReadStatus) => {
    setSelectedNotification(notification)
    setShowNotificationDialog(true)

    // Mark as read when opened
    if (!notification.isRead) {
      markReadMutation.mutate(notification.userNotificationId)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'support_response':
        return (
          <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
            <Check className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
        )
      case 'support_auto_reply':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        )
      case 'broadcast':
        return (
          <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
        )
      case 'feedback':
        return (
          <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
        )
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <Info className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
        )
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="max-w-3xl">
        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-4 mb-6"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: '/dashboard' })}
            className="h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </Button>
          <h1
            className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight uppercase"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            NOTIFICATIONS
          </h1>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader size="lg" />
          </div>
        ) : notificationsData.notifications.length > 0 ? (
          <div className="space-y-0 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            {notificationsData.notifications.map(
              (notification: NotificationWithReadStatus, index: number) => (
                <motion.div
                  key={notification.$id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`p-4 border-b border-slate-100 dark:border-slate-800 last:border-b-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                    !notification.isRead
                      ? 'bg-slate-50/50 dark:bg-slate-800/50'
                      : ''
                  }`}
                  onClick={() => handleOpenNotification(notification)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    {getNotificationIcon(notification.type)}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                          {notification.title}
                        </h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 w-8 -mt-1 -mr-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <MoreVertical className="w-4 h-4 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            {!notification.isRead && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markReadMutation.mutate(
                                    notification.userNotificationId,
                                  )
                                }}
                                disabled={markReadMutation.isPending}
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Mark as read
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenNotification(notification)
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View full
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-rose-600 dark:text-rose-400">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <span className="text-xs text-slate-400 dark:text-slate-500 mt-2 block">
                        {formatDate(notification.$createdAt)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ),
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <Bell className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No notifications
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              You're all caught up! We'll notify you when something important
              happens.
            </p>
          </motion.div>
        )}
      </div>

      {/* Full Notification View Dialog */}
      <Dialog
        open={showNotificationDialog}
        onOpenChange={setShowNotificationDialog}
      >
        <DialogContent className="max-w-[90vw] sm:max-w-2xl dark:bg-slate-900 dark:border-slate-700">
          <DialogHeader>
            <div className="flex items-start gap-3">
              {selectedNotification &&
                getNotificationIcon(selectedNotification.type)}
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                  {selectedNotification?.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {selectedNotification &&
                    formatDate(selectedNotification.$createdAt)}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="py-4">
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {selectedNotification?.message}
              </p>
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            {selectedNotification && !selectedNotification.isRead && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  markReadMutation.mutate(
                    selectedNotification.userNotificationId,
                  )
                  setShowNotificationDialog(false)
                }}
                disabled={markReadMutation.isPending}
                className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Check className="w-4 h-4 mr-2" />
                Mark as Read
              </Button>
            )}
            <Button
              onClick={() => setShowNotificationDialog(false)}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
