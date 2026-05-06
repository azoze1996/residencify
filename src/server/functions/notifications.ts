import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../lib/db'
import { authMiddleware } from './auth'
import { Query } from 'node-appwrite'

// Schema for creating a notification (admin broadcast)
const createNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  targetType: z.enum(['all', 'category', 'user']),
  targetCategory: z
    .enum(['medical_student', 'intern', 'trainee_resident'])
    .nullable()
    .optional(),
  targetUserId: z.string().nullable().optional(),
})

// Create notification (admin only - for broadcasts)
export const createNotificationFn = createServerFn({ method: 'POST' })
  .inputValidator(createNotificationSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Check if user is admin
    const adminUser = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('isAdmin', [true]),
    ])

    if (adminUser.total === 0) {
      throw new Error('Access denied: Admin only')
    }

    const notification = await db.notifications.create({
      createdBy: currentUser.$id,
      title: data.title.trim(),
      message: data.message.trim(),
      type: 'broadcast',
      targetType: data.targetType,
      targetCategory: data.targetCategory ?? null,
      targetUserId: data.targetUserId ?? null,
      relatedId: null,
      isRead: false,
    })

    // If targeting all users or a category, create user notifications
    if (data.targetType === 'all') {
      const users = await db.users.list([Query.equal('isActive', [true])])
      for (const user of users.rows) {
        await db.userNotifications.create({
          createdBy: currentUser.$id,
          userId: user.$id,
          notificationId: notification.$id,
          isRead: false,
          readAt: null,
        })
      }
    } else if (data.targetType === 'category' && data.targetCategory) {
      const users = await db.users.list([
        Query.equal('accessCategory', [data.targetCategory]),
        Query.equal('isActive', [true]),
      ])
      for (const user of users.rows) {
        await db.userNotifications.create({
          createdBy: currentUser.$id,
          userId: user.$id,
          notificationId: notification.$id,
          isRead: false,
          readAt: null,
        })
      }
    } else if (data.targetType === 'user' && data.targetUserId) {
      await db.userNotifications.create({
        createdBy: currentUser.$id,
        userId: data.targetUserId,
        notificationId: notification.$id,
        isRead: false,
        readAt: null,
      })
    }

    return { notification }
  })

// Get user notifications
export const getUserNotificationsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Get user profile
    const userProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (userProfile.total === 0) {
      return { notifications: [], unreadCount: 0 }
    }

    const userId = userProfile.rows[0].$id

    // Get user notifications
    const userNotifications = await db.userNotifications.list([
      Query.equal('userId', [userId]),
      Query.orderDesc('$createdAt'),
      Query.limit(50),
    ])

    // Get the actual notification content
    const notifications = []
    let unreadCount = 0

    for (const un of userNotifications.rows) {
      try {
        const notification = await db.notifications.get(un.notificationId)
        notifications.push({
          ...notification,
          userNotificationId: un.$id,
          isRead: un.isRead,
          readAt: un.readAt,
        })
        if (!un.isRead) unreadCount++
      } catch {
        // Notification might have been deleted
      }
    }

    return { notifications, unreadCount }
  },
)

// Get admin notifications (feedback, support tickets)
export const getAdminNotificationsFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { currentUser } = await authMiddleware()
  if (!currentUser) throw new Error('Unauthorized')

  // Check if user is admin
  const adminUser = await db.users.list([
    Query.equal('authUserId', [currentUser.$id]),
    Query.equal('isAdmin', [true]),
  ])

  if (adminUser.total === 0) {
    throw new Error('Access denied: Admin only')
  }

  const notifications = await db.notifications.list([
    Query.equal('targetType', ['admin']),
    Query.orderDesc('$createdAt'),
    Query.limit(50),
  ])

  const unreadCount = notifications.rows.filter((n) => !n.isRead).length

  return { notifications: notifications.rows, unreadCount }
})

// Mark notification as read
export const markNotificationReadFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ userNotificationId: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    await db.userNotifications.update(data.userNotificationId, {
      isRead: true,
      readAt: new Date().toISOString(),
    })

    return { success: true }
  })

// Mark admin notification as read
export const markAdminNotificationReadFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ notificationId: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Check if user is admin
    const adminUser = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('isAdmin', [true]),
    ])

    if (adminUser.total === 0) {
      throw new Error('Access denied: Admin only')
    }

    await db.notifications.update(data.notificationId, {
      isRead: true,
    })

    return { success: true }
  })

