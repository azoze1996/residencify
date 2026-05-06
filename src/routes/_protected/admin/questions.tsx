import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import {
  FileQuestion,
  Plus,
  Search,
  Edit2,
  Trash2,
  Upload,
  Filter,
  Image,
  X,
  Link,
  Loader2,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { getCurrentUserProfileFn } from '@/server/functions/users'
import {
  listAllQuestionsFn,
  createQuestionFn,
  updateQuestionFn,
  deleteQuestionFn,
  bulkCreateQuestionsFn,
  getPoolNumbersFn,
  uploadQuestionImageFn,
  deleteQuestionImageFn,
} from '@/server/functions/questions'
import type { Questions } from '@/server/lib/appwrite.types'

// Add a type for pool data
type PoolData = { poolNumber: number; count: number }

export const Route = createFileRoute('/_protected/admin/questions')({
  loader: async () => {
    const [profileResult, questionsResult, poolsResult] = await Promise.all([
      getCurrentUserProfileFn(),
      listAllQuestionsFn().catch(() => ({ questions: [] })),
      getPoolNumbersFn().catch(() => ({ pools: [] })),
    ])

    return {
      userProfile: profileResult.user,
      questions: questionsResult.questions,
      pools: poolsResult.pools,
    }
  },
  component: AdminQuestionsPage,
})

function AdminQuestionsPage() {
  const {
    userProfile,
    questions: initialQuestions,
    pools: initialPools,
  } = Route.useLoaderData()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPool, setFilterPool] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<Questions | null>(
    null,
  )
  const [imagePreviewError, setImagePreviewError] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    questionNumber: '',
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A' as 'A' | 'B' | 'C' | 'D',
    poolNumber: '',
    explanation: '',
    imageUrl: '',
    imageFileId: '',
  })

  // Bulk form state
  const [bulkData, setBulkData] = useState({
    poolNumber: '',
    questionsText: '',
  })

  const listQuestions = useServerFn(listAllQuestionsFn)
  const createQuestion = useServerFn(createQuestionFn)
  const updateQuestion = useServerFn(updateQuestionFn)
  const deleteQuestion = useServerFn(deleteQuestionFn)
  const bulkCreateQuestions = useServerFn(bulkCreateQuestionsFn)
  const getPools = useServerFn(getPoolNumbersFn)
  const uploadQuestionImage = useServerFn(uploadQuestionImageFn)
  const deleteQuestionImage = useServerFn(deleteQuestionImageFn)

  const { data: questionsData, refetch } = useQuery({
    queryKey: ['admin-questions'],
    queryFn: () => listQuestions(),
    initialData: { questions: initialQuestions },
  })

  const { data: poolsData, refetch: refetchPools } = useQuery({
    queryKey: ['admin-pools'],
    queryFn: () => getPools(),
    initialData: { pools: initialPools },
  })

  const createQuestionMutation = useMutation({
    mutationFn: async () => {
      return await createQuestion({
        data: {
          questionNumber: parseInt(formData.questionNumber),
          questionText: formData.questionText,
          optionA: formData.optionA,
          optionB: formData.optionB,
          optionC: formData.optionC,
          optionD: formData.optionD,
          correctAnswer: formData.correctAnswer,
          hasImage: !!formData.imageUrl,
          imageFileId: formData.imageFileId || null,
          imageUrl: formData.imageUrl || null,
          poolNumber: parseInt(formData.poolNumber),
          explanation: formData.explanation || null,
        },
      })
    },
    onSuccess: () => {
      toast.success('Question created successfully')
      setShowCreateDialog(false)
      resetForm()
      void refetch()
      void refetchPools()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create question')
    },
  })

  const updateQuestionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedQuestion) return

      return await updateQuestion({
        data: {
          id: selectedQuestion.$id,
          questionNumber: formData.questionNumber
            ? parseInt(formData.questionNumber)
            : undefined,
          questionText: formData.questionText || undefined,
          optionA: formData.optionA || undefined,
          optionB: formData.optionB || undefined,
          optionC: formData.optionC || undefined,
          optionD: formData.optionD || undefined,
          correctAnswer: formData.correctAnswer,
          hasImage: !!formData.imageUrl,
          imageFileId: formData.imageFileId || null,
          imageUrl: formData.imageUrl || null,
          poolNumber: formData.poolNumber
            ? parseInt(formData.poolNumber)
            : undefined,
          explanation: formData.explanation || null,
        },
      })
    },
    onSuccess: () => {
      toast.success('Question updated successfully')
      setShowEditDialog(false)
      setSelectedQuestion(null)
      resetForm()
      void refetch()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update question')
    },
  })

  const deleteQuestionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedQuestion) return
      return await deleteQuestion({ data: { id: selectedQuestion.$id } })
    },
    onSuccess: () => {
      toast.success('Question deleted successfully')
      setShowDeleteDialog(false)
      setSelectedQuestion(null)
      void refetch()
      void refetchPools()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete question')
    },
  })

  const bulkCreateMutation = useMutation({
    mutationFn: async () => {
      return await bulkCreateQuestions({
        data: {
          poolNumber: parseInt(bulkData.poolNumber),
          questionsText: bulkData.questionsText,
        },
      })
    },
    onSuccess: (data) => {
      toast.success(`${data.count} questions created successfully`)
      setShowBulkDialog(false)
      setBulkData({ poolNumber: '', questionsText: '' })
      void refetch()
      void refetchPools()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create questions')
    },
  })

  const resetForm = () => {
    setFormData({
      questionNumber: '',
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      poolNumber: '',
      explanation: '',
      imageUrl: '',
      imageFileId: '',
    })
  }

  const handleImageUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setIsUploadingImage(true)
    setImagePreviewError(false)

    try {
      // Convert file to base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const base64Data = await base64Promise

      // Upload to server
      const result = await uploadQuestionImage({
        data: {
          base64Data,
          fileName: file.name,
          mimeType: file.type,
        },
      })

      // Update form with the new image URL and file ID
      setFormData((prev) => ({
        ...prev,
        imageUrl: result.fileUrl,
        imageFileId: result.fileId,
      }))

      toast.success('Image uploaded successfully')
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Failed to upload image')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleRemoveImage = async () => {
    // If there's a file ID, delete it from storage
    if (formData.imageFileId) {
      try {
        await deleteQuestionImage({ data: { fileId: formData.imageFileId } })
      } catch {
        // Ignore errors - file might not exist
      }
    }

    setFormData((prev) => ({
      ...prev,
      imageUrl: '',
      imageFileId: '',
    }))
    setImagePreviewError(false)
  }

  const openEditDialog = (question: Questions) => {
    setSelectedQuestion(question)
    setFormData({
      questionNumber: question.questionNumber.toString(),
      questionText: question.questionText,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctAnswer: question.correctAnswer as 'A' | 'B' | 'C' | 'D',
      poolNumber: question.poolNumber.toString(),
      explanation: question.explanation || '',
      imageUrl: question.imageUrl || '',
      imageFileId: question.imageFileId || '',
    })
    setShowEditDialog(true)
  }

  const filteredQuestions = questionsData.questions.filter(
    (question: Questions) => {
      const matchesSearch =
        question.questionText
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        question.questionNumber.toString().includes(searchQuery)

      const matchesPool =
        filterPool === 'all' || question.poolNumber.toString() === filterPool

      return matchesSearch && matchesPool
    },
  )

  return (
    <AdminLayout userProfile={userProfile}>
      <div className="max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1
              className="text-3xl font-semibold text-white mb-2"
              style={{ fontFamily: '"Instrument Sans", sans-serif' }}
            >
              Questions Management
            </h1>
            <p className="text-stone-400">
              Manage MCQ questions across different pools.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowBulkDialog(true)}
              variant="outline"
              className="gap-2 border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              <Upload className="w-4 h-4" />
              Bulk Import
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </Button>
          </div>
        </motion.div>

        {/* Pool Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap gap-3 mb-6"
        >
          {poolsData.pools.map((pool: PoolData) => (
            <div
              key={pool.poolNumber}
              className="px-4 py-2 rounded-xl bg-stone-900 border border-stone-800"
            >
              <span className="text-sm text-stone-400">
                Pool {pool.poolNumber}:
              </span>
              <span className="ml-2 text-sm font-medium text-white">
                {pool.count} questions
              </span>
            </div>
          ))}
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex gap-4 mb-6"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions..."
              className="pl-10 bg-stone-900 border-stone-800 text-white placeholder:text-stone-500"
            />
          </div>
          <div className="w-48">
            <Select value={filterPool} onValueChange={setFilterPool}>
              <SelectTrigger className="bg-stone-900 border-stone-800 text-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by pool" />
              </SelectTrigger>
              <SelectContent className="bg-stone-800 border-stone-700">
                <SelectItem value="all">All Pools</SelectItem>
                {poolsData.pools.map((pool: PoolData) => (
                  <SelectItem
                    key={pool.poolNumber}
                    value={pool.poolNumber.toString()}
                  >
                    Pool {pool.poolNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Questions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-4"
        >
          {filteredQuestions.slice(0, 50).map((question: Questions) => {
            const imageUrl = question.imageUrl
            return (
              <div
                key={question.$id}
                className="p-5 rounded-2xl bg-stone-900 border border-stone-800"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-2 py-1 rounded-lg bg-violet-500/10 text-violet-400 text-xs font-medium">
                        Q{question.questionNumber}
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-stone-800 text-stone-400 text-xs">
                        Pool {question.poolNumber}
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                        Answer: {question.correctAnswer}
                      </span>
                      {imageUrl && (
                        <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium flex items-center gap-1">
                          <Image className="w-3 h-3" />
                          Has Image
                        </span>
                      )}
                    </div>

                    {/* Display embedded image above question text */}
                    {imageUrl && (
                      <div className="mb-4 p-3 rounded-xl bg-stone-800/50 border border-stone-700">
                        <img
                          src={imageUrl}
                          alt="Question image"
                          className="max-w-full h-auto max-h-[300px] object-contain rounded-lg mx-auto"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display =
                              'none'
                          }}
                        />
                      </div>
                    )}

                    <p className="text-white mb-4">{question.questionText}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['A', 'B', 'C', 'D'].map((opt) => {
                        const optionKey = `option${opt}` as keyof Questions
                        const isCorrect = question.correctAnswer === opt
                        return (
                          <div
                            key={opt}
                            className={`p-3 rounded-lg text-sm ${
                              isCorrect
                                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                                : 'bg-stone-800/50 text-stone-400'
                            }`}
                          >
                            <span className="font-medium">{opt}.</span>{' '}
                            {question[optionKey] as string}
                          </div>
                        )
                      })}
                    </div>
                    {question.explanation && (
                      <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-xs font-medium text-amber-400 mb-1">
                          Explanation
                        </p>
                        <p className="text-sm text-amber-200/80">
                          {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(question)}
                      className="text-stone-400 hover:text-white hover:bg-stone-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedQuestion(question)
                        setShowDeleteDialog(true)
                      }}
                      className="text-stone-400 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}

          {filteredQuestions.length === 0 && (
            <div className="text-center py-16 rounded-2xl bg-stone-900 border border-stone-800">
              <FileQuestion className="w-12 h-12 text-stone-600 mx-auto mb-3" />
              <p className="text-stone-500">No questions found</p>
            </div>
          )}

          {filteredQuestions.length > 50 && (
            <p className="text-center text-stone-500 text-sm">
              Showing 50 of {filteredQuestions.length} questions. Use search to
              find specific questions.
            </p>
          )}
        </motion.div>
      </div>

      {/* Create Question Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-stone-900 border-stone-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Question</DialogTitle>
            <DialogDescription className="text-stone-400">
              Add a new MCQ question to the pool.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-stone-300">Question Number</Label>
                <Input
                  type="number"
                  value={formData.questionNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, questionNumber: e.target.value })
                  }
                  placeholder="1"
                  className="mt-1.5 bg-stone-800 border-stone-700 text-white"
                />
              </div>
              <div>
                <Label className="text-stone-300">Pool Number</Label>
                <Input
                  type="number"
                  value={formData.poolNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, poolNumber: e.target.value })
                  }
                  placeholder="1"
                  className="mt-1.5 bg-stone-800 border-stone-700 text-white"
                />
              </div>
            </div>

            {/* Image URL Field */}
            <div>
              <Label className="text-stone-300 flex items-center gap-2">
                <Image className="w-4 h-4" />
                Question Image (Optional)
              </Label>

              {/* File Upload Section */}
              <div className="mt-2 space-y-3">
                {!formData.imageUrl && (
                  <div className="flex items-center gap-3">
                    <label className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) void handleImageUpload(file)
                        }}
                        className="hidden"
                        disabled={isUploadingImage}
                      />
                      <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-stone-700 bg-stone-800/50 hover:bg-stone-800 hover:border-stone-600 cursor-pointer transition-colors">
                        {isUploadingImage ? (
                          <>
                            <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                            <span className="text-sm text-stone-400">
                              Uploading...
                            </span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-stone-400" />
                            <span className="text-sm text-stone-400">
                              Click to upload image
                            </span>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                )}

                {/* Or use URL */}
                {!formData.imageUrl && !isUploadingImage && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-stone-700" />
                    <span className="text-xs text-stone-500">or paste URL</span>
                    <div className="flex-1 h-px bg-stone-700" />
                  </div>
                )}

                {!formData.imageUrl && !isUploadingImage && (
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                    <Input
                      value={formData.imageUrl}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          imageUrl: e.target.value,
                          imageFileId: '',
                        })
                        setImagePreviewError(false)
                      }}
                      placeholder="https://example.com/image.jpg"
                      className="pl-10 bg-stone-800 border-stone-700 text-white"
                    />
                  </div>
                )}

                {/* Image Preview */}
                {formData.imageUrl && !imagePreviewError && (
                  <div className="relative p-3 rounded-xl bg-stone-800 border border-stone-700">
                    <button
                      type="button"
                      onClick={() => void handleRemoveImage()}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-stone-900/80 hover:bg-red-500/20 text-stone-400 hover:text-red-400 transition-colors z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-stone-400 mb-2 flex items-center gap-1">
                      <Image className="w-3 h-3" />
                      Preview:
                      {formData.imageFileId && (
                        <span className="ml-1 px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 text-[10px]">
                          Uploaded
                        </span>
                      )}
                    </p>
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="max-w-full h-auto max-h-[200px] object-contain rounded-lg mx-auto"
                      onError={() => setImagePreviewError(true)}
                    />
                  </div>
                )}

                {imagePreviewError && formData.imageUrl && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <span className="text-red-400 text-xs">
                      Failed to load image. Please check the URL.
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleRemoveImage()}
                      className="p-1 rounded hover:bg-red-500/20 text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="text-stone-300">Question Text</Label>
              <Textarea
                value={formData.questionText}
                onChange={(e) =>
                  setFormData({ ...formData, questionText: e.target.value })
                }
                placeholder="Enter the question..."
                rows={3}
                className="mt-1.5 bg-stone-800 border-stone-700 text-white resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-stone-300">Option A</Label>
                <Input
                  value={formData.optionA}
                  onChange={(e) =>
                    setFormData({ ...formData, optionA: e.target.value })
                  }
                  className="mt-1.5 bg-stone-800 border-stone-700 text-white"
                />
              </div>
              <div>
                <Label className="text-stone-300">Option B</Label>
                <Input
                  value={formData.optionB}
                  onChange={(e) =>
                    setFormData({ ...formData, optionB: e.target.value })
                  }
                  className="mt-1.5 bg-stone-800 border-stone-700 text-white"
                />
              </div>
              <div>
                <Label className="text-stone-300">Option C</Label>
                <Input
                  value={formData.optionC}
                  onChange={(e) =>
                    setFormData({ ...formData, optionC: e.target.value })
                  }
                  className="mt-1.5 bg-stone-800 border-stone-700 text-white"
                />
              </div>
              <div>
                <Label className="text-stone-300">Option D</Label>
                <Input
                  value={formData.optionD}
                  onChange={(e) =>
                    setFormData({ ...formData, optionD: e.target.value })
                  }
                  className="mt-1.5 bg-stone-800 border-stone-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-stone-300">Correct Answer</Label>
              <Select
                value={formData.correctAnswer}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    correctAnswer: v as 'A' | 'B' | 'C' | 'D',
                  })
                }
              >
                <SelectTrigger className="mt-1.5 bg-stone-800 border-stone-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-stone-800 border-stone-700">
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-stone-300">Explanation (Optional)</Label>
              <Textarea
                value={formData.explanation}
                onChange={(e) =>
                  setFormData({ ...formData, explanation: e.target.value })
                }
                placeholder="Explain the correct answer..."
                rows={2}
                className="mt-1.5 bg-stone-800 border-stone-700 text-white resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                resetForm()
              }}
              className="border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => createQuestionMutation.mutate()}
              disabled={
                createQuestionMutation.isPending ||
                !formData.questionText ||
                !formData.optionA ||
                !formData.optionB ||
                !formData.optionC ||
                !formData.optionD ||
                !formData.poolNumber
              }
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600"
            >
              {createQuestionMutation.isPending
                ? 'Creating...'
                : 'Create Question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-stone-900 border-stone-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription className="text-stone-400">
              Update question information.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-stone-300">Question Number</Label>
                <Input
                  type="number"
                  value={formData.questionNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, questionNumber: e.target.value })
                  }
                  className="mt-1.5 bg-stone-800 border-stone-700 text-white"
                />
              </div>
              <div>
                <Label className="text-stone-300">Pool Number</Label>
                <Input
                  type="number"
                  value={formData.poolNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, poolNumber: e.target.value })
                  }
                  className="mt-1.5 bg-stone-800 border-stone-700 text-white"
                />
              </div>
            </div>

            {/* Image URL Field */}
            <div>
              <Label className="text-stone-300 flex items-center gap-2">
                <Link className="w-4 h-4" />
                Image URL
              </Label>
              <div className="mt-1.5 relative">
                <Input
                  value={formData.imageUrl}
                  onChange={(e) => {
                    setFormData({ ...formData, imageUrl: e.target.value })
                    setImagePreviewError(false)
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="bg-stone-800 border-stone-700 text-white pr-10"
                />
                {formData.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, imageUrl: '' })}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-stone-700 text-stone-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Paste a direct image URL. The image will appear above the
                question text and can be expanded by users (but not saved).
              </p>
              {formData.imageUrl && !imagePreviewError && (
                <div className="mt-3 p-3 rounded-xl bg-stone-800 border border-stone-700">
                  <p className="text-xs text-stone-400 mb-2 flex items-center gap-1">
                    <Image className="w-3 h-3" />
                    Preview:
                  </p>
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="max-w-full h-auto max-h-[200px] object-contain rounded-lg mx-auto"
                    onError={() => setImagePreviewError(true)}
                  />
                </div>
              )}
              {imagePreviewError && formData.imageUrl && (
                <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  Failed to load image. Please check the URL.
                </div>
              )}
            </div>

            <div>
              <Label className="text-stone-300">Question Text</Label>
              <Textarea
                value={formData.questionText}
                onChange={(e) =>
                  setFormData({ ...formData, questionText: e.target.value })
                }
                rows={3}
                className="mt-1.5 bg-stone-800 border-stone-700 text-white resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-stone-300">Option A</Label>
                <Input
                  value={formData.optionA}
                  onChange={(e) =>
                    setFormData({ ...formData, optionA: e.target.value })
                  }
                  className="mt-1.5 bg-stone-800 border-stone-700 text-white"
                />
              </div>
              <div>
                <Label className="text-stone-300">Option B</Label>
                <Input
                  value={formData.optionB}
                  onChange={(e) =>
                    setFormData({ ...formData, optionB: e.target.value })
                  }
                  className="mt-1.5 bg-stone-800 border-stone-700 text-white"
                />
              </div>
              <div>
                <Label className="text-stone-300">Option C</Label>
                <Input
                  value={formData.optionC}
                  onChange={(e) =>
                    setFormData({ ...formData, optionC: e.target.value })
                  }
                  className="mt-1.5 bg-stone-800 border-stone-700 text-white"
                />
              </div>
              <div>
                <Label className="text-stone-300">Option D</Label>
                <Input
                  value={formData.optionD}
                  onChange={(e) =>
                    setFormData({ ...formData, optionD: e.target.value })
                  }
                  className="mt-1.5 bg-stone-800 border-stone-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-stone-300">Correct Answer</Label>
              <Select
                value={formData.correctAnswer}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    correctAnswer: v as 'A' | 'B' | 'C' | 'D',
                  })
                }
              >
                <SelectTrigger className="mt-1.5 bg-stone-800 border-stone-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-stone-800 border-stone-700">
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-stone-300">Explanation</Label>
              <Textarea
                value={formData.explanation}
                onChange={(e) =>
                  setFormData({ ...formData, explanation: e.target.value })
                }
                rows={2}
                className="mt-1.5 bg-stone-800 border-stone-700 text-white resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false)
                setSelectedQuestion(null)
                resetForm()
              }}
              className="border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateQuestionMutation.mutate()}
              disabled={updateQuestionMutation.isPending}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600"
            >
              {updateQuestionMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="bg-stone-900 border-stone-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Import Questions</DialogTitle>
            <DialogDescription className="text-stone-400">
              Paste multiple questions in the format below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-stone-300">Pool Number</Label>
              <Input
                type="number"
                value={bulkData.poolNumber}
                onChange={(e) =>
                  setBulkData({ ...bulkData, poolNumber: e.target.value })
                }
                placeholder="1"
                className="mt-1.5 bg-stone-800 border-stone-700 text-white"
              />
            </div>

            <div>
              <Label className="text-stone-300">Questions Text</Label>
              <Textarea
                value={bulkData.questionsText}
                onChange={(e) =>
                  setBulkData({ ...bulkData, questionsText: e.target.value })
                }
                placeholder={`Q1. Question text here
A. Option A
B. Option B
C. Option C
D. Option D
Answer: A

Q2. Another question
A. Option A
B. Option B
C. Option C
D. Option D
Answer: B`}
                rows={12}
                className="mt-1.5 bg-stone-800 border-stone-700 text-white resize-none font-mono text-sm"
              />
            </div>

            <div className="p-3 rounded-lg bg-stone-800/50 text-xs text-stone-400">
              <p className="font-medium mb-1">Format:</p>
              <p>Q1. Question text</p>
              <p>A. Option A</p>
              <p>B. Option B</p>
              <p>C. Option C</p>
              <p>D. Option D</p>
              <p>Answer: A</p>
              <p className="mt-1">(Blank line between questions)</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkDialog(false)
                setBulkData({ poolNumber: '', questionsText: '' })
              }}
              className="border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => bulkCreateMutation.mutate()}
              disabled={
                bulkCreateMutation.isPending ||
                !bulkData.poolNumber ||
                !bulkData.questionsText
              }
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600"
            >
              {bulkCreateMutation.isPending
                ? 'Importing...'
                : 'Import Questions'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-stone-900 border-stone-800 text-white">
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription className="text-stone-400">
              Are you sure you want to delete this question? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setSelectedQuestion(null)
              }}
              className="border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteQuestionMutation.mutate()}
              disabled={deleteQuestionMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteQuestionMutation.isPending
                ? 'Deleting...'
                : 'Delete Question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
