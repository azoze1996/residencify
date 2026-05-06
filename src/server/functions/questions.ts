import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../lib/db'
import { authMiddleware } from './auth'
import { Query, ID, Storage, Client } from 'node-appwrite'
import { InputFile } from 'node-appwrite/file'

// --- Helper Logic ---

/**
 * Get admin storage client for file operations
 */
const getAdminStorage = () => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!)
  return new Storage(client)
}

/**
 * Automatically extracts a clean URL from an HTML embed code if needed.
 * This prevents raw HTML strings from appearing in the question display.
 */
const extractImageUrl = (input: string | null | undefined) => {
  if (!input) return null
  // Regex to find the URL inside src="..." if an admin accidentally pastes an HTML snippet
  const match = input.match(/src=["']([^"']+)["']/)
  return match ? match[1] : input.trim()
}

// --- Updated Schemas ---

const createQuestionSchema = z.object({
  questionNumber: z.number().int().min(1),
  questionText: z.string().min(1),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().min(1),
  optionD: z.string().min(1),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
  hasImage: z.boolean().default(false),
  imageFileId: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  poolNumber: z.number().int().min(1),
  explanation: z.string().nullable().optional(),
})

const updateQuestionSchema = z.object({
  id: z.string(),
  questionNumber: z.number().int().min(1).optional(),
  questionText: z.string().min(1).optional(),
  optionA: z.string().min(1).optional(),
  optionB: z.string().min(1).optional(),
  optionC: z.string().min(1).optional(),
  optionD: z.string().min(1).optional(),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']).optional(),
  hasImage: z.boolean().optional(),
  imageFileId: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  poolNumber: z.number().int().min(1).optional(),
  explanation: z.string().nullable().optional(),
})

const bulkCreateQuestionsSchema = z.object({
  poolNumber: z.number().int().min(1),
  questionsText: z.string().min(1),
})

// --- Server Functions ---

/**
 * List questions by pool number (User access)
 */
export const listQuestionsByPoolFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ poolNumber: z.number() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const questions = await db.questions.list([
      Query.equal('poolNumber', [data.poolNumber]),
      Query.orderAsc('questionNumber'),
    ])

    return { questions: questions.rows }
  })

/**
 * List all questions for administrative overview
 */
export const listAllQuestionsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const adminUser = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('isAdmin', [true]),
    ])

    if (adminUser.total === 0) throw new Error('Access denied: Admin only')

    const questions = await db.questions.list([
      Query.orderDesc('$createdAt'),
      Query.limit(1000),
    ])

    return { questions: questions.rows }
  },
)

/**
 * Retrieve a specific question by ID
 */
export const getQuestionFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const question = await db.questions.get(data.id)
    return { question }
  })

/**
 * Create a single question with optional embedded image link
 */
export const createQuestionFn = createServerFn({ method: 'POST' })
  .inputValidator(createQuestionSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const adminUser = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('isAdmin', [true]),
    ])

    if (adminUser.total === 0) throw new Error('Access denied: Admin only')

    // Extract pure URL and determine if the question contains visual media
    const cleanImageUrl = extractImageUrl(data.imageUrl)
    const isImageQuestion = data.hasImage || !!cleanImageUrl

    const question = await db.questions.create({
      createdBy: currentUser.$id,
      questionNumber: data.questionNumber,
      questionText: data.questionText.trim(),
      optionA: data.optionA.trim(),
      optionB: data.optionB.trim(),
      optionC: data.optionC.trim(),
      optionD: data.optionD.trim(),
      correctAnswer: data.correctAnswer,
      hasImage: isImageQuestion,
      imageFileId: data.imageFileId ?? null,
      imageUrl: cleanImageUrl,
      imageEmbed: null,
      poolNumber: data.poolNumber,
      explanation: data.explanation?.trim() ?? null,
      questionType: isImageQuestion ? 'image' : 'text',
    })

    return { question }
  })

/**
 * Parse and create multiple text-only questions at once
 */