// Mark all user notifications as read
export const markAllNotificationsReadFn = createServerFn({
  method: 'POST',
}).handler(async () => {
  const { currentUser } = await authMiddleware()
  if (!currentUser) throw new Error('Unauthorized')

  // Get user profile
  const userProfile = await db.users.list([
    Query.equal('authUserId', [currentUser.$id]),
  ])

  if (userProfile.total === 0) {
    throw new Error('User profile not found')
  }

  const userId = userProfile.rows[0].$id

  // Get all unread notifications
  const unreadNotifications = await db.userNotifications.list([
    Query.equal('userId', [userId]),
    Query.equal('isRead', [false]),
  ])

  // Mark all as read
  for (const un of unreadNotifications.rows) {
    await db.userNotifications.update(un.$id, {
      isRead: true,
      readAt: new Date().toISOString(),
    })
  }

  return { success: true }
})

// List all broadcast notifications (admin only)
export const listBroadcastNotificationsFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { currentUser } = await authMiddleware()
  if (!currentUser) throw new Error('Unauthorized')

  // Check if user is admin
  const adminUser = await db.users.list([
    Query.equal('authUserId', [currentUser.$id]),
    Query.equal('isAdmin', [true]),
  ])

  if (adminUser.total === 0) {
    throw new Error('Access denied: Admin only')
  }

  const notifications = await db.notifications.list([
    Query.equal('type', ['broadcast']),
    Query.orderDesc('$createdAt'),
    Query.limit(100),
  ])

  return { notifications: notifications.rows }
})

// ============================================
// PUSH NOTIFICATION FUNCTIONS (Admin)
// ============================================

const createPushNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  templateType: z.string().nullable().optional(),
  targetType: z.enum(['all', 'category', 'specific']),
  targetCategory: z
    .enum(['medical_student', 'intern', 'trainee_resident', 'instructor'])
    .nullable()
    .optional(),
  targetUserIds: z.array(z.string()).nullable().optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  actionUrl: z.string().max(500).nullable().optional(),
  scheduledAt: z.string().nullable().optional(),
})

export const createPushNotificationFn = createServerFn({ method: 'POST' })
  .inputValidator(createPushNotificationSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Check if user is admin
    const adminUser = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('isAdmin', [true]),
    ])

    if (adminUser.total === 0) {
      throw new Error('Access denied: Admin only')
    }

    // Calculate recipient count
    let recipientCount = 0
    let targetUserIds: string[] = []

    if (data.targetType === 'all') {
      const users = await db.users.list([Query.equal('isActive', [true])])
      recipientCount = users.total
      targetUserIds = users.rows.map((u) => u.$id)
    } else if (data.targetType === 'category' && data.targetCategory) {
      if (data.targetCategory === 'instructor') {
        const users = await db.users.list([
          Query.equal('isInstructor', [true]),
          Query.equal('isActive', [true]),
        ])
        recipientCount = users.total
        targetUserIds = users.rows.map((u) => u.$id)
      } else {
        const users = await db.users.list([
          Query.equal('accessCategory', [data.targetCategory]),
          Query.equal('isActive', [true]),
        ])
        recipientCount = users.total
        targetUserIds = users.rows.map((u) => u.$id)
      }
    } else if (data.targetType === 'specific' && data.targetUserIds) {
      recipientCount = data.targetUserIds.length
      targetUserIds = data.targetUserIds
    }

    const isScheduled =
      data.scheduledAt && new Date(data.scheduledAt) > new Date()

    const pushNotification = await db.pushNotifications.create({
      createdBy: currentUser.$id,
      title: data.title.trim(),
      message: data.message.trim(),
      templateType: data.templateType ?? null,
      targetType: data.targetType,
      targetCategory: data.targetCategory ?? null,
      targetUserIds: targetUserIds,
      scheduledAt: data.scheduledAt ?? null,
      sentAt: isScheduled ? null : new Date().toISOString(),
      status: isScheduled ? 'scheduled' : 'sent',
      priority: data.priority,
      actionUrl: data.actionUrl ?? null,
      recipientCount,
      readCount: 0,
    })

    // If not scheduled, create user notifications immediately
    if (!isScheduled) {
      for (const userId of targetUserIds) {
        // Create a notification record
        const notification = await db.notifications.create({
          createdBy: currentUser.$id,
          title: data.title.trim(),
          message: data.message.trim(),
          type: 'push',
          targetType: data.targetType,
          targetCategory: data.targetCategory ?? null,
          targetUserId: userId,
          relatedId: pushNotification.$id,
          isRead: false,
        })

        // Create user notification
        await db.userNotifications.create({
          createdBy: currentUser.$id,
          userId,
          notificationId: notification.$id,
          isRead: false,
          readAt: null,
        })
      }
    }

    return { pushNotification, recipientCount }
  })

