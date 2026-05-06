import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../lib/db'
import { authMiddleware } from './auth'
import { Query } from 'node-appwrite'

// Schema for flagging a question
const flagQuestionSchema = z.object({
  questionId: z.string(),
  sessionId: z.string().nullable().optional(),
  note: z.string().max(500).nullable().optional(),
})

// Schema for unflagging a question
const unflagQuestionSchema = z.object({
  flagId: z.string(),
})

/**
 * Flag a question for later review
 */
export const flagQuestionFn = createServerFn({ method: 'POST' })
  .inputValidator(flagQuestionSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Get current user's profile
    const currentUserProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (currentUserProfile.total === 0) {
      throw new Error('User profile not found')
    }

    const userProfileId = currentUserProfile.rows[0].$id

    // Get the question details
    const question = await db.questions.get(data.questionId)

    // Check if already flagged
    const existingFlag = await db.flaggedQuestions.list([
      Query.equal('userId', [userProfileId]),
      Query.equal('questionId', [data.questionId]),
    ])

    if (existingFlag.total > 0) {
      // Already flagged, return existing
      return { flaggedQuestion: existingFlag.rows[0], alreadyFlagged: true }
    }

    // Create flagged question record
    const flaggedQuestion = await db.flaggedQuestions.create({
      createdBy: currentUser.$id,
      userId: userProfileId,
      questionId: data.questionId,
      sessionId: data.sessionId ?? null,
      questionNumber: question.questionNumber,
      poolNumber: question.poolNumber,
      note: data.note ?? null,
    })

    return { flaggedQuestion, alreadyFlagged: false }
  })

/**
 * Unflag a question
 */
export const unflagQuestionFn = createServerFn({ method: 'POST' })
  .inputValidator(unflagQuestionSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Get current user's profile
    const currentUserProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (currentUserProfile.total === 0) {
      throw new Error('User profile not found')
    }

    const userProfileId = currentUserProfile.rows[0].$id

    // Get the flagged question
    const flaggedQuestion = await db.flaggedQuestions.get(data.flagId)

    // Verify ownership
    if (flaggedQuestion.userId !== userProfileId) {
      throw new Error('Not authorized to unflag this question')
    }

    await db.flaggedQuestions.delete(data.flagId)

    return { success: true }
  })

/**
 * Unflag a question by question ID
 */
export const unflagQuestionByIdFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ questionId: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Get current user's profile
    const currentUserProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (currentUserProfile.total === 0) {
      throw new Error('User profile not found')
    }

    const userProfileId = currentUserProfile.rows[0].$id

    // Find the flagged question
    const flaggedQuestions = await db.flaggedQuestions.list([
      Query.equal('userId', [userProfileId]),
      Query.equal('questionId', [data.questionId]),
    ])

    if (flaggedQuestions.total === 0) {
      return { success: true, notFound: true }
    }

    await db.flaggedQuestions.delete(flaggedQuestions.rows[0].$id)

    return { success: true, notFound: false }
  })

/**
 * Get all flagged questions for current user
 */
export const getFlaggedQuestionsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Get current user's profile
    const currentUserProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (currentUserProfile.total === 0) {
      throw new Error('User profile not found')
    }

    const userProfileId = currentUserProfile.rows[0].$id

    // Get flagged questions
    const flaggedQuestions = await db.flaggedQuestions.list([
      Query.equal('userId', [userProfileId]),
      Query.orderDesc('$createdAt'),
    ])

    return { flaggedQuestions: flaggedQuestions.rows }
  },
)

/**
 * Get flagged question IDs for a session (for quick lookup)
 */
export const getFlaggedQuestionIdsFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { currentUser } = await authMiddleware()
  if (!currentUser) throw new Error('Unauthorized')

  // Get current user's profile
  const currentUserProfile = await db.users.list([
    Query.equal('authUserId', [currentUser.$id]),
  ])

  if (currentUserProfile.total === 0) {
    throw new Error('User profile not found')
  }

  const userProfileId = currentUserProfile.rows[0].$id

  // Get flagged questions
  const flaggedQuestions = await db.flaggedQuestions.list([
    Query.equal('userId', [userProfileId]),
  ])

  const flaggedIds = flaggedQuestions.rows.map((fq) => fq.questionId)

  return { flaggedIds }
})

/**
 * Check if a specific question is flagged
 */
export const isQuestionFlaggedFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ questionId: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Get current user's profile
    const currentUserProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (currentUserProfile.total === 0) {
      throw new Error('User profile not found')
    }

    const userProfileId = currentUserProfile.rows[0].$id

    // Check if flagged
    const flaggedQuestions = await db.flaggedQuestions.list([
      Query.equal('userId', [userProfileId]),
      Query.equal('questionId', [data.questionId]),
    ])

    return { isFlagged: flaggedQuestions.total > 0 }
  })
