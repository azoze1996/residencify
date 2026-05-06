import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { Query } from 'node-appwrite'
import { db } from '../lib/db'
import { authMiddleware } from './auth'
import type { Bookmarks } from '../lib/appwrite.types'

// ============ List Bookmarks ============

export const listBookmarksFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const result = await db.bookmarks.list([
      Query.equal('userId', [currentUser.$id]),
      Query.orderDesc('$createdAt'),
      Query.limit(500),
    ])

    return { bookmarks: result.rows as Bookmarks[] }
  },
)

// ============ List Bookmarks with Enriched Data ============

export const listBookmarksEnrichedFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { currentUser } = await authMiddleware()
  if (!currentUser) throw new Error('Unauthorized')

  const result = await db.bookmarks.list([
    Query.equal('userId', [currentUser.$id]),
    Query.orderDesc('$createdAt'),
    Query.limit(500),
  ])

  // Fetch category names for MCQ bookmarks
  const enrichedBookmarks = await Promise.all(
    result.rows.map(async (bookmark) => {
      const b = bookmark as Bookmarks
      if (b.itemType === 'mcq' && b.poolNumber) {
        // Find category that contains this pool number
        try {
          const categories = await db.categories.list([
            Query.equal('isActive', [true]),
            Query.limit(100),
          ])

          const matchingCategory = categories.rows.find(
            (cat) => cat.poolNumbers && cat.poolNumbers.includes(b.poolNumber!),
          )

          return {
            ...b,
            categoryName: matchingCategory?.name || null,
          }
        } catch {
          return { ...b, categoryName: null }
        }
      }
      return { ...b, categoryName: null }
    }),
  )

  return { bookmarks: enrichedBookmarks }
})

const listByTypeSchema = z.object({
  itemType: z.enum(['mcq', 'osce']),
})

export const listBookmarksByTypeFn = createServerFn({ method: 'GET' })
  .inputValidator(listByTypeSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const result = await db.bookmarks.list([
      Query.equal('userId', [currentUser.$id]),
      Query.equal('itemType', [data.itemType]),
      Query.orderDesc('$createdAt'),
      Query.limit(500),
    ])

    return { bookmarks: result.rows as Bookmarks[] }
  })

// ============ Check if Bookmarked ============

const checkBookmarkSchema = z.object({
  itemType: z.enum(['mcq', 'osce']),
  itemId: z.string(),
})

export const isBookmarkedFn = createServerFn({ method: 'GET' })
  .inputValidator(checkBookmarkSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const result = await db.bookmarks.list([
      Query.equal('userId', [currentUser.$id]),
      Query.equal('itemType', [data.itemType]),
      Query.equal('itemId', [data.itemId]),
      Query.limit(1),
    ])

    return { isBookmarked: result.rows.length > 0 }
  })

// ============ Get Bookmarked IDs ============

export const getBookmarkedIdsFn = createServerFn({ method: 'GET' })
  .inputValidator(listByTypeSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const result = await db.bookmarks.list([
      Query.equal('userId', [currentUser.$id]),
      Query.equal('itemType', [data.itemType]),
      Query.limit(500),
    ])

    const ids = result.rows.map((b) => (b as Bookmarks).itemId)
    return { bookmarkedIds: ids }
  })

// ============ Toggle Bookmark ============

const toggleBookmarkSchema = z.object({
  itemType: z.enum(['mcq', 'osce']),
  itemId: z.string(),
  // Optional metadata for display purposes
  questionNumber: z.number().int().nullable().optional(),
  poolNumber: z.number().int().nullable().optional(),
  osceTitle: z.string().max(500).nullable().optional(),
  osceSpecialty: z.string().max(200).nullable().optional(),
})

export const toggleBookmarkFn = createServerFn({ method: 'POST' })
  .inputValidator(toggleBookmarkSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Check if already bookmarked
    const existing = await db.bookmarks.list([
      Query.equal('userId', [currentUser.$id]),
      Query.equal('itemType', [data.itemType]),
      Query.equal('itemId', [data.itemId]),
      Query.limit(1),
    ])

    if (existing.rows.length > 0) {
      // Remove bookmark
      await db.bookmarks.delete(existing.rows[0].$id)
      return { bookmarked: false }
    }

    // Add bookmark
    await db.bookmarks.create({
      createdBy: currentUser.$id,
      userId: currentUser.$id,
      itemType: data.itemType,
      itemId: data.itemId,
      questionNumber: data.questionNumber ?? null,
      poolNumber: data.poolNumber ?? null,
      osceTitle: data.osceTitle ?? null,
      osceSpecialty: data.osceSpecialty ?? null,
    })

    return { bookmarked: true }
  })

// ============ Add Bookmark ============

export const addBookmarkFn = createServerFn({ method: 'POST' })
  .inputValidator(toggleBookmarkSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Check if already bookmarked
    const existing = await db.bookmarks.list([
      Query.equal('userId', [currentUser.$id]),
      Query.equal('itemType', [data.itemType]),
      Query.equal('itemId', [data.itemId]),
      Query.limit(1),
    ])

    if (existing.rows.length > 0) {
      return { bookmark: existing.rows[0] as Bookmarks, alreadyExists: true }
    }

    const bookmark = await db.bookmarks.create({
      createdBy: currentUser.$id,
      userId: currentUser.$id,
      itemType: data.itemType,
      itemId: data.itemId,
      questionNumber: data.questionNumber ?? null,
      poolNumber: data.poolNumber ?? null,
      osceTitle: data.osceTitle ?? null,
      osceSpecialty: data.osceSpecialty ?? null,
    })

    return { bookmark, alreadyExists: false }
  })

// ============ Remove Bookmark ============

const removeBookmarkSchema = z.object({
  itemType: z.enum(['mcq', 'osce']),
  itemId: z.string(),
})

export const removeBookmarkFn = createServerFn({ method: 'POST' })
  .inputValidator(removeBookmarkSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const existing = await db.bookmarks.list([
      Query.equal('userId', [currentUser.$id]),
      Query.equal('itemType', [data.itemType]),
      Query.equal('itemId', [data.itemId]),
      Query.limit(1),
    ])

    if (existing.rows.length > 0) {
      await db.bookmarks.delete(existing.rows[0].$id)
      return { removed: true }
    }

    return { removed: false }
  })

// ============ Delete Bookmark by ID ============

export const deleteBookmarkFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Verify ownership
    const bookmark = await db.bookmarks.get(data.id)
    if ((bookmark as Bookmarks).userId !== currentUser.$id) {
      throw new Error('Unauthorized')
    }

    await db.bookmarks.delete(data.id)
    return { success: true }
  })

// ============ Get Bookmark Stats ============

export const getBookmarkStatsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const [mcqResult, osceResult] = await Promise.all([
      db.bookmarks.list([
        Query.equal('userId', [currentUser.$id]),
        Query.equal('itemType', ['mcq']),
        Query.limit(1),
      ]),
      db.bookmarks.list([
        Query.equal('userId', [currentUser.$id]),
        Query.equal('itemType', ['osce']),
        Query.limit(1),
      ]),
    ])

    return {
      mcqCount: mcqResult.total,
      osceCount: osceResult.total,
      totalCount: mcqResult.total + osceResult.total,
    }
  },
)
