import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../lib/db'
import { authMiddleware } from './auth'
import { Query } from 'node-appwrite'

// Schema for creating a plan
const createPlanSchema = z.object({
  name: z.string().min(1).max(100),
  planType: z.enum(['free', 'paid']),
  targetCategory: z
    .enum(['medical_student', 'intern', 'trainee_resident', 'all'])
    .nullable()
    .optional(),
  duration: z.enum(['monthly', '3months', '6months']),
  durationMonths: z.number().int().min(1).max(12),
  priceSAR: z.number().min(0),
  priceUSD: z.number().min(0),
  description: z.string().max(500).nullable().optional(),
  isActive: z.boolean().default(true),
  accessLevel: z.enum(['full', 'limited']).nullable().optional(),
  maxQuestions: z.number().int().min(0).nullable().optional(),
  allowedPools: z.array(z.number()).nullable().optional(),
  features: z.array(z.string()).nullable().optional(),
})

// Schema for updating a plan
const updatePlanSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  planType: z.enum(['free', 'paid']).optional(),
  targetCategory: z
    .enum(['medical_student', 'intern', 'trainee_resident', 'all'])
    .nullable()
    .optional(),
  duration: z.enum(['monthly', '3months', '6months']).optional(),
  durationMonths: z.number().int().min(1).max(12).optional(),
  priceSAR: z.number().min(0).optional(),
  priceUSD: z.number().min(0).optional(),
  description: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
  accessLevel: z.enum(['full', 'limited']).nullable().optional(),
  maxQuestions: z.number().int().min(0).nullable().optional(),
  allowedPools: z.array(z.number()).nullable().optional(),
  features: z.array(z.string()).nullable().optional(),
})

// List all plans
export const listPlansFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const plans = await db.plans.list([Query.orderAsc('durationMonths')])
    return { plans: plans.rows }
  },
)

// List active plans only (for public display)
export const listActivePlansFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const plans = await db.plans.list([
      Query.equal('isActive', [true]),
      Query.orderAsc('durationMonths'),
    ])
    return { plans: plans.rows }
  },
)

// Get single plan
export const getPlanFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const plan = await db.plans.get(data.id)
    return { plan }
  })

// Create plan (admin only)
export const createPlanFn = createServerFn({ method: 'POST' })
  .inputValidator(createPlanSchema)
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

    const plan = await db.plans.create({
      createdBy: currentUser.$id,
      name: data.name.trim(),
      planType: data.planType,
      targetCategory: data.targetCategory ?? null,
      duration: data.duration,
      durationMonths: data.durationMonths,
      priceSAR: data.priceSAR,
      priceUSD: data.priceUSD,
      description: data.description?.trim() ?? null,
      isActive: data.isActive,
      accessLevel: data.accessLevel ?? null,
      maxQuestions: data.maxQuestions ?? null,
      allowedPools: data.allowedPools ?? null,
      features: data.features ?? null,
    })

    return { plan }
  })

// Update plan (admin only)
export const updatePlanFn = createServerFn({ method: 'POST' })
  .inputValidator(updatePlanSchema)
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

    const { id, ...updateData } = data
    const cleanData: Record<string, unknown> = {}

    if (updateData.name) cleanData.name = updateData.name.trim()
    if (updateData.planType) cleanData.planType = updateData.planType
    if (updateData.targetCategory !== undefined)
      cleanData.targetCategory = updateData.targetCategory
    if (updateData.duration) cleanData.duration = updateData.duration
    if (updateData.durationMonths)
      cleanData.durationMonths = updateData.durationMonths
    if (typeof updateData.priceSAR === 'number')
      cleanData.priceSAR = updateData.priceSAR
    if (typeof updateData.priceUSD === 'number')
      cleanData.priceUSD = updateData.priceUSD
    if (updateData.description !== undefined)
      cleanData.description = updateData.description?.trim() ?? null
    if (typeof updateData.isActive === 'boolean')
      cleanData.isActive = updateData.isActive
    if (updateData.accessLevel !== undefined)
      cleanData.accessLevel = updateData.accessLevel
    if (updateData.maxQuestions !== undefined)
      cleanData.maxQuestions = updateData.maxQuestions
    if (updateData.allowedPools !== undefined)
      cleanData.allowedPools = updateData.allowedPools
    if (updateData.features !== undefined)
      cleanData.features = updateData.features

    const plan = await db.plans.update(id, cleanData)
    return { plan }
  })

// Delete plan (admin only)
export const deletePlanFn = createServerFn({ method: 'POST' })
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

    await db.plans.delete(data.id)
    return { success: true }
  })
