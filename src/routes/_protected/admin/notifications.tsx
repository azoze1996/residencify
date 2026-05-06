import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import {
  Bell,
  Plus,
  Send,
  FileText,
  Trash2,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Mail,
  CreditCard,
  RefreshCw,
  Megaphone,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { getCurrentUserProfileFn } from '@/server/functions/users'
import {
  createPushNotificationFn,
  listPushNotificationsFn,
  deletePushNotificationFn,
  createNotificationTemplateFn,
  listNotificationTemplatesFn,
  deleteNotificationTemplateFn,
  getUsersForNotificationFn,
} from '@/server/functions/notifications'
import type {
  PushNotifications,
  NotificationTemplates,
} from '@/server/lib/appwrite.types'

export const Route = createFileRoute('/_protected/admin/notifications')({
  loader: async () => {
    const [profileResult, notificationsResult, templatesResult] =
      await Promise.all([
        getCurrentUserProfileFn(),
        listPushNotificationsFn().catch(() => ({ notifications: [] })),
        listNotificationTemplatesFn().catch(() => ({ templates: [] })),
      ])

    return {
      userProfile: profileResult.user,
      notifications: notificationsResult.notifications,
      templates: templatesResult.templates,
    }
  },
  component: AdminNotificationsPage,
})

function AdminNotificationsPage() {
  const {
    userProfile,
    notifications: initialNotifications,
    templates: initialTemplates,
  } = Route.useLoaderData()

  const [activeTab, setActiveTab] = useState('send')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedNotification, setSelectedNotification] =
    useState<PushNotifications | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [userSearchQuery, setUserSearchQuery] = useState('')

  // Form state for notification
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    targetType: 'all' as 'all' | 'category' | 'specific',
    targetCategory: '' as string,
    priority: 'normal' as 'low' | 'normal' | 'high',
    actionUrl: '',
  })

  // Form state for template
  const [templateForm, setTemplateForm] = useState({
    name: '',
    title: '',
    message: '',
    templateType: 'custom' as
      | 'payment_reminder'
      | 'subscription_expiry'
      | 'welcome'
      | 'update'
      | 'custom',
  })

  const listNotifications = useServerFn(listPushNotificationsFn)
  const createNotification = useServerFn(createPushNotificationFn)
  const deleteNotification = useServerFn(deletePushNotificationFn)
  const listTemplates = useServerFn(listNotificationTemplatesFn)
  const createTemplate = useServerFn(createNotificationTemplateFn)
  const deleteTemplate = useServerFn(deleteNotificationTemplateFn)
  const getUsersForNotification = useServerFn(getUsersForNotificationFn)

  const { data: notificationsData, refetch: refetchNotifications } = useQuery({
    queryKey: ['admin-push-notifications'],
    queryFn: () => listNotifications(),
    initialData: { notifications: initialNotifications },
  })

  const { data: templatesData, refetch: refetchTemplates } = useQuery({
    queryKey: ['admin-notification-templates'],
    queryFn: () => listTemplates(),
    initialData: { templates: initialTemplates },
  })

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: [
      'admin-users-for-notification',
      notificationForm.targetCategory,
      userSearchQuery,
    ],
    queryFn: () =>
      getUsersForNotification({
        data: {
          category: notificationForm.targetCategory || undefined,
          search: userSearchQuery || undefined,
        },
      }),
    enabled: notificationForm.targetType === 'specific',
  })

  const createNotificationMutation = useMutation({
    mutationFn: async () => {
      return await createNotification({
        data: {
          title: notificationForm.title,
          message: notificationForm.message,
          targetType: notificationForm.targetType,
          targetCategory:
            notificationForm.targetType === 'category'
              ? (notificationForm.targetCategory as
                  | 'medical_student'
                  | 'intern'
                  | 'trainee_resident'
                  | 'instructor')
              : null,
          targetUserIds:
            notificationForm.targetType === 'specific' ? selectedUsers : null,
          priority: notificationForm.priority,
          actionUrl: notificationForm.actionUrl || null,
        },
      })
    },
    onSuccess: (data) => {
      toast.success(
        `Notification sent to ${data.recipientCount} user(s) successfully!`,
      )
      setShowCreateDialog(false)
      resetNotificationForm()
      void refetchNotifications()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send notification')
    },
  })

  const createTemplateMutation = useMutation({
    mutationFn: async () => {
      return await createTemplate({
        data: {
          name: templateForm.name,
          title: templateForm.title,
          message: templateForm.message,
          templateType: templateForm.templateType,
        },
      })
    },
    onSuccess: () => {
      toast.success('Template created successfully!')
      setShowTemplateDialog(false)
      resetTemplateForm()
      void refetchTemplates()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create template')
    },
  })

  const deleteNotificationMutation = useMutation({
    mutationFn: async () => {
      if (!selectedNotification) return
      return await deleteNotification({
        data: { id: selectedNotification.$id },
      })
    },
    onSuccess: () => {
      toast.success('Notification deleted')
      setShowDeleteDialog(false)
      setSelectedNotification(null)
      void refetchNotifications()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete notification')
    },
  })

  const resetNotificationForm = () => {
    setNotificationForm({
      title: '',
      message: '',
      targetType: 'all',
      targetCategory: '',
      priority: 'normal',
      actionUrl: '',
    })
    setSelectedUsers([])
  }

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      title: '',
      message: '',
      templateType: 'custom',
    })
  }

  const applyTemplate = (template: NotificationTemplates) => {
    setNotificationForm((prev) => ({
      ...prev,
      title: template.title,
      message: template.message,
    }))
    toast.success(`Template "${template.name}" applied`)
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'medical_student':
        return 'Medical Students'
      case 'intern':
        return 'Interns'
      case 'trainee_resident':
        return 'Trainee Residents'
      case 'instructor':
        return 'Instructors'
      default:
        return category
    }
  }

  const getTemplateTypeIcon = (type: string) => {
    switch (type) {
      case 'payment_reminder':
        return <CreditCard className="w-4 h-4" />
      case 'subscription_expiry':
        return <AlertTriangle className="w-4 h-4" />
      case 'welcome':
        return <Mail className="w-4 h-4" />
      case 'update':
        return <RefreshCw className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
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
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1
              className="text-3xl font-semibold text-white mb-2"
              style={{ fontFamily: '"Instrument Sans", sans-serif' }}
            >
              Push Notifications
            </h1>
            <p className="text-stone-400">
              Send notifications to users and manage templates.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTemplateDialog(true)}
              className="gap-2 border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              <FileText className="w-4 h-4" />
              New Template
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
            >
              <Send className="w-4 h-4" />
              Send Notification
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 bg-stone-800 border border-stone-700">
            <TabsTrigger
              value="send"
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white"
            >
              <Megaphone className="w-4 h-4 mr-2" />
              Quick Send
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white"
            >
              <Clock className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* Quick Send Tab */}
          <TabsContent value="send">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-2 gap-6"
            >
              {/* Compose Form */}
              <div className="rounded-2xl bg-stone-900 border border-stone-800 p-6">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <Send className="w-5 h-5 text-violet-400" />
                  Compose Notification
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label className="text-stone-300">Title</Label>
                    <Input
                      value={notificationForm.title}
                      onChange={(e) =>
                        setNotificationForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Notification title..."
                      className="mt-1.5 bg-stone-800 border-stone-700 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-stone-300">Message</Label>
                    <Textarea
                      value={notificationForm.message}
                      onChange={(e) =>
                        setNotificationForm((prev) => ({
                          ...prev,
                          message: e.target.value,
                        }))
                      }
                      placeholder="Write your message..."
                      rows={4}
                      className="mt-1.5 bg-stone-800 border-stone-700 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-stone-300">Target</Label>
                      <Select
                        value={notificationForm.targetType}
                        onValueChange={(v) =>
                          setNotificationForm((prev) => ({
                            ...prev,
                            targetType: v as 'all' | 'category' | 'specific',
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1.5 bg-stone-800 border-stone-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-stone-800 border-stone-700">
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="category">By Category</SelectItem>
                          <SelectItem value="specific">
                            Specific Users
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-stone-300">Priority</Label>
                      <Select
                        value={notificationForm.priority}
                        onValueChange={(v) =>
                          setNotificationForm((prev) => ({
                            ...prev,
                            priority: v as 'low' | 'normal' | 'high',
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1.5 bg-stone-800 border-stone-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-stone-800 border-stone-700">
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {notificationForm.targetType === 'category' && (
                    <div>
                      <Label className="text-stone-300">Category</Label>
                      <Select
                        value={notificationForm.targetCategory}
                        onValueChange={(v) =>
                          setNotificationForm((prev) => ({
                            ...prev,
                            targetCategory: v,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1.5 bg-stone-800 border-stone-700 text-white">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-stone-800 border-stone-700">
                          <SelectItem value="medical_student">
                            Medical Students
                          </SelectItem>
                          <SelectItem value="intern">Interns</SelectItem>
                          <SelectItem value="trainee_resident">
                            Trainee Residents
                          </SelectItem>
                          <SelectItem value="instructor">
                            Instructors
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {notificationForm.targetType === 'specific' && (
                    <div>
                      <Label className="text-stone-300">
                        Select Users ({selectedUsers.length} selected)
                      </Label>
                      <div className="mt-1.5 space-y-2">
                        <Input
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          placeholder="Search users..."
                          className="bg-stone-800 border-stone-700 text-white"
                        />
                        <div className="max-h-40 overflow-y-auto rounded-lg bg-stone-800 border border-stone-700 p-2">
                          {isLoadingUsers ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
                            </div>
                          ) : usersData?.users.length === 0 ? (
                            <p className="text-sm text-stone-500 text-center py-4">
                              No users found
                            </p>
                          ) : (
                            usersData?.users.map((user) => (
                              <label
                                key={user.$id}
                                className="flex items-center gap-2 p-2 rounded hover:bg-stone-700 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedUsers.includes(user.$id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedUsers((prev) => [
                                        ...prev,
                                        user.$id,
                                      ])
                                    } else {
                                      setSelectedUsers((prev) =>
                                        prev.filter((id) => id !== user.$id),
                                      )
                                    }
                                  }}
                                  className="rounded border-stone-600"
                                />
                                <span className="text-sm text-white">
                                  {user.username}
                                </span>
                                <span className="text-xs text-stone-500">
                                  {user.email}
                                </span>
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => createNotificationMutation.mutate()}
                    disabled={
                      createNotificationMutation.isPending ||
                      !notificationForm.title ||
                      !notificationForm.message ||
                      (notificationForm.targetType === 'category' &&
                        !notificationForm.targetCategory) ||
                      (notificationForm.targetType === 'specific' &&
                        selectedUsers.length === 0)
                    }
                    className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600"
                  >
                    {createNotificationMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Notification
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Templates Quick Access */}
              <div className="rounded-2xl bg-stone-900 border border-stone-800 p-6">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  Quick Templates
                </h3>

                <div className="space-y-3">
                  {templatesData.templates.length === 0 ? (
                    <div className="text-center py-8 text-stone-500">
                      <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No templates yet</p>
                      <Button
                        variant="link"
                        onClick={() => setShowTemplateDialog(true)}
                        className="text-violet-400 mt-2"
                      >
                        Create your first template
                      </Button>
                    </div>
                  ) : (
                    templatesData.templates.map(
                      (template: NotificationTemplates) => (
                        <div
                          key={template.$id}
                          className="p-4 rounded-xl bg-stone-800 border border-stone-700 hover:border-violet-500/50 transition-colors cursor-pointer"
                          onClick={() => applyTemplate(template)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {getTemplateTypeIcon(template.templateType)}
                              <span className="text-sm font-medium text-white">
                                {template.name}
                              </span>
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded bg-stone-700 text-stone-400 capitalize">
                              {template.templateType.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-stone-400 mt-2 line-clamp-2">
                            {template.message}
                          </p>
                        </div>
                      ),
                    )
                  )}
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-800">
                      <th className="text-left p-4 text-sm font-medium text-stone-400">
                        Notification
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-stone-400">
                        Target
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-stone-400">
                        Recipients
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-stone-400">
                        Status
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-stone-400">
                        Sent
                      </th>
                      <th className="text-right p-4 text-sm font-medium text-stone-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {notificationsData.notifications.map(
                      (notification: PushNotifications) => (
                        <tr
                          key={notification.$id}
                          className="border-b border-stone-800/50 hover:bg-stone-800/30 transition-colors"
                        >
                          <td className="p-4">
                            <div>
                              <p className="text-sm font-medium text-white">
                                {notification.title}
                              </p>
                              <p className="text-xs text-stone-400 line-clamp-1">
                                {notification.message}
                              </p>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-stone-300 capitalize">
                              {notification.targetType === 'all'
                                ? 'All Users'
                                : notification.targetType === 'category'
                                  ? getCategoryLabel(
                                      notification.targetCategory || '',
                                    )
                                  : 'Specific Users'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-stone-300">
                              {notification.recipientCount}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`flex items-center gap-1.5 text-sm ${
                                notification.status === 'sent'
                                  ? 'text-emerald-400'
                                  : notification.status === 'scheduled'
                                    ? 'text-amber-400'
                                    : 'text-stone-400'
                              }`}
                            >
                              {notification.status === 'sent' ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <Clock className="w-4 h-4" />
                              )}
                              {notification.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-stone-300">
                              {notification.sentAt
                                ? formatDate(notification.sentAt)
                                : '—'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedNotification(notification)
                                  setShowDeleteDialog(true)
                                }}
                                className="text-stone-400 hover:text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              {notificationsData.notifications.length === 0 && (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-stone-600 mx-auto mb-3" />
                  <p className="text-stone-500">No notifications sent yet</p>
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {templatesData.templates.map(
                (template: NotificationTemplates) => (
                  <div
                    key={template.$id}
                    className="p-5 rounded-2xl bg-stone-900 border border-stone-800 hover:border-stone-700 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                          {getTemplateTypeIcon(template.templateType)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {template.name}
                          </p>
                          <p className="text-xs text-stone-500 capitalize">
                            {template.templateType.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          await deleteTemplate({ data: { id: template.$id } })
                          toast.success('Template deleted')
                          void refetchTemplates()
                        }}
                        className="text-stone-400 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-white font-medium">
                        {template.title}
                      </p>
                      <p className="text-xs text-stone-400 line-clamp-3">
                        {template.message}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        applyTemplate(template)
                        setActiveTab('send')
                      }}
                      className="w-full mt-4 border-stone-700 text-stone-300 hover:bg-stone-800"
                    >
                      Use Template
                    </Button>
                  </div>
                ),
              )}

              {/* Add Template Card */}
              <div
                onClick={() => setShowTemplateDialog(true)}
                className="p-5 rounded-2xl bg-stone-900/50 border border-dashed border-stone-700 hover:border-violet-500/50 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[200px]"
              >
                <Plus className="w-10 h-10 text-stone-600 mb-2" />
                <p className="text-sm text-stone-500">Create New Template</p>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Notification Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-stone-900 border-stone-800 text-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-violet-400" />
              Send Push Notification
            </DialogTitle>
            <DialogDescription className="text-stone-400">
              Send a notification to your users.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-stone-300">Title</Label>
              <Input
                value={notificationForm.title}
                onChange={(e) =>
                  setNotificationForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="Notification title..."
                className="mt-1.5 bg-stone-800 border-stone-700 text-white"
              />
            </div>

            <div>
              <Label className="text-stone-300">Message</Label>
              <Textarea
                value={notificationForm.message}
                onChange={(e) =>
                  setNotificationForm((prev) => ({
                    ...prev,
                    message: e.target.value,
                  }))
                }
                placeholder="Write your message..."
                rows={4}
                className="mt-1.5 bg-stone-800 border-stone-700 text-white"
              />
            </div>

            <div>
              <Label className="text-stone-300">Target Audience</Label>
              <Select
                value={notificationForm.targetType}
                onValueChange={(v) =>
                  setNotificationForm((prev) => ({
                    ...prev,
                    targetType: v as 'all' | 'category' | 'specific',
                  }))
                }
              >
                <SelectTrigger className="mt-1.5 bg-stone-800 border-stone-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-stone-800 border-stone-700">
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="category">By Category</SelectItem>
                  <SelectItem value="specific">Specific Users</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {notificationForm.targetType === 'category' && (
              <div>
                <Label className="text-stone-300">Category</Label>
                <Select
                  value={notificationForm.targetCategory}
                  onValueChange={(v) =>
                    setNotificationForm((prev) => ({
                      ...prev,
                      targetCategory: v,
                    }))
                  }
                >
                  <SelectTrigger className="mt-1.5 bg-stone-800 border-stone-700 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-stone-800 border-stone-700">
                    <SelectItem value="medical_student">
                      Medical Students
                    </SelectItem>
                    <SelectItem value="intern">Interns</SelectItem>
                    <SelectItem value="trainee_resident">
                      Trainee Residents
                    </SelectItem>
                    <SelectItem value="instructor">Instructors</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                resetNotificationForm()
              }}
              className="border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => createNotificationMutation.mutate()}
              disabled={
                createNotificationMutation.isPending ||
                !notificationForm.title ||
                !notificationForm.message
              }
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600"
            >
              {createNotificationMutation.isPending ? 'Sending...' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="bg-stone-900 border-stone-800 text-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              Create Notification Template
            </DialogTitle>
            <DialogDescription className="text-stone-400">
              Save a template for quick reuse.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-stone-300">Template Name</Label>
              <Input
                value={templateForm.name}
                onChange={(e) =>
                  setTemplateForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Payment Reminder"
                className="mt-1.5 bg-stone-800 border-stone-700 text-white"
              />
            </div>

            <div>
              <Label className="text-stone-300">Template Type</Label>
              <Select
                value={templateForm.templateType}
                onValueChange={(v) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    templateType: v as typeof templateForm.templateType,
                  }))
                }
              >
                <SelectTrigger className="mt-1.5 bg-stone-800 border-stone-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-stone-800 border-stone-700">
                  <SelectItem value="payment_reminder">
                    Payment Reminder
                  </SelectItem>
                  <SelectItem value="subscription_expiry">
                    Subscription Expiry
                  </SelectItem>
                  <SelectItem value="welcome">Welcome Message</SelectItem>
                  <SelectItem value="update">Update/Announcement</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-stone-300">Title</Label>
              <Input
                value={templateForm.title}
                onChange={(e) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="Notification title..."
                className="mt-1.5 bg-stone-800 border-stone-700 text-white"
              />
            </div>

            <div>
              <Label className="text-stone-300">Message</Label>
              <Textarea
                value={templateForm.message}
                onChange={(e) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    message: e.target.value,
                  }))
                }
                placeholder="Write your template message..."
                rows={4}
                className="mt-1.5 bg-stone-800 border-stone-700 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowTemplateDialog(false)
                resetTemplateForm()
              }}
              className="border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => createTemplateMutation.mutate()}
              disabled={
                createTemplateMutation.isPending ||
                !templateForm.name ||
                !templateForm.title ||
                !templateForm.message
              }
              className="bg-gradient-to-r from-amber-500 to-orange-600"
            >
              {createTemplateMutation.isPending
                ? 'Creating...'
                : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-stone-900 border-stone-800 text-white">
          <DialogHeader>
            <DialogTitle>Delete Notification</DialogTitle>
            <DialogDescription className="text-stone-400">
              Are you sure you want to delete this notification? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setSelectedNotification(null)
              }}
              className="border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteNotificationMutation.mutate()}
              disabled={deleteNotificationMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteNotificationMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
