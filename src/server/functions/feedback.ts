import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../lib/db'
import { authMiddleware } from './auth'
import { Query } from 'node-appwrite'

// Schema for creating feedback
const createFeedbackSchema = z.object({
  questionId: z.string(),
  feedbackText: z.string().min(1).max(2000),
})

// Schema for OSCE feedback
const submitOsceFeedbackSchema = z.object({
  osceTopicId: z.string(),
  feedbackText: z.string().min(1).max(2000),
})

// Schema for admin response
const respondToFeedbackSchema = z.object({
  id: z.string(),
  adminResponse: z.string().min(1).max(2000),
  status: z.enum(['pending', 'reviewed', 'resolved']),
})

// Create feedback (user)
export const createFeedbackFn = createServerFn({ method: 'POST' })
  .inputValidator(createFeedbackSchema)
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

    // Get question details
    let questionNumber: number | null = null
    let poolNumber: number | null = null
    try {
      const question = await db.questions.get(data.questionId)
      questionNumber = question.questionNumber
      poolNumber = question.poolNumber
    } catch {
      // Question might not exist, continue without details
    }

    const feedback = await db.feedback.create({
      createdBy: currentUser.$id,
      userId,
      questionId: data.questionId,
      feedbackText: data.feedbackText.trim(),
      status: 'pending',
      adminResponse: null,
      questionNumber,
      userName: user.username,
      poolNumber,
      userEmail: user.email,
    })

    // Create notification for admin
    await db.notifications.create({
      createdBy: currentUser.$id,
      title: 'New Question Feedback',
      message: `${user.username} submitted feedback on Q${questionNumber || '?'} (Pool ${poolNumber || '?'})`,
      type: 'feedback',
      targetType: 'admin',
      targetCategory: null,
      targetUserId: null,
      relatedId: feedback.$id,
      isRead: false,
    })

    return { feedback }
  })

// List all feedback (admin only)
export const listAllFeedbackFn = createServerFn({ method: 'GET' }).handler(
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

    const feedback = await db.feedback.list([
      Query.orderDesc('$createdAt'),
      Query.limit(500),
    ])

    return { feedback: feedback.rows }
  },
)

// Get feedback by status (admin only)
export const listFeedbackByStatusFn = createServerFn({ method: 'GET' })
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

    const feedback = await db.feedback.list([
      Query.equal('status', [data.status]),
      Query.orderDesc('$createdAt'),
    ])

    return { feedback: feedback.rows }
  })

// Respond to feedback (admin only)
export const respondToFeedbackFn = createServerFn({ method: 'POST' })
  .inputValidator(respondToFeedbackSchema)
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

    // Get the feedback to find the user
    const existingFeedback = await db.feedback.get(data.id)

    const feedback = await db.feedback.update(data.id, {
      adminResponse: data.adminResponse.trim(),
      status: data.status,
    })

    // Create notification for user
    const notification = await db.notifications.create({
      createdBy: currentUser.$id,
      title: 'Feedback Response',
      message: `Your feedback on Q${existingFeedback.questionNumber || '?'} has been ${data.status === 'resolved' ? 'resolved' : 'reviewed'}.`,
      type: 'feedback_response',
      targetType: 'user',
      targetCategory: null,
      targetUserId: existingFeedback.userId,
      relatedId: feedback.$id,
      isRead: false,
    })

    // Create user_notification record so user can see it
    await db.userNotifications.create({
      createdBy: currentUser.$id,
      userId: existingFeedback.userId,
      notificationId: notification.$id,
      isRead: false,
      readAt: null,
    })

    return { feedback }
  })

// Delete feedback (admin only)
export const deleteFeedbackFn = createServerFn({ method: 'POST' })
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

    await db.feedback.delete(data.id)
    return { success: true }
  })

// Get feedback statistics (admin only)
export const getFeedbackStatsFn = createServerFn({ method: 'GET' }).handler(
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

    const allFeedback = await db.feedback.list([Query.limit(1000)])

    const pendingCount = allFeedback.rows.filter(
      (f) => !f.status || f.status === 'pending',
    ).length
    const reviewedCount = allFeedback.rows.filter(
      (f) => f.status === 'reviewed',
    ).length
    const resolvedCount = allFeedback.rows.filter(
      (f) => f.status === 'resolved',
    ).length

    return {
      total: allFeedback.total,
      pending: pendingCount,
      reviewed: reviewedCount,
      resolved: resolvedCount,
    }
  },
)

// Submit OSCE topic feedback (user)
export const submitOsceFeedbackFn = createServerFn({ method: 'POST' })
  .inputValidator(submitOsceFeedbackSchema)
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

    // Get OSCE topic details
    let osceTopicTitle: string | null = null
    let osceSpecialty: string | null = null
    try {
      const osceTopic = await db.osceTopics.get(data.osceTopicId)
      osceTopicTitle = osceTopic.title
      osceSpecialty = osceTopic.specialty
    } catch {
      // Topic might not exist, continue without details
    }

    const feedback = await db.osceFeedback.create({
      createdBy: currentUser.$id,
      userId,
      osceTopicId: data.osceTopicId,
      feedbackText: data.feedbackText.trim(),
      status: 'pending',
      adminResponse: null,
      userName: user.username,
      userEmail: user.email,
      osceTopicTitle,
      osceSpecialty,
    })

    // Create notification for admin
    await db.notifications.create({
      createdBy: currentUser.$id,
      title: 'New OSCE Feedback',
      message: `${user.username} submitted feedback on OSCE topic: ${osceTopicTitle || 'Unknown'}`,
      type: 'osce_feedback',
      targetType: 'admin',
      targetCategory: null,
      targetUserId: null,
      relatedId: feedback.$id,
      isRead: false,
    })

    return { feedback }
  })
