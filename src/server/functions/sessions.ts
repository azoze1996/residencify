import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../lib/db'
import { authMiddleware } from './auth'
import { Query } from 'node-appwrite'

// Schema for creating/updating a session
const saveSessionSchema = z.object({
  categoryId: z.string(),
  lastQuestionIndex: z.number().int().min(0),
  answeredQuestions: z.array(z.string()).nullable().optional(),
  useTimer: z.boolean().default(false),
  elapsedTime: z.number().int().nullable().optional(),
  poolNumber: z.number().int().nullable().optional(),
  totalQuestions: z.number().int().nullable().optional(),
  isCompleted: z.boolean().default(false),
})

// Helper to check if user's plan is valid
async function validateUserPlan(
  userId: string,
): Promise<{ valid: boolean; message: string }> {
  const userProfile = await db.users.get(userId)

  if (!userProfile.isActive) {
    return {
      valid: false,
      message: 'Your account is inactive. Please contact support.',
    }
  }

  const now = new Date()
  const endDate = new Date(userProfile.endDate)

  if (endDate < now) {
    return {
      valid: false,
      message:
        'Your subscription has expired. Please renew to continue practicing.',
    }
  }

  return { valid: true, message: 'Plan is valid' }
}

// Get user session for a category
export const getUserSessionFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ categoryId: z.string() }))
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

    const userId = userProfile.rows[0].$id

    // Find existing session
    const sessions = await db.userSessions.list([
      Query.equal('userId', [userId]),
      Query.equal('categoryId', [data.categoryId]),
      Query.equal('isCompleted', [false]),
    ])

    if (sessions.total === 0) {
      return { session: null }
    }

    return { session: sessions.rows[0] }
  })

// Save user session
export const saveUserSessionFn = createServerFn({ method: 'POST' })
  .inputValidator(saveSessionSchema)
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

    const userId = userProfile.rows[0].$id

    // Validate user plan
    const planValidation = await validateUserPlan(userId)
    if (!planValidation.valid) {
      throw new Error(planValidation.message)
    }

    // Check for existing session
    const existingSessions = await db.userSessions.list([
      Query.equal('userId', [userId]),
      Query.equal('categoryId', [data.categoryId]),
      Query.equal('isCompleted', [false]),
    ])

    if (existingSessions.total > 0) {
      // Update existing session
      const session = await db.userSessions.update(
        existingSessions.rows[0].$id,
        {
          lastQuestionIndex: data.lastQuestionIndex,
          answeredQuestions: data.answeredQuestions ?? null,
          useTimer: data.useTimer,
          elapsedTime: data.elapsedTime ?? null,
          poolNumber: data.poolNumber ?? existingSessions.rows[0].poolNumber,
          totalQuestions:
            data.totalQuestions ?? existingSessions.rows[0].totalQuestions,
          isCompleted: data.isCompleted,
        },
      )
      return { session }
    } else {
      // Create new session
      const session = await db.userSessions.create({
        createdBy: currentUser.$id,
        userId,
        categoryId: data.categoryId,
        lastQuestionIndex: data.lastQuestionIndex,
        answeredQuestions: data.answeredQuestions ?? null,
        useTimer: data.useTimer,
        elapsedTime: data.elapsedTime ?? null,
        poolNumber: data.poolNumber ?? null,
        totalQuestions: data.totalQuestions ?? null,
        isCompleted: data.isCompleted,
      })
      return { session }
    }
  })

// Complete a session
export const completeSessionFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      categoryId: z.string(),
      answeredQuestions: z.array(z.string()).nullable().optional(),
      elapsedTime: z.number().int().nullable().optional(),
    }),
  )
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

    const userId = userProfile.rows[0].$id

    // Find existing session
    const sessions = await db.userSessions.list([
      Query.equal('userId', [userId]),
      Query.equal('categoryId', [data.categoryId]),
      Query.equal('isCompleted', [false]),
    ])

    if (sessions.total > 0) {
      const session = await db.userSessions.update(sessions.rows[0].$id, {
        isCompleted: true,
        answeredQuestions:
          data.answeredQuestions ?? sessions.rows[0].answeredQuestions,
        elapsedTime: data.elapsedTime ?? sessions.rows[0].elapsedTime,
      })
      return { session }
    }

    return { session: null }
  })

// Delete user session (reset progress)
export const deleteUserSessionFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ categoryId: z.string() }))
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

    const userId = userProfile.rows[0].$id

    // Find and delete session
    const sessions = await db.userSessions.list([
      Query.equal('userId', [userId]),
      Query.equal('categoryId', [data.categoryId]),
    ])

    if (sessions.total > 0) {
      await db.userSessions.delete(sessions.rows[0].$id)
    }

    return { success: true }
  })

// Get all user sessions
export const getAllUserSessionsFn = createServerFn({ method: 'GET' }).handler(
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

    const sessions = await db.userSessions.list([
      Query.equal('userId', [userId]),
      Query.orderDesc('$updatedAt'),
    ])

    return { sessions: sessions.rows }
  },
)

// Get user session statistics
export const getUserSessionStatsFn = createServerFn({ method: 'GET' }).handler(
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

    // Get all sessions
    const sessions = await db.userSessions.list([
      Query.equal('userId', [userId]),
    ])

    const completedSessions = sessions.rows.filter((s) => s.isCompleted)
    const inProgressSessions = sessions.rows.filter((s) => !s.isCompleted)

    // Calculate total questions answered
    let totalQuestionsAnswered = 0
    let totalTimeSpent = 0

    for (const session of sessions.rows) {
      if (session.answeredQuestions) {
        totalQuestionsAnswered += session.answeredQuestions.length
      }
      if (session.elapsedTime) {
        totalTimeSpent += session.elapsedTime
      }
    }

    return {
      totalSessions: sessions.total,
      completedSessions: completedSessions.length,
      inProgressSessions: inProgressSessions.length,
      totalQuestionsAnswered,
      totalTimeSpent,
    }
  },
)

// Check if user can start practice (plan validation)
export const canStartPracticeFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Get user profile
    const userProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (userProfile.total === 0) {
      return { canStart: false, message: 'User profile not found' }
    }

    const userId = userProfile.rows[0].$id
    const validation = await validateUserPlan(userId)

    return {
      canStart: validation.valid,
      message: validation.message,
      planType: userProfile.rows[0].planType,
      endDate: userProfile.rows[0].endDate,
    }
  },
)
