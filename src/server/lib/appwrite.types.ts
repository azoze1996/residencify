import { type Models } from 'node-appwrite'

export type Users = Models.Row & {
  createdBy: string
  username: string
  email: string
  planType: string
  planDuration: string
  startDate: string
  endDate: string
  accessCategory: string
  isActive: boolean
  isAdmin: boolean
  authUserId: string
  deviceIds: string[] | null
  lastDeviceId: string | null
  accessLevel: string | null
  isInstructor: boolean
  maxStudents: number | null
  instructorId: string | null
}

export type Plans = Models.Row & {
  createdBy: string
  name: string
  duration: string
  durationMonths: number
  priceSAR: number
  priceUSD: number
  isActive: boolean
  description: string | null
  targetCategory: string | null
  planType: string | null
  allowedPools: number[] | null
  maxQuestions: number | null
  accessLevel: string | null
  features: string[] | null
}

export type Questions = Models.Row & {
  createdBy: string
  questionNumber: number
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  hasImage: boolean
  imageFileId: string | null
  poolNumber: number
  explanation: string | null
  questionType: string | null
  imageUrl: string | null
  imageEmbed: string | null
}

export type Categories = Models.Row & {
  createdBy: string
  name: string
  domain: string
  parentId: string | null
  poolNumbers: number[] | null
  order: number | null
  description: string | null
  isActive: boolean
}

export type UserSessions = Models.Row & {
  createdBy: string
  userId: string
  categoryId: string
  lastQuestionIndex: number
  answeredQuestions: string[] | null
  useTimer: boolean
  elapsedTime: number | null
  poolNumber: number | null
  totalQuestions: number | null
  isCompleted: boolean
}

export type Feedback = Models.Row & {
  createdBy: string
  userId: string
  questionId: string
  feedbackText: string
  status: string | null
  adminResponse: string | null
  questionNumber: number | null
  userName: string | null
  poolNumber: number | null
  userEmail: string | null
}

export type SupportTickets = Models.Row & {
  createdBy: string
  userId: string
  subject: string
  message: string
  status: string | null
  adminResponse: string | null
  priority: string | null
  userEmail: string | null
  userName: string | null
  autoReply: string | null
}

export type Notifications = Models.Row & {
  createdBy: string
  title: string
  message: string
  type: string
  targetType: string
  targetCategory: string | null
  targetUserId: string | null
  relatedId: string | null
  isRead: boolean
}

export type UserNotifications = Models.Row & {
  createdBy: string
  userId: string
  notificationId: string
  isRead: boolean
  readAt: string | null
}

export type UserConnections = Models.Row & {
  createdBy: string
  requesterId: string
  receiverId: string
  status: string
  requesterUsername: string | null
  receiverUsername: string | null
}

export type SharedQuestions = Models.Row & {
  createdBy: string
  questionId: string
  sharedById: string
  sharedWithId: string
  sharedByUsername: string | null
  sharedWithUsername: string | null
  permission: string
  questionNumber: number | null
  poolNumber: number | null
}

export type FlaggedQuestions = Models.Row & {
  createdBy: string
  userId: string
  questionId: string
  sessionId: string | null
  questionNumber: number | null
  poolNumber: number | null
  note: string | null
}

export type InstructorQuizzes = Models.Row & {
  createdBy: string
  instructorId: string
  title: string
  description: string | null
  categoryId: string | null
  timerMinutes: number | null
  passingScore: number | null
  allowRetake: boolean
  maxRetakes: number | null
  isActive: boolean
  totalQuestions: number | null
  shuffleQuestions: boolean
  showResults: boolean
  publishedAt: string | null
  resultsPublished: boolean
  totalPoints: number | null
}

export type InstructorQuestions = Models.Row & {
  createdBy: string
  instructorId: string
  quizId: string
  questionNumber: number
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  explanation: string | null
  imageUrl: string | null
  points: number | null
}

export type InstructorStudents = Models.Row & {
  createdBy: string
  instructorId: string
  studentId: string
  studentUsername: string | null
  studentEmail: string | null
  status: string
  joinedAt: string | null
}

export type QuizAttempts = Models.Row & {
  createdBy: string
  quizId: string
  studentId: string
  instructorId: string
  studentUsername: string | null
  score: number | null
  totalPoints: number | null
  percentage: number | null
  passed: boolean
  timeTakenSeconds: number | null
  attemptNumber: number | null
  startedAt: string | null
  completedAt: string | null
  status: string
  answers: string | null
  flaggedQuestions: string[] | null
  currentQuestionIndex: number | null
  questionResults: string | null
}

export type InstructorCategories = Models.Row & {
  createdBy: string
  instructorId: string
  name: string
  description: string | null
  order: number | null
  isActive: boolean
}

export type PushNotifications = Models.Row & {
  createdBy: string
  title: string
  message: string
  templateType: string | null
  targetType: string
  targetCategory: string | null
  targetUserIds: string[] | null
  scheduledAt: string | null
  sentAt: string | null
  status: string
  priority: string | null
  actionUrl: string | null
  recipientCount: number | null
  readCount: number | null
}

export type NotificationTemplates = Models.Row & {
  createdBy: string
  name: string
  title: string
  message: string
  templateType: string
  isDefault: boolean
  isActive: boolean
  variables: string[] | null
}

export type GroupMembers = Models.Row & {
  createdBy: string
  instructorId: string
  memberId: string
  memberUsername: string | null
  memberEmail: string | null
  status: string
  joinedAt: string | null
}

export type OsceTopics = Models.Row & {
  createdBy: string
  title: string
  specialty: string
  scenario: string
  scenarioImageUrl: string | null
  scenarioImageFileId: string | null
  interactions: string | null
  order: number | null
  isActive: boolean
}

export type OsceSpecialties = Models.Row & {
  createdBy: string
  name: string
  description: string | null
  order: number | null
  isActive: boolean
}

export type Bookmarks = Models.Row & {
  createdBy: string
  userId: string
  itemType: string
  itemId: string
  questionNumber: number | null
  poolNumber: number | null
  osceTitle: string | null
  osceSpecialty: string | null
}

export type OsceFeedback = Models.Row & {
  createdBy: string
  userId: string
  osceTopicId: string
  feedbackText: string
  status: string | null
  adminResponse: string | null
  userName: string | null
  userEmail: string | null
  osceTopicTitle: string | null
  osceSpecialty: string | null
}

export type UserCategoryProgress = Models.Row & {
  createdBy: string
  userId: string
  categoryId: string
  isCompleted: boolean
  completedAt: string | null
}

export type InterestRegistrations = Models.Row & {
  createdBy: string
  name: string
  email: string
  status: string | null
  notes: string | null
}

export type AiGenerationUsage = Models.Row & {
  createdBy: string
  userId: string
  generationType: string
  topic: string
  questionsGenerated: number | null
  usageDate: string
}

export type QuestionNotes = Models.Row & {
  createdBy: string
  userId: string
  questionId: string
  noteText: string
  questionNumber: number | null
  poolNumber: number | null
  categoryId: string | null
  categoryName: string | null
}
