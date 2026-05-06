import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import {
  StickyNote,
  Calendar,
  BookOpen,
  Search,
  Trash2,
  ExternalLink,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { getCurrentUserProfileFn } from '@/server/functions/users'
import { listUserNotesFn, deleteQuestionNoteFn } from '@/server/functions/notes'
import { useServerFn } from '@tanstack/react-start'
import type { QuestionNotes } from '@/server/lib/appwrite.types'

export const Route = createFileRoute('/_protected/dashboard/notes')({
  loader: async () => {
    const [profileResult, notesResult] = await Promise.all([
      getCurrentUserProfileFn(),
      listUserNotesFn().catch(() => ({ notes: [], total: 0 })),
    ])

    return {
      userProfile: profileResult.user,
      notes: notesResult.notes,
      totalNotes: notesResult.total,
    }
  },
  component: NotesPage,
})

function NotesPage() {
  const { userProfile, notes: initialNotes, totalNotes } = Route.useLoaderData()
  const deleteNote = useServerFn(deleteQuestionNoteFn)

  const [notes, setNotes] = useState<QuestionNotes[]>(initialNotes)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNote, setSelectedNote] = useState<QuestionNotes | null>(null)
  const [noteToDelete, setNoteToDelete] = useState<QuestionNotes | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filter notes based on search
  const filteredNotes = notes.filter((note) => {
    const query = searchQuery.toLowerCase()
    return (
      note.noteText.toLowerCase().includes(query) ||
      note.categoryName?.toLowerCase().includes(query) ||
      `q${note.questionNumber}`.includes(query) ||
      `question ${note.questionNumber}`.includes(query)
    )
  })

  // Format date and time
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!noteToDelete) return

    setIsDeleting(true)
    try {
      await deleteNote({ data: { noteId: noteToDelete.$id } })
      setNotes((prev) => prev.filter((n) => n.$id !== noteToDelete.$id))
      toast.success('Note deleted successfully')
      setNoteToDelete(null)
    } catch {
      toast.error('Failed to delete note')
    } finally {
      setIsDeleting(false)
    }
  }

  // Truncate text for preview
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1
                className="text-2xl font-semibold text-slate-900 dark:text-white mb-1"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                My Notes
              </h1>
              <p className="text-slate-600 dark:text-slate-300">
                {totalNotes} note{totalNotes !== 1 ? 's' : ''} saved across your
                practice sessions
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search notes by content, category, or question number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
        </motion.div>

        {/* Notes List */}
        {filteredNotes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <StickyNote className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Start adding notes to questions during your practice sessions to see them here.'}
            </p>
            {!searchQuery && (
              <Link
                to="/dashboard/practice"
                className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                Start Practicing
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map((note, index) => {
              const { date, time } = formatDateTime(note.$createdAt)

              return (
                <motion.div
                  key={note.$id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="group p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedNote(note)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Category and Question Info */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {note.categoryName && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                            <BookOpen className="w-3 h-3" />
                            {note.categoryName}
                          </span>
                        )}
                        {note.questionNumber && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium">
                            <FileText className="w-3 h-3" />Q
                            {note.questionNumber}
                          </span>
                        )}
                      </div>

                      {/* Note Preview */}
                      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed mb-3">
                        {truncateText(note.noteText, 200)}
                      </p>

                      {/* Date and Time */}
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {date}
                        </span>
                        <span>•</span>
                        <span>{time}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        onClick={(e) => {
                          e.stopPropagation()
                          setNoteToDelete(note)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* View Note Dialog */}
        <Dialog
          open={!!selectedNote}
          onOpenChange={() => setSelectedNote(null)}
        >
          <DialogContent className="w-[95vw] max-w-lg sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-amber-500" />
                Note Details
              </DialogTitle>
              <DialogDescription>
                {selectedNote?.categoryName && (
                  <span className="inline-flex items-center gap-1.5 mr-2">
                    <BookOpen className="w-3.5 h-3.5" />
                    {selectedNote.categoryName}
                  </span>
                )}
                {selectedNote?.questionNumber && (
                  <span className="inline-flex items-center gap-1.5">
                    • Question {selectedNote.questionNumber}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[50vh]">
              <div className="pr-4">
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedNote?.noteText}
                </p>
              </div>
            </ScrollArea>

            {selectedNote && (
              <div className="flex items-center justify-between pt-4 border-t dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Created: {formatDateTime(selectedNote.$createdAt).date} at{' '}
                  {formatDateTime(selectedNote.$createdAt).time}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    onClick={() => {
                      setSelectedNote(null)
                      setNoteToDelete(selectedNote)
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    Delete
                  </Button>
                  {selectedNote.poolNumber && (
                    <Link
                      to="/dashboard/practice"
                      search={{
                        question: selectedNote.questionId,
                        pool: String(selectedNote.poolNumber),
                      }}
                      onClick={() => setSelectedNote(null)}
                    >
                      <Button size="sm">
                        <ExternalLink className="w-4 h-4 mr-1.5" />
                        Go to Question
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!noteToDelete}
          onOpenChange={() => setNoteToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Note?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                note.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