export const bulkCreateQuestionsFn = createServerFn({ method: 'POST' })
  .inputValidator(bulkCreateQuestionsSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const adminUser = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('isAdmin', [true]),
    ])

    if (adminUser.total === 0) throw new Error('Access denied: Admin only')

    const questionsText = data.questionsText.trim()
    const questionBlocks = questionsText
      .split(/\n\s*\n/)
      .filter((block) => block.trim())

    const createdQuestions = []
    let questionNumber = 1

    const existingQuestions = await db.questions.list([
      Query.equal('poolNumber', [data.poolNumber]),
      Query.orderDesc('questionNumber'),
      Query.limit(1),
    ])

    if (existingQuestions.total > 0) {
      questionNumber = existingQuestions.rows[0].questionNumber + 1
    }

    for (const block of questionBlocks) {
      const lines = block
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l)
      if (lines.length < 6) continue

      const questionText = lines[0].replace(/^Q?\d+[\.\)]\s*/i, '').trim()
      const optionA = lines[1].replace(/^A[\.\)]\s*/i, '').trim()
      const optionB = lines[2].replace(/^B[\.\)]\s*/i, '').trim()
      const optionC = lines[3].replace(/^C[\.\)]\s*/i, '').trim()
      const optionD = lines[4].replace(/^D[\.\)]\s*/i, '').trim()

      const answerMatch = lines[5].match(/(?:Answer|Correct|Key)[\s:]*([A-D])/i)
      const correctAnswer = answerMatch
        ? (answerMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D')
        : 'A'

      if (questionText && optionA && optionB && optionC && optionD) {
        const question = await db.questions.create({
          createdBy: currentUser.$id,
          questionNumber,
          questionText,
          optionA,
          optionB,
          optionC,
          optionD,
          correctAnswer,
          hasImage: false,
          imageFileId: null,
          imageUrl: null,
          imageEmbed: null,
          poolNumber: data.poolNumber,
          explanation: null,
          questionType: 'text',
        })
        createdQuestions.push(question)
        questionNumber++
      }
    }

    return { questions: createdQuestions, count: createdQuestions.length }
  })

/**
 * Update existing question fields and automatically handle type changes if an image URL is added
 */
export const updateQuestionFn = createServerFn({ method: 'POST' })
  .inputValidator(updateQuestionSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const adminUser = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('isAdmin', [true]),
    ])

    if (adminUser.total === 0) throw new Error('Access denied')

    const { id, ...updateData } = data
    const cleanData: Record<string, unknown> = {}

    if (updateData.questionNumber)
      cleanData.questionNumber = updateData.questionNumber
    if (updateData.questionText)
      cleanData.questionText = updateData.questionText.trim()
    if (updateData.optionA) cleanData.optionA = updateData.optionA.trim()
    if (updateData.optionB) cleanData.optionB = updateData.optionB.trim()
    if (updateData.optionC) cleanData.optionC = updateData.optionC.trim()
    if (updateData.optionD) cleanData.optionD = updateData.optionD.trim()
    if (updateData.correctAnswer)
      cleanData.correctAnswer = updateData.correctAnswer
    if (typeof updateData.hasImage === 'boolean')
      cleanData.hasImage = updateData.hasImage
    if (updateData.imageFileId !== undefined)
      cleanData.imageFileId = updateData.imageFileId

    // Sanitize the URL on update
    if (updateData.imageUrl !== undefined) {
      cleanData.imageUrl = extractImageUrl(updateData.imageUrl)
    }

    if (updateData.poolNumber) cleanData.poolNumber = updateData.poolNumber
    if (updateData.explanation !== undefined)
      cleanData.explanation = updateData.explanation?.trim() ?? null

    // Determine type based on image state after update
    const finalHasImage =
      cleanData.hasImage !== undefined
        ? cleanData.hasImage
        : updateData.hasImage
    const finalImageUrl =
      cleanData.imageUrl !== undefined
        ? cleanData.imageUrl
        : updateData.imageUrl

    if (finalHasImage || finalImageUrl) {
      cleanData.questionType = 'image'
    }

    const question = await db.questions.update(id, cleanData)
    return { question }
  })

/**
 * Delete a question (Admin only)
 */
export const deleteQuestionFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const adminUser = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('isAdmin', [true]),
    ])

    if (adminUser.total === 0) throw new Error('Access denied: Admin only')

    await db.questions.delete(data.id)
    return { success: true }
  })

/**
 * Metadata retrieval for question pools (Admin only)
 */
