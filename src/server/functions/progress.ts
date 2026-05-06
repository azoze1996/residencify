import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../lib/db'
import { authMiddleware } from './auth'
import { Query } from 'node-appwrite'

// Schema for toggling category completion
const toggleCategoryCompletionSchema = z.object({
  categoryId: z.string().min(1),
  isCompleted: z.boolean(),
})

// Get user's category progress
export const getUserCategoryProgressFn = createServerFn({
  method: 'GET',
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

  const user = userProfile.rows[0]

  // Get all progress records for this user
  const progress = await db.userCategoryProgress.list([
    Query.equal('userId', [user.$id]),
    Query.limit(500),
  ])

  // Return as a map of categoryId -> isCompleted
  const progressMap: Record<string, boolean> = {}
  progress.rows.forEach((p) => {
    progressMap[p.categoryId] = p.isCompleted
  })

  return { progress: progressMap }
})

// Toggle category completion status
export const toggleCategoryCompletionFn = createServerFn({ method: 'POST' })
  .inputValidator(toggleCategoryCompletionSchema)
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

    // Check if progress record exists
    const existingProgress = await db.userCategoryProgress.list([
      Query.equal('userId', [user.$id]),
      Query.equal('categoryId', [data.categoryId]),
    ])

    if (existingProgress.total > 0) {
      // Update existing record
      const record = existingProgress.rows[0]
      await db.userCategoryProgress.update(record.$id, {
        isCompleted: data.isCompleted,
        completedAt: data.isCompleted ? new Date().toISOString() : null,
      })
    } else {
      // Create new record
      await db.userCategoryProgress.create({
        createdBy: currentUser.$id,
        userId: user.$id,
        categoryId: data.categoryId,
        isCompleted: data.isCompleted,
        completedAt: data.isCompleted ? new Date().toISOString() : null,
      })
    }

    return { success: true, isCompleted: data.isCompleted }
  })

// Get completed category IDs for the current user
export const getCompletedCategoryIdsFn = createServerFn({
  method: 'GET',
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

  const user = userProfile.rows[0]

  // Get all completed progress records
  const progress = await db.userCategoryProgress.list([
    Query.equal('userId', [user.$id]),
    Query.equal('isCompleted', [true]),
    Query.limit(500),
  ])

  const completedIds = progress.rows.map((p) => p.categoryId)

  return { completedIds }
})
