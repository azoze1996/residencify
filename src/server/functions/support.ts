import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../lib/db'
import { authMiddleware } from './auth'
import { Query } from 'node-appwrite'

// Schema for creating a support ticket
const createTicketSchema = z.object({
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
})

// Schema for admin response
const respondToTicketSchema = z.object({
  id: z.string(),
  adminResponse: z.string().min(1).max(5000),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
})

// Auto-reply messages based on priority
const getAutoReplyMessage = (priority: string, subject: string): string => {
  const baseMessage = `Thank you for contacting Boost Support regarding "${subject}".`

  switch (priority) {
    case 'high':
      return `${baseMessage} We understand this is urgent and our team will prioritize your request. You can expect a response within 4-6 hours during business hours.`
    case 'medium':
      return `${baseMessage} Our support team has received your request and will respond within 24 hours.`
    default:
      return `${baseMessage} We have received your inquiry and will get back to you within 48 hours.`
  }
}

// Create support ticket (user)
export const createSupportTicketFn = createServerFn({ method: 'POST' })
  .inputValidator(createTicketSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Get user profile
    const userProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (userProfile.total === 0) {
      throw new Error('User profile not found')
    }

    const user = userProfile.rows[0]
    const userId = user.$id
    const autoReply = getAutoReplyMessage(data.priority, data.subject)

    const ticket = await db.supportTickets.create({
      createdBy: currentUser.$id,
      userId,
      subject: data.subject.trim(),
      message: data.message.trim(),
      status: 'open',
      adminResponse: null,
      priority: data.priority,
      userEmail: user.email,
      userName: user.username,
      autoReply,
    })

    // Create notification for admin
    await db.notifications.create({
      createdBy: currentUser.$id,
      title: 'New Support Ticket',
      message: `${user.username} submitted: ${data.subject}`,
      type: 'support',
      targetType: 'admin',
      targetCategory: null,
      targetUserId: null,
      relatedId: ticket.$id,
      isRead: false,
    })

    // Create auto-reply notification for user
    const autoReplyNotification = await db.notifications.create({
      createdBy: currentUser.$id,
      title: 'Support Ticket Received',
      message: autoReply,
      type: 'support_auto_reply',
      targetType: 'user',
      targetCategory: null,
      targetUserId: userId,
      relatedId: ticket.$id,
      isRead: false,
    })

    // Create user_notification record so user can see it in their notifications
    await db.userNotifications.create({
      createdBy: currentUser.$id,
      userId: userId,
      notificationId: autoReplyNotification.$id,
      isRead: false,
      readAt: null,
    })

    return { ticket, autoReply }
  })

// List user's support tickets
export const listUserTicketsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
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

    const tickets = await db.supportTickets.list([
      Query.equal('userId', [userId]),
      Query.orderDesc('$createdAt'),
    ])

    return { tickets: tickets.rows }
  },
)

// List all support tickets (admin only)
export const listAllTicketsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
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

    const tickets = await db.supportTickets.list([
      Query.orderDesc('$createdAt'),
      Query.limit(500),
    ])

    return { tickets: tickets.rows }
  },
)

// Get tickets by status (admin only)
export const listTicketsByStatusFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ status: z.string() }))
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

    const tickets = await db.supportTickets.list([
      Query.equal('status', [data.status]),
      Query.orderDesc('$createdAt'),
    ])

    return { tickets: tickets.rows }
  })

// Respond to ticket (admin only)
export const respondToTicketFn = createServerFn({ method: 'POST' })
  .inputValidator(respondToTicketSchema)
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

    // Get the ticket to find the user
    const existingTicket = await db.supportTickets.get(data.id)

    const ticket = await db.supportTickets.update(data.id, {
      adminResponse: data.adminResponse.trim(),
      status: data.status,
    })

    // Create notification for user
    const notification = await db.notifications.create({
      createdBy: currentUser.$id,
      title: 'Support Response',
      message: `Your ticket "${existingTicket.subject}" has been ${data.status === 'resolved' ? 'resolved' : 'updated'}.`,
      type: 'support_response',
      targetType: 'user',
      targetCategory: null,
      targetUserId: existingTicket.userId,
      relatedId: ticket.$id,
      isRead: false,
    })

    // Create user_notification record so user can see it
    await db.userNotifications.create({
      createdBy: currentUser.$id,
      userId: existingTicket.userId,
      notificationId: notification.$id,
      isRead: false,
      readAt: null,
    })

    return { ticket }
  })

// Get single ticket (for user or admin)
export const getTicketFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Get user profile
    const userProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (userProfile.total === 0) {
      throw new Error('User profile not found')
    }

    const user = userProfile.rows[0]
    const ticket = await db.supportTickets.get(data.id)

    // Check if user owns the ticket or is admin
    if (ticket.userId !== user.$id && !user.isAdmin) {
      throw new Error('Access denied')
    }

    return { ticket }
  })

// Delete ticket (admin only)
export const deleteTicketFn = createServerFn({ method: 'POST' })
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

    await db.supportTickets.delete(data.id)
    return { success: true }
  })

// Get ticket statistics (admin only)
export const getTicketStatsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
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

    const allTickets = await db.supportTickets.list([Query.limit(1000)])

    const openCount = allTickets.rows.filter(
      (t) => !t.status || t.status === 'open',
    ).length
    const inProgressCount = allTickets.rows.filter(
      (t) => t.status === 'in_progress',
    ).length
    const resolvedCount = allTickets.rows.filter(
      (t) => t.status === 'resolved',
    ).length
    const closedCount = allTickets.rows.filter(
      (t) => t.status === 'closed',
    ).length

    const highPriorityCount = allTickets.rows.filter(
      (t) =>
        t.priority === 'high' &&
        t.status !== 'resolved' &&
        t.status !== 'closed',
    ).length

    return {
      total: allTickets.total,
      open: openCount,
      inProgress: inProgressCount,
      resolved: resolvedCount,
      closed: closedCount,
      highPriority: highPriorityCount,
    }
  },
)