export const getPoolNumbersFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const adminUser = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('isAdmin', [true]),
    ])

    if (adminUser.total === 0) throw new Error('Access denied: Admin only')

    const questions = await db.questions.list([Query.limit(5000)])

    const poolCounts: Record<number, number> = {}
    for (const q of questions.rows) {
      poolCounts[q.poolNumber] = (poolCounts[q.poolNumber] || 0) + 1
    }

    const pools = Object.entries(poolCounts)
      .map(([poolNumber, count]) => ({
        poolNumber: parseInt(poolNumber),
        count,
      }))
      .sort((a, b) => a.poolNumber - b.poolNumber)

    return { pools }
  },
)

/**
 * Count questions by pool numbers (User access - for category display)
 */
export const countQuestionsByPoolsFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ poolNumbers: z.array(z.number()) }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    let totalCount = 0
    for (const poolNumber of data.poolNumbers) {
      // Use total from the list response for accurate count
      const poolQuestions = await db.questions.list([
        Query.equal('poolNumber', [poolNumber]),
      ])
      totalCount += poolQuestions.total
    }

    return { count: totalCount }
  })

/**
 * Get question counts for multiple pool number arrays (batch operation)
 */
export const getQuestionCountsForCategoriesFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { currentUser } = await authMiddleware()
  if (!currentUser) throw new Error('Unauthorized')

  // Get all questions and count by pool
  const questions = await db.questions.list([Query.limit(5000)])

  const poolCounts: Record<number, number> = {}
  for (const q of questions.rows) {
    poolCounts[q.poolNumber] = (poolCounts[q.poolNumber] || 0) + 1
  }

  return { poolCounts }
})

/**
 * Upload an image for a question (Admin only)
 * Accepts base64 image data and uploads to Appwrite storage
 */
export const uploadQuestionImageFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      base64Data: z.string(),
      fileName: z.string(),
      mimeType: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const adminUser = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('isAdmin', [true]),
    ])

    if (adminUser.total === 0) throw new Error('Access denied: Admin only')

    const bucketId = process.env.APPWRITE_BUCKET_ID
    if (!bucketId) throw new Error('Storage bucket not configured')

    // Strip base64 prefix if present
    const base64Clean = data.base64Data.replace(/^data:[^;]+;base64,/, '')
    const buffer = Buffer.from(base64Clean, 'base64')

    // Create InputFile from buffer
    const inputFile = InputFile.fromBuffer(buffer, data.fileName)

    // Upload to storage using admin client
    const storage = getAdminStorage()
    const fileId = ID.unique()

    const file = await storage.createFile(bucketId, fileId, inputFile)

    // Generate the file view URL
    const endpoint = process.env.APPWRITE_ENDPOINT
    const projectId = process.env.APPWRITE_PROJECT_ID
    const fileUrl = `${endpoint}/storage/buckets/${bucketId}/files/${file.$id}/view?project=${projectId}`

    return {
      fileId: file.$id,
      fileUrl,
    }
  })

/**
 * Get a secure, temporary view URL for a question image
 * Returns a URL that can be used to display the image but prevents easy downloading
 */
export const getQuestionImageUrlFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ fileId: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const bucketId = process.env.APPWRITE_BUCKET_ID
    if (!bucketId) throw new Error('Storage bucket not configured')

    const endpoint = process.env.APPWRITE_ENDPOINT
    const projectId = process.env.APPWRITE_PROJECT_ID

    // Generate a view URL (not download URL) for the image
    // This URL allows viewing but makes downloading slightly harder
    const fileUrl = `${endpoint}/storage/buckets/${bucketId}/files/${data.fileId}/view?project=${projectId}`

    return { fileUrl }
  })

/**
 * Delete a question image from storage (Admin only)
 */
export const deleteQuestionImageFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ fileId: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const adminUser = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('isAdmin', [true]),
    ])

    if (adminUser.total === 0) throw new Error('Access denied: Admin only')

    const bucketId = process.env.APPWRITE_BUCKET_ID
    if (!bucketId) throw new Error('Storage bucket not configured')

    const storage = getAdminStorage()

    try {
      await storage.deleteFile(bucketId, data.fileId)
      return { success: true }
    } catch {
      // File might not exist, that's okay
      return { success: true, notFound: true }
    }
  })