export const listPushNotificationsFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { currentUser } = await authMiddleware()
  if (!currentUser) throw new Error('Unauthorized')

  // Check if user is admin
  const adminUser = await db.users.list([
    Query.equal('authUserId', [currentUser.$id]),
    Query.equal('isAdmin', [true]),
  ])

  if (adminUser.total === 0) {
    throw new Error('Access denied: Admin only')
  }

  const notifications = await db.pushNotifications.list([
    Query.orderDesc('$createdAt'),
    Query.limit(100),
  ])

  return { notifications: notifications.rows }
})

export const deletePushNotificationFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Check if user is admin
    const adminUser = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('isAdmin', [true]),
    ])

    if (adminUser.total === 0) {
      throw new Error('Access denied: Admin only')
    }

    await db.pushNotifications.delete(data.id)
    return { success: true }
  })

// ============================================
// NOTIFICATION TEMPLATE FUNCTIONS
// ============================================

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  templateType: z.enum([
    'payment_reminder',
    'subscription_expiry',
    'welcome',
    'update',
    'custom',
  ]),
  variables: z.array(z.string()).nullable().optional(),
})

export const createNotificationTemplateFn = createServerFn({ method: 'POST' })
  .inputValidator(createTemplateSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Check if user is admin
    const adminUser = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('isAdmin', [true]),
    ])

    if (adminUser.total === 0) {
      throw new Error('Access denied: Admin only')
    }

    const template = await db.notificationTemplates.create({
      createdBy: currentUser.$id,
      name: data.name.trim(),
      title: data.title.trim(),
      message: data.message.trim(),
      templateType: data.templateType,
      isDefault: false,
      isActive: true,
      variables: data.variables ?? null,
    })

    return { template }
  })

export const listNotificationTemplatesFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { currentUser } = await authMiddleware()
  if (!currentUser) throw new Error('Unauthorized')

  // Check if user is admin
  const adminUser = await db.users.list([
    Query.equal('authUserId', [currentUser.$id]),
    Query.equal('isAdmin', [true]),
  ])

  if (adminUser.total === 0) {
    throw new Error('Access denied: Admin only')
  }

  const templates = await db.notificationTemplates.list([
    Query.equal('isActive', [true]),
    Query.orderAsc('templateType'),
  ])

  return { templates: templates.rows }
})

export const updateNotificationTemplateFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string(),
      name: z.string().min(1).max(100).optional(),
      title: z.string().min(1).max(200).optional(),
      message: z.string().min(1).max(2000).optional(),
      isActive: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Check if user is admin
    const adminUser = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('isAdmin', [true]),
    ])

    if (adminUser.total === 0) {
      throw new Error('Access denied: Admin only')
    }

    const updated = await db.notificationTemplates.update(data.id, {
      ...(data.name && { name: data.name.trim() }),
      ...(data.title && { title: data.title.trim() }),
      ...(data.message && { message: data.message.trim() }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    })

    return { template: updated }
  })

export const deleteNotificationTemplateFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Check if user is admin
    const adminUser = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('isAdmin', [true]),
    ])

    if (adminUser.total === 0) {
      throw new Error('Access denied: Admin only')
    }

    await db.notificationTemplates.delete(data.id)
    return { success: true }
  })

// Get users for targeting (admin only)
export const getUsersForNotificationFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z
      .object({
        category: z.string().optional(),
        search: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Check if user is admin
    const adminUser = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('isAdmin', [true]),
    ])

    if (adminUser.total === 0) {
      throw new Error('Access denied: Admin only')
    }

    const queries = [Query.equal('isActive', [true]), Query.limit(100)]

    if (data?.category) {
      if (data.category === 'instructor') {
        queries.push(Query.equal('isInstructor', [true]))
      } else {
        queries.push(Query.equal('accessCategory', [data.category]))
      }
    }

    const users = await db.users.list(queries)

    // Filter by search if provided
    let filteredUsers = users.rows
    if (data?.search) {
      const searchLower = data.search.toLowerCase()
      filteredUsers = users.rows.filter(
        (u) =>
          u.username.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower),
      )
    }

    return {
      users: filteredUsers.map((u) => ({
        $id: u.$id,
        username: u.username,
        email: u.email,
        accessCategory: u.accessCategory,
        isInstructor: u.isInstructor,
      })),
    }
  })
