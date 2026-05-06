import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { Query } from 'node-appwrite'
import { db } from '../lib/db'
import { authMiddleware } from './auth'
import type { OsceTopics, OsceSpecialties } from '../lib/appwrite.types'

// ============ OSCE Specialties ============

export const listOsceSpecialtiesFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const result = await db.osceSpecialties.list([
      Query.equal('isActive', [true]),
      Query.orderAsc('order'),
      Query.limit(100),
    ])

    return { specialties: result.rows as OsceSpecialties[] }
  },
)

export const listAllOsceSpecialtiesFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { currentUser } = await authMiddleware()
  if (!currentUser) throw new Error('Unauthorized')

  const result = await db.osceSpecialties.list([
    Query.orderAsc('order'),
    Query.limit(100),
  ])

  return { specialties: result.rows as OsceSpecialties[] }
})

const createSpecialtySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  order: z.number().int().min(0).nullable().optional(),
  isActive: z.boolean().default(true),
})

export const createOsceSpecialtyFn = createServerFn({ method: 'POST' })
  .inputValidator(createSpecialtySchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const specialty = await db.osceSpecialties.create({
      createdBy: currentUser.$id,
      name: data.name.trim(),
      description: data.description ?? null,
      order: data.order ?? null,
      isActive: data.isActive,
    })

    return { specialty }
  })

const updateSpecialtySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  order: z.number().int().min(0).nullable().optional(),
  isActive: z.boolean().optional(),
})

export const updateOsceSpecialtyFn = createServerFn({ method: 'POST' })
  .inputValidator(updateSpecialtySchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const { id, ...updateData } = data
    const specialty = await db.osceSpecialties.update(id, {
      ...(updateData.name !== undefined && { name: updateData.name.trim() }),
      ...(updateData.description !== undefined && {
        description: updateData.description,
      }),
      ...(updateData.order !== undefined && { order: updateData.order }),
      ...(updateData.isActive !== undefined && {
        isActive: updateData.isActive,
      }),
    })

    return { specialty }
  })

export const deleteOsceSpecialtyFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    await db.osceSpecialties.delete(data.id)
    return { success: true }
  })

// ============ OSCE Topics ============

export const listOsceTopicsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const result = await db.osceTopics.list([
      Query.equal('isActive', [true]),
      Query.orderAsc('order'),
      Query.limit(500),
    ])

    return { topics: result.rows as OsceTopics[] }
  },
)

export const listAllOsceTopicsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const result = await db.osceTopics.list([
      Query.orderAsc('order'),
      Query.limit(500),
    ])

    return { topics: result.rows as OsceTopics[] }
  },
)

const listTopicsBySpecialtySchema = z.object({
  specialty: z.string(),
})

export const listOsceTopicsBySpecialtyFn = createServerFn({ method: 'GET' })
  .inputValidator(listTopicsBySpecialtySchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const result = await db.osceTopics.list([
      Query.equal('specialty', [data.specialty]),
      Query.equal('isActive', [true]),
      Query.orderAsc('order'),
      Query.limit(100),
    ])

    return { topics: result.rows as OsceTopics[] }
  })

export const getOsceTopicFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const topic = await db.osceTopics.get(data.id)
    return { topic: topic as OsceTopics }
  })

const interactionSchema = z.object({
  text: z.string().min(1),
  reply: z.string().min(1),
})

const createTopicSchema = z.object({
  title: z.string().min(1).max(500),
  specialty: z.string().min(1).max(200),
  scenario: z.string().min(1).max(10000),
  scenarioImageUrl: z.string().max(2000).nullable().optional(),
  scenarioImageFileId: z.string().max(100).nullable().optional(),
  interactions: z.array(interactionSchema).nullable().optional(),
  order: z.number().int().min(0).nullable().optional(),
  isActive: z.boolean().default(true),
})

export const createOsceTopicFn = createServerFn({ method: 'POST' })
  .inputValidator(createTopicSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const topic = await db.osceTopics.create({
      createdBy: currentUser.$id,
      title: data.title.trim(),
      specialty: data.specialty.trim(),
      scenario: data.scenario.trim(),
      scenarioImageUrl: data.scenarioImageUrl ?? null,
      scenarioImageFileId: data.scenarioImageFileId ?? null,
      interactions: data.interactions
        ? JSON.stringify(data.interactions)
        : null,
      order: data.order ?? null,
      isActive: data.isActive,
    })

    return { topic }
  })

const updateTopicSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(500).optional(),
  specialty: z.string().min(1).max(200).optional(),
  scenario: z.string().min(1).max(10000).optional(),
  scenarioImageUrl: z.string().max(2000).nullable().optional(),
  scenarioImageFileId: z.string().max(100).nullable().optional(),
  interactions: z.array(interactionSchema).nullable().optional(),
  order: z.number().int().min(0).nullable().optional(),
  isActive: z.boolean().optional(),
})

export const updateOsceTopicFn = createServerFn({ method: 'POST' })
  .inputValidator(updateTopicSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const { id, ...updateData } = data
    const topic = await db.osceTopics.update(id, {
      ...(updateData.title !== undefined && { title: updateData.title.trim() }),
      ...(updateData.specialty !== undefined && {
        specialty: updateData.specialty.trim(),
      }),
      ...(updateData.scenario !== undefined && {
        scenario: updateData.scenario.trim(),
      }),
      ...(updateData.scenarioImageUrl !== undefined && {
        scenarioImageUrl: updateData.scenarioImageUrl,
      }),
      ...(updateData.scenarioImageFileId !== undefined && {
        scenarioImageFileId: updateData.scenarioImageFileId,
      }),
      ...(updateData.interactions !== undefined && {
        interactions: updateData.interactions
          ? JSON.stringify(updateData.interactions)
          : null,
      }),
      ...(updateData.order !== undefined && { order: updateData.order }),
      ...(updateData.isActive !== undefined && {
        isActive: updateData.isActive,
      }),
    })

    return { topic }
  })

export const deleteOsceTopicFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    await db.osceTopics.delete(data.id)
    return { success: true }
  })

// ============ OSCE Stats ============

export const getOsceStatsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const [specialtiesResult, topicsResult] = await Promise.all([
      db.osceSpecialties.list([Query.limit(1)]),
      db.osceTopics.list([Query.limit(1)]),
    ])

    return {
      totalSpecialties: specialtiesResult.total,
      totalTopics: topicsResult.total,
    }
  },
)
