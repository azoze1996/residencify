import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../lib/db'
import { authMiddleware } from './auth'
import { Query } from 'node-appwrite'

// Schema for creating a category
const createCategorySchema = z.object({
  name: z.string().min(1).max(200),
  domain: z.enum(['trainee_resident']),
  parentId: z.string().nullable().optional(),
  poolNumbers: z.array(z.number()).nullable().optional(),
  order: z.number().int().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  isActive: z.boolean().default(true),
})

// Schema for updating a category
const updateCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200).optional(),
  domain: z.enum(['trainee_resident']).optional(),
  parentId: z.string().nullable().optional(),
  poolNumbers: z.array(z.number()).nullable().optional(),
  order: z.number().int().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
})

// Check if user has admin access (full admin or exam admin)
async function checkAdminAccess(authUserId: string) {
  const users = await db.users.list([Query.equal('authUserId', [authUserId])])

  if (users.total === 0) return { isAdmin: false, isExamAdmin: false }

  const user = users.rows[0]
  return {
    isAdmin: user.isAdmin === true,
    isExamAdmin: user.accessLevel === 'exam_admin',
    hasAccess: user.isAdmin === true || user.accessLevel === 'exam_admin',
  }
}

// List all categories (admin or exam admin)
export const listAllCategoriesFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const { hasAccess } = await checkAdminAccess(currentUser.$id)

    if (!hasAccess) {
      throw new Error('Access denied: Admin only')
    }

    const categories = await db.categories.list([
      Query.orderAsc('order'),
      Query.limit(500),
    ])

    return { categories: categories.rows }
  },
)

// List categories by domain (for users)
export const listCategoriesByDomainFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ domain: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Get user profile to check access
    const userProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (userProfile.total === 0) {
      throw new Error('User profile not found')
    }

    const user = userProfile.rows[0]

    // Check if user has access to this domain
    if (
      user.accessCategory !== data.domain &&
      !user.isAdmin &&
      user.accessLevel !== 'exam_admin'
    ) {
      throw new Error('Access denied: You do not have access to this category')
    }

    const categories = await db.categories.list([
      Query.equal('domain', [data.domain]),
      Query.equal('isActive', [true]),
      Query.orderAsc('order'),
    ])

    return { categories: categories.rows }
  })

// Get user's accessible categories with hierarchical structure
export const getUserCategoriesFn = createServerFn({ method: 'GET' }).handler(
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

    const user = userProfile.rows[0]

    // Get all categories for user's access level (trainee_resident)
    const categories = await db.categories.list([
      Query.equal('domain', [user.accessCategory]),
      Query.equal('isActive', [true]),
      Query.orderAsc('order'),
      Query.limit(500),
    ])

    return { categories: categories.rows, userDomain: user.accessCategory }
  },
)

// Get single category
export const getCategoryFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const category = await db.categories.get(data.id)
    return { category }
  })

// Create category (admin or exam admin)
export const createCategoryFn = createServerFn({ method: 'POST' })
  .inputValidator(createCategorySchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const { hasAccess } = await checkAdminAccess(currentUser.$id)

    if (!hasAccess) {
      throw new Error('Access denied: Admin only')
    }

    const category = await db.categories.create({
      createdBy: currentUser.$id,
      name: data.name.trim(),
      domain: data.domain,
      parentId: data.parentId ?? null,
      poolNumbers: data.poolNumbers ?? null,
      order: data.order ?? null,
      description: data.description?.trim() ?? null,
      isActive: data.isActive,
    })

    return { category }
  })

// Update category (admin or exam admin)
export const updateCategoryFn = createServerFn({ method: 'POST' })
  .inputValidator(updateCategorySchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const { hasAccess } = await checkAdminAccess(currentUser.$id)

    if (!hasAccess) {
      throw new Error('Access denied: Admin only')
    }

    const { id, ...updateData } = data
    const cleanData: Record<string, unknown> = {}

    if (updateData.name) cleanData.name = updateData.name.trim()
    if (updateData.domain) cleanData.domain = updateData.domain
    if (updateData.parentId !== undefined)
      cleanData.parentId = updateData.parentId
    if (updateData.poolNumbers !== undefined)
      cleanData.poolNumbers = updateData.poolNumbers
    if (updateData.order !== undefined) cleanData.order = updateData.order
    if (updateData.description !== undefined)
      cleanData.description = updateData.description?.trim() ?? null
    if (typeof updateData.isActive === 'boolean')
      cleanData.isActive = updateData.isActive

    const category = await db.categories.update(id, cleanData)
    return { category }
  })

// Delete category (admin or exam admin)
export const deleteCategoryFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const { hasAccess } = await checkAdminAccess(currentUser.$id)

    if (!hasAccess) {
      throw new Error('Access denied: Admin only')
    }

    await db.categories.delete(data.id)
    return { success: true }
  })
