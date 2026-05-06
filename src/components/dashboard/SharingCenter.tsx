import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Users,
  Search,
  UserPlus,
  Check,
  X,
  Share2,
  Trash2,
  ChevronRight,
  Loader2,
  UserCheck,
  Clock,
  FileQuestion,
  Eye,
  ZoomIn,
  ShieldAlert,
  Info,
  Stethoscope,
  MessageSquare,
  User,
} from 'lucide-react'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  searchUsersFn,
  sendConnectionRequestFn,
  getConnectionsFn,
  getPendingConnectionsFn,
  respondToConnectionFn,
  removeConnectionFn,
  getSharedWithMeFn,
  getMySharedQuestionsFn,
  removeSharedQuestionFn,
  getSharedOsceTopicsWithMeFn,
  getMySharedOsceTopicsFn,
  removeSharedOsceTopicFn,
} from '@/server/functions/connections'
import { getQuestionImageUrlFn } from '@/server/functions/questions'
import type {
  UserConnections,
  SharedQuestions,
  Questions,
  OsceTopics,
} from '@/server/lib/appwrite.types'

interface SharedQuestionWithData extends SharedQuestions {
  question?: Questions | null
  categoryName?: string | null
}

interface SharedOsceTopicWithData extends SharedQuestions {
  osceTopic?: OsceTopics | null
  osceTitle?: string
  osceSpecialty?: string | null
  itemType: 'osce'
}

interface ConnectionWithInfo extends UserConnections {
  connectedUserId: string
  connectedUsername: string | null
}

interface Interaction {
  text: string
  reply: string
}

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'medical_student':
      return 'Medical Students'
    case 'intern':
      return 'Interns'
    case 'trainee_resident':
      return 'Trainee Residents'
    default:
      return category
  }
}

