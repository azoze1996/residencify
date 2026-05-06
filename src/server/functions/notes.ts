import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { Query } from 'node-appwrite'
import { db } from '@/server/lib/db'
import { authMiddleware } from './auth'

// Schema for creating/updating a note
const noteSchema = z.object({
  questionId: z.string().min(1),
  noteText: z.string().min(1).max(3000), // ~500 words
  questionNumber: z.number().nullable().optional(),
  poolNumber: z.number().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  categoryName: z.string().nullable().optional(),
})

// Schema for getting a note
const getNoteSchema = z.object({
  questionId: z.string().min(1),
})

// Schema for deleting a note
const deleteNoteSchema = z.object({
  noteId: z.string().min(1),
})

// Get note for a specific question
export const getQuestionNoteFn = createServerFn({ method: 'GET' })
  .inputValidator(getNoteSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const notes = await db.questionNotes.list([
      Query.equal('userId', [currentUser.$id]),
      Query.equal('questionId', [data.questionId]),
      Query.limit(1),
    ])

    return {
      note: notes.rows.length > 0 ? notes.rows[0] : null,
    }
  })

// Get all notes for the current user
export const listUserNotesFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const notes = await db.questionNotes.list([
      Query.equal('userId', [currentUser.$id]),
      Query.orderDesc('$createdAt'),
      Query.limit(100),
    ])

    return {
      notes: notes.rows,
      total: notes.total,
    }
  },
)

// Create or update a note
export const saveQuestionNoteFn = createServerFn({ method: 'POST' })
  .inputValidator(noteSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Check if note already exists for this question
    const existingNotes = await db.questionNotes.list([
      Query.equal('userId', [currentUser.$id]),
      Query.equal('questionId', [data.questionId]),
      Query.limit(1),
    ])

    if (existingNotes.rows.length > 0) {
      // Update existing note
      const existingNote = existingNotes.rows[0]
      const updatedNote = await db.questionNotes.update(existingNote.$id, {
        noteText: data.noteText.trim(),
        questionNumber: data.questionNumber ?? null,
        poolNumber: data.poolNumber ?? null,
        categoryId: data.categoryId ?? null,
        categoryName: data.categoryName ?? null,
      })

      return {
        note: updatedNote,
        isNew: false,
      }
    }

    // Create new note
    const newNote = await db.questionNotes.create({
      createdBy: currentUser.$id,
      userId: currentUser.$id,
      questionId: data.questionId,
      noteText: data.noteText.trim(),
      questionNumber: data.questionNumber ?? null,
      poolNumber: data.poolNumber ?? null,
      categoryId: data.categoryId ?? null,
      categoryName: data.categoryName ?? null,
    })

    return {
      note: newNote,
      isNew: true,
    }
  })

// Delete a note
export const deleteQuestionNoteFn = createServerFn({ method: 'POST' })
  .inputValidator(deleteNoteSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Verify ownership
    const note = await db.questionNotes.get(data.noteId)
    if (note.userId !== currentUser.$id) {
      throw new Error('Unauthorized: You can only delete your own notes')
    }

    await db.questionNotes.delete(data.noteId)

    return { success: true }
  })

// Get note IDs for a list of questions (for batch checking)
export const getNoteIdsForQuestionsFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ questionIds: z.array(z.string()) }).optional())
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    if (!data?.questionIds || data.questionIds.length === 0) {
      return { noteIds: [] }
    }

    const notes = await db.questionNotes.list([
      Query.equal('userId', [currentUser.$id]),
      Query.equal('questionId', data.questionIds),
      Query.limit(100),
    ])

    return {
      noteIds: notes.rows.map((n) => n.questionId),
    }
  })