export function SharingCenter() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<
    Array<{
      $id: string
      username: string
      email: string
      accessCategory: string
    }>
  >([])
  const [isSearching, setIsSearching] = useState(false)
  const [connections, setConnections] = useState<ConnectionWithInfo[]>([])
  const [pendingConnections, setPendingConnections] = useState<
    UserConnections[]
  >([])
  const [sharedWithMe, setSharedWithMe] = useState<SharedQuestionWithData[]>([])
  const [mySharedQuestions, setMySharedQuestions] = useState<SharedQuestions[]>(
    [],
  )
  const [sharedOsceWithMe, setSharedOsceWithMe] = useState<
    SharedOsceTopicWithData[]
  >([])
  const [mySharedOsceTopics, setMySharedOsceTopics] = useState<
    SharedOsceTopicWithData[]
  >([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('connections')
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [selectedConnection, setSelectedConnection] =
    useState<ConnectionWithInfo | null>(null)

  // Question viewer state
  const [showQuestionDialog, setShowQuestionDialog] = useState(false)
  const [selectedQuestion, setSelectedQuestion] =
    useState<SharedQuestionWithData | null>(null)
  const [questionImageUrl, setQuestionImageUrl] = useState<string | null>(null)
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)

  // OSCE viewer state
  const [showOsceDialog, setShowOsceDialog] = useState(false)
  const [selectedOsceTopic, setSelectedOsceTopic] =
    useState<SharedOsceTopicWithData | null>(null)
  const [revealedInteractions, setRevealedInteractions] = useState<number[]>([])

  const searchUsers = useServerFn(searchUsersFn)
  const sendConnectionRequest = useServerFn(sendConnectionRequestFn)
  const getConnections = useServerFn(getConnectionsFn)
  const getPendingConnections = useServerFn(getPendingConnectionsFn)
  const respondToConnection = useServerFn(respondToConnectionFn)
  const removeConnection = useServerFn(removeConnectionFn)
  const getSharedWithMe = useServerFn(getSharedWithMeFn)
  const getMySharedQuestions = useServerFn(getMySharedQuestionsFn)
  const removeSharedQuestion = useServerFn(removeSharedQuestionFn)
  const getSharedOsceTopicsWithMe = useServerFn(getSharedOsceTopicsWithMeFn)
  const getMySharedOsceTopics = useServerFn(getMySharedOsceTopicsFn)
  const removeSharedOsceTopic = useServerFn(removeSharedOsceTopicFn)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [
        connectionsRes,
        pendingRes,
        sharedWithMeRes,
        mySharedRes,
        sharedOsceRes,
        myOsceRes,
      ] = await Promise.all([
        getConnections(),
        getPendingConnections(),
        getSharedWithMe(),
        getMySharedQuestions(),
        getSharedOsceTopicsWithMe(),
        getMySharedOsceTopics(),
      ])
      setConnections(connectionsRes.connections as ConnectionWithInfo[])
      setPendingConnections(pendingRes.connections)
      setSharedWithMe(
        sharedWithMeRes.sharedQuestions as SharedQuestionWithData[],
      )
      setMySharedQuestions(mySharedRes.sharedQuestions)
      setSharedOsceWithMe(
        sharedOsceRes.sharedOsceTopics as SharedOsceTopicWithData[],
      )
      setMySharedOsceTopics(
        myOsceRes.sharedOsceTopics as SharedOsceTopicWithData[],
      )
    } catch {
      console.error('Failed to load sharing data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const result = await searchUsers({ data: { query: searchQuery.trim() } })
      setSearchResults(result.users)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to search users'
      toast.error(message)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSendRequest = async (username: string) => {
    try {
      await sendConnectionRequest({ data: { receiverUsername: username } })
      toast.success(`Connection request sent to ${username}`)
      setSearchResults([])
      setSearchQuery('')
      void loadData()
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to send request'
      toast.error(message)
    }
  }

  const handleRespondToRequest = async (
    connectionId: string,
    accept: boolean,
  ) => {
    try {
      await respondToConnection({ data: { connectionId, accept } })
      toast.success(accept ? 'Connection accepted!' : 'Request declined')
      void loadData()
    } catch {
      toast.error('Failed to respond to request')
    }
  }

  const handleRemoveConnection = async () => {
    if (!selectedConnection) return
    try {
      await removeConnection({ data: { connectionId: selectedConnection.$id } })
      toast.success('Connection removed')
      setShowRemoveDialog(false)
      setSelectedConnection(null)
      void loadData()
    } catch {
      toast.error('Failed to remove connection')
    }
  }

  const handleRemoveSharedQuestion = async (sharedQuestionId: string) => {
    try {
      await removeSharedQuestion({ data: { sharedQuestionId } })
      toast.success('Shared question removed')
      void loadData()
    } catch {
      toast.error('Failed to remove shared question')
    }
  }

  const handleRemoveSharedOsceTopic = async (sharedOsceTopicId: string) => {
    try {
      await removeSharedOsceTopic({ data: { sharedOsceTopicId } })
      toast.success('Shared OSCE topic removed')
      void loadData()
    } catch {
      toast.error('Failed to remove shared OSCE topic')
    }
  }

  // View a shared question
  const handleViewQuestion = async (sharedQuestion: SharedQuestionWithData) => {
    setSelectedQuestion(sharedQuestion)
    setSelectedAnswer(null)
    setShowAnswer(false)
    setQuestionImageUrl(null)
    setShowQuestionDialog(true)

    // Load image if question has one
    const question = sharedQuestion.question
    if (question) {
      // Check for direct imageUrl first
      if (question.imageUrl) {
        setQuestionImageUrl(question.imageUrl)
      } else if (question.imageEmbed) {
        // Try to extract URL from embed
        const srcMatch = question.imageEmbed.match(/src=["']([^"']+)["']/)
        if (srcMatch) {
          setQuestionImageUrl(srcMatch[1])
        } else if (question.imageEmbed.startsWith('http')) {
          setQuestionImageUrl(question.imageEmbed.trim())
        }
      } else if (question.imageFileId) {
        // Fetch from storage
        setIsLoadingImage(true)
        try {
          const result = await getQuestionImageUrlFn({
            data: { fileId: question.imageFileId },
          })
          setQuestionImageUrl(result.fileUrl)
        } catch {
          console.error('Failed to load question image')
        } finally {
          setIsLoadingImage(false)
        }
      }
    }
  }

  // View a shared OSCE topic
  const handleViewOsceTopic = (sharedOsce: SharedOsceTopicWithData) => {
    setSelectedOsceTopic(sharedOsce)
    setRevealedInteractions([])
    setShowOsceDialog(true)
  }

  // Parse OSCE interactions
  const parseInteractions = (
    topic: OsceTopics | null | undefined,
  ): Interaction[] => {
    if (!topic?.interactions) return []
    try {
      return JSON.parse(topic.interactions)
    } catch {
      return []
    }
  }

  // Handle reveal interaction
  const handleRevealInteraction = (index: number) => {
    if (!revealedInteractions.includes(index)) {
      setRevealedInteractions((prev) => [...prev, index])
    }
  }

  const handleSelectAnswer = (key: string) => {
    if (!showAnswer) {
      setSelectedAnswer(key)
      setShowAnswer(true)
    }
  }

  const getOptionStyle = (key: string, correctAnswer: string) => {
    if (!showAnswer)
      return selectedAnswer === key
        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
    if (key === correctAnswer)
      return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-[0_0_0_1px_rgba(16,185,129,0.1)]'
    if (selectedAnswer === key)
      return 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
    return 'border-slate-200 dark:border-slate-700 opacity-50'
  }

  // Load data on mount
  useEffect(() => {
    void loadData()
  }, [])

  // Calculate total shared items count
  const totalSharedWithMe = sharedWithMe.length + sharedOsceWithMe.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2
            className="text-2xl font-semibold text-slate-900 dark:text-white"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            Sharing Center
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Connect with other users and share questions & OSCE topics
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadData()}
          disabled={isLoading}
          className="self-start sm:self-auto"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
        </Button>
      </div>

      {/* Search Users */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
      >
        <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Add Connection
        </h3>

        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleSearch()}
            className="flex-1"
          />
          <Button
            onClick={() => void handleSearch()}
            disabled={isSearching}
            className="w-full sm:w-auto"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Search Results */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-2"
            >
              {searchResults.map((user) => (
                <div
                  key={user.$id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-medium text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {user.username}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {getCategoryLabel(user.accessCategory)}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => void handleSendRequest(user.username)}
                    className="w-full sm:w-auto"
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Connect
                  </Button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* No results message */}
        {searchQuery && searchResults.length === 0 && !isSearching && (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 text-center py-4">
            No users found in your category matching "{searchQuery}"
          </p>
        )}
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4 bg-slate-100 dark:bg-slate-800">
          <TabsTrigger
            value="connections"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <Users className="w-3 h-4" />
            <span className="hidden sm:inline">Connections</span>
            <span className="sm:hidden">Connect</span>
            {connections.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-slate-200 dark:bg-slate-700 rounded-full">
                {connections.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <Clock className="w-3 h-4" />
            <span className="hidden sm:inline">Pending</span>
            <span className="sm:hidden">Pending</span>
            {pendingConnections.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-full">
                {pendingConnections.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="shared"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <Share2 className="w-3 h-4" />
            <span className="hidden sm:inline">Shared</span>
            <span className="sm:hidden">Shared</span>
            {totalSharedWithMe > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-full">
                {totalSharedWithMe}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Connections Tab */}
        <TabsContent value="connections">
          <div className="space-y-3">
            {connections.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No connections yet</p>
                <p className="text-sm">Search for users above to connect</p>
              </div>
            ) : (
              connections.map((connection) => (
                <motion.div
                  key={connection.$id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-medium">
                        {connection.connectedUsername
                          ?.charAt(0)
                          .toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {connection.connectedUsername}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        Connected
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedConnection(connection)
                      setShowRemoveDialog(true)
                    }}
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Pending Tab */}
        <TabsContent value="pending">
          <div className="space-y-3">
            {pendingConnections.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No pending requests</p>
              </div>
            ) : (
              pendingConnections.map((connection) => (
                <motion.div
                  key={connection.$id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-medium">
                        {connection.requesterUsername
                          ?.charAt(0)
                          .toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {connection.requesterUsername}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Wants to connect with you
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void handleRespondToRequest(connection.$id, false)
                      }
                      className="border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        void handleRespondToRequest(connection.$id, true)
                      }
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Shared Tab */}
        <TabsContent value="shared">
          <div className="space-y-6">
            {/* MCQ Questions shared with me */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <FileQuestion className="w-4 h-4" />
                MCQ Questions shared with me
              </h4>
              {sharedWithMe.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <FileQuestion className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No questions shared with you yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sharedWithMe.map((sq) => (
                    <div
                      key={sq.$id}
                      className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer"
                      onClick={() => void handleViewQuestion(sq)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2">
                            {sq.question?.questionText ||
                              'Question unavailable'}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>From: {sq.sharedByUsername}</span>
                            {sq.categoryName && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                {sq.categoryName}
                              </span>
                            )}
                            <span className="capitalize">
                              Permission: {sq.permission}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hidden sm:flex"
                            onClick={(e) => {
                              e.stopPropagation()
                              void handleViewQuestion(sq)
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* OSCE Topics shared with me */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                OSCE Topics shared with me
              </h4>
              {sharedOsceWithMe.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <Stethoscope className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No OSCE topics shared with you yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sharedOsceWithMe.map((so) => (
                    <div
                      key={so.$id}
                      className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer"
                      onClick={() => handleViewOsceTopic(so)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                            <Stethoscope className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {so.osceTopic?.title || 'Topic unavailable'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                              <Badge
                                variant="secondary"
                                className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs"
                              >
                                {so.osceTopic?.specialty || 'OSCE'}
                              </Badge>
                              <span>From: {so.sharedByUsername}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hidden sm:flex"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewOsceTopic(so)
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My shared questions */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Questions I've shared
              </h4>
              {mySharedQuestions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <Share2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">
                    You haven't shared any questions yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {mySharedQuestions.map((sq) => (
                    <div
                      key={sq.$id}
                      className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          Question #{sq.questionNumber}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Shared with: {sq.sharedWithUsername}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleRemoveSharedQuestion(sq.$id)}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My shared OSCE topics */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                OSCE Topics I've shared
              </h4>
              {mySharedOsceTopics.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <Share2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">
                    You haven't shared any OSCE topics yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {mySharedOsceTopics.map((so) => (
                    <div
                      key={so.$id}
                      className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <Stethoscope className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {so.osceTitle || 'OSCE Topic'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Shared with: {so.sharedWithUsername}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleRemoveSharedOsceTopic(so.$id)}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Remove Connection Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Connection</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{' '}
              {selectedConnection?.connectedUsername} from your connections?
              This will also remove any shared questions between you.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowRemoveDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleRemoveConnection()}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Shared Question Dialog */}
      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-blue-600" />
              Shared Question
            </DialogTitle>
            <DialogDescription>
              Shared by {selectedQuestion?.sharedByUsername}
              {selectedQuestion?.categoryName && (
                <> • {selectedQuestion.categoryName}</>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedQuestion?.question ? (
            <div className="py-4 space-y-4">
              {/* Question Image */}
              {isLoadingImage && (
                <div className="w-full flex justify-center items-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-8">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-sm">Loading image...</span>
                  </div>
                </div>
              )}
              {questionImageUrl && !isLoadingImage && (
                <div
                  className="w-full flex justify-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-2 overflow-hidden cursor-pointer group relative"
                  onClick={() => setShowImageDialog(true)}
                >
                  <img
                    src={questionImageUrl}
                    alt="Question visual"
                    className="max-w-full h-auto max-h-[200px] object-contain rounded-lg shadow-sm transition-transform group-hover:scale-[1.02]"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-800/90 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                      <ZoomIn className="w-4 h-4" />
                      Click to expand
                    </div>
                  </div>
                </div>
              )}

              {/* Question Text */}
              <p className="text-base text-slate-900 dark:text-white font-medium leading-relaxed">
                {selectedQuestion.question.questionText}
              </p>

              {/* Options */}
              <div className="space-y-2">
                {[
                  { key: 'A', text: selectedQuestion.question.optionA },
                  { key: 'B', text: selectedQuestion.question.optionB },
                  { key: 'C', text: selectedQuestion.question.optionC },
                  { key: 'D', text: selectedQuestion.question.optionD },
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => handleSelectAnswer(option.key)}
                    disabled={showAnswer}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${getOptionStyle(option.key, selectedQuestion.question!.correctAnswer)}`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0 ${
                          selectedAnswer === option.key
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-700'
                        } ${showAnswer && option.key === selectedQuestion.question!.correctAnswer ? 'bg-emerald-500 text-white' : ''}`}
                      >
                        {option.key}
                      </span>
                      <span className="flex-1 text-slate-700 dark:text-slate-200 text-sm">
                        {option.text}
                      </span>
                      {showAnswer &&
                        option.key ===
                          selectedQuestion.question!.correctAnswer && (
                          <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                        )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Explanation */}
              {showAnswer && selectedQuestion.question.explanation && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                    <div className="flex items-center gap-2 mb-2 text-amber-800 dark:text-amber-300 font-semibold text-sm">
                      <Info className="w-4 h-4" />
                      <span>Explanation</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                      {selectedQuestion.question.explanation}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Show Answer Button */}
              {!showAnswer && (
                <Button
                  variant="outline"
                  onClick={() => setShowAnswer(true)}
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Show Answer
                </Button>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400">
              <FileQuestion className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Question data is unavailable</p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowQuestionDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Shared OSCE Topic Dialog */}
      <Dialog open={showOsceDialog} onOpenChange={setShowOsceDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-emerald-600" />
              Shared OSCE Topic
            </DialogTitle>
            <DialogDescription>
              Shared by {selectedOsceTopic?.sharedByUsername}
            </DialogDescription>
          </DialogHeader>

          {selectedOsceTopic?.osceTopic ? (
            <div className="py-4 space-y-4">
              {/* Topic Header */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <Stethoscope className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <Badge
                    variant="secondary"
                    className="mb-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                  >
                    {selectedOsceTopic.osceTopic.specialty}
                  </Badge>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {selectedOsceTopic.osceTopic.title}
                  </h3>
                </div>
              </div>

              {/* Scenario */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Clinical Scenario
                </h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">
                  {selectedOsceTopic.osceTopic.scenario}
                </p>
                {selectedOsceTopic.osceTopic.scenarioImageUrl && (
                  <div className="mt-3">
                    <img
                      src={selectedOsceTopic.osceTopic.scenarioImageUrl}
                      alt="Scenario"
                      className="rounded-lg max-w-full h-auto border border-slate-200 dark:border-slate-600"
                    />
                  </div>
                )}
              </div>

              {/* Interactions */}
              {parseInteractions(selectedOsceTopic.osceTopic).length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                    Patient Interactions (
                    {parseInteractions(selectedOsceTopic.osceTopic).length})
                  </h4>
                  <div className="space-y-3">
                    {parseInteractions(selectedOsceTopic.osceTopic).map(
                      (interaction, index) => (
                        <div
                          key={index}
                          className="border border-slate-200/50 dark:border-slate-700/50 rounded-xl overflow-hidden bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                        >
                          {/* Question */}
                          <div className="p-3 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white">
                            <div className="flex items-start gap-2">
                              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                <User className="w-3 h-3" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-slate-400 mb-0.5">
                                  You ask:
                                </p>
                                <p className="text-sm text-white">
                                  {interaction.text}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Response */}
                          <div className="p-3">
                            {revealedInteractions.includes(index) ? (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-start gap-2"
                              >
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/50 dark:to-emerald-900/50 flex items-center justify-center flex-shrink-0">
                                  <MessageSquare className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs text-slate-400 mb-0.5">
                                    Patient responds:
                                  </p>
                                  <p className="text-sm text-slate-700 dark:text-slate-300">
                                    {interaction.reply}
                                  </p>
                                </div>
                              </motion.div>
                            ) : (
                              <button
                                onClick={() => handleRevealInteraction(index)}
                                className="w-full group relative overflow-hidden rounded-lg bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-cyan-500/10 dark:from-teal-500/20 dark:via-emerald-500/20 dark:to-cyan-500/20 border border-teal-200/50 dark:border-teal-700/50 p-2.5 transition-all hover:from-teal-500/20 hover:via-emerald-500/20 hover:to-cyan-500/20 dark:hover:from-teal-500/30 dark:hover:via-emerald-500/30 dark:hover:to-cyan-500/30 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-lg hover:shadow-teal-500/10 active:scale-[0.98]"
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <Eye className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                  <span className="text-xs font-medium text-teal-700 dark:text-teal-300">
                                    Reveal Response
                                  </span>
                                </div>
                              </button>
                            )}
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  {/* Reveal All Button */}
                  {revealedInteractions.length <
                    parseInteractions(selectedOsceTopic.osceTopic).length && (
                    <button
                      onClick={() =>
                        setRevealedInteractions(
                          parseInteractions(selectedOsceTopic.osceTopic!).map(
                            (_, i) => i,
                          ),
                        )
                      }
                      className="w-full mt-3 group relative overflow-hidden rounded-lg bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 transition-all hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md active:scale-[0.99]"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          Reveal All Responses
                        </span>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400">
              <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>OSCE topic data is unavailable</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOsceDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Expand Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="sm:max-w-[90vw] max-h-[90vh] p-0 bg-slate-950 border-slate-800">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <button
              onClick={() => setShowImageDialog(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            {questionImageUrl && (
              <img
                src={questionImageUrl}
                alt="Question visual - expanded"
                className="max-w-full max-h-[80vh] object-contain rounded-lg select-none"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                style={{ pointerEvents: 'none' }}
              />
            )}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-white/10 text-white/70 text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Image saving is disabled
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
