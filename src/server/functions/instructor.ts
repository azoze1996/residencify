import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../lib/db'
import { authMiddleware } from './auth'
import { Query } from 'node-appwrite'

// ============================================
// INSTRUCTOR CATEGORY FUNCTIONS
// ============================================

const createInstructorCategorySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  order: z.number().nullable().optional(),
})

export const createInstructorCategoryFn = createServerFn({ method: 'POST' })
  .inputValidator(createInstructorCategorySchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Verify user is an instructor
    const userProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('accessCategory', ['instructor']),
    ])

    if (userProfile.total === 0) {
      throw new Error('Access denied: Instructor only')
    }

    const instructorId = userProfile.rows[0].$id

    const category = await db.instructorCategories.create({
      createdBy: currentUser.$id,
      instructorId,
      name: data.name.trim(),
      description: data.description ?? null,
      order: data.order ?? null,
      isActive: true,
    })

    return { category }
  })

export const listInstructorCategoriesFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { currentUser } = await authMiddleware()
  if (!currentUser) throw new Error('Unauthorized')

  // Get user profile
  const userProfile = await db.users.list([
    Query.equal('authUserId', [currentUser.$id]),
  ])

  if (userProfile.total === 0) {
    return { categories: [] }
  }

  const user = userProfile.rows[0]

  // If instructor, get their own categories
  if (user.accessCategory === 'instructor') {
    const categories = await db.instructorCategories.list([
      Query.equal('instructorId', [user.$id]),
      Query.orderAsc('order'),
    ])
    return { categories: categories.rows }
  }

  // If student with instructor, get instructor's categories
  if (user.instructorId) {
    const categories = await db.instructorCategories.list([
      Query.equal('instructorId', [user.instructorId]),
      Query.equal('isActive', [true]),
      Query.orderAsc('order'),
    ])
    return { categories: categories.rows }
  }

  return { categories: [] }
})

export const updateInstructorCategoryFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string(),
      name: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).nullable().optional(),
      order: z.number().nullable().optional(),
      isActive: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Verify ownership
    const category = await db.instructorCategories.get(data.id)
    if (category.createdBy !== currentUser.$id) {
      throw new Error('Access denied')
    }

    const updated = await db.instructorCategories.update(data.id, {
      ...(data.name && { name: data.name.trim() }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.order !== undefined && { order: data.order }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    })

    return { category: updated }
  })

export const deleteInstructorCategoryFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Verify ownership
    const category = await db.instructorCategories.get(data.id)
    if (category.createdBy !== currentUser.$id) {
      throw new Error('Access denied')
    }

    await db.instructorCategories.delete(data.id)
    return { success: true }
  })

// ============================================
// INSTRUCTOR QUIZ FUNCTIONS
// ============================================

const createQuizSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  categoryId: z.string().nullable().optional(),
  timerMinutes: z.number().min(1).max(300).nullable().optional(),
  passingScore: z.number().min(0).max(100).nullable().optional(),
  allowRetake: z.boolean().default(false),
  maxRetakes: z.number().min(1).max(10).nullable().optional(),
  shuffleQuestions: z.boolean().default(false),
  showResults: z.boolean().default(true),
  totalPoints: z.number().nullable().optional(),
})

export const createQuizFn = createServerFn({ method: 'POST' })
  .inputValidator(createQuizSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Verify user is an instructor
    const userProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('accessCategory', ['instructor']),
    ])

    if (userProfile.total === 0) {
      throw new Error('Access denied: Instructor only')
    }

    const instructorId = userProfile.rows[0].$id

    const quiz = await db.instructorQuizzes.create({
      createdBy: currentUser.$id,
      instructorId,
      title: data.title.trim(),
      description: data.description ?? null,
      categoryId: data.categoryId ?? null,
      timerMinutes: data.timerMinutes ?? null,
      passingScore: data.passingScore ?? null,
      allowRetake: data.allowRetake,
      maxRetakes: data.maxRetakes ?? null,
      isActive: true,
      totalQuestions: 0,
      shuffleQuestions: data.shuffleQuestions,
      showResults: data.showResults,
      publishedAt: null,
      resultsPublished: false,
      totalPoints: data.totalPoints ?? null,
    })

    return { quiz }
  })

export const listInstructorQuizzesFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { currentUser } = await authMiddleware()
  if (!currentUser) throw new Error('Unauthorized')

  // Get user profile
  const userProfile = await db.users.list([
    Query.equal('authUserId', [currentUser.$id]),
  ])

  if (userProfile.total === 0) {
    return { quizzes: [] }
  }

  const user = userProfile.rows[0]

  // If instructor, get their own quizzes
  if (user.accessCategory === 'instructor') {
    const quizzes = await db.instructorQuizzes.list([
      Query.equal('instructorId', [user.$id]),
      Query.orderDesc('$createdAt'),
    ])
    return { quizzes: quizzes.rows }
  }

  // If student with instructor, get instructor's active quizzes
  if (user.instructorId) {
    const quizzes = await db.instructorQuizzes.list([
      Query.equal('instructorId', [user.instructorId]),
      Query.equal('isActive', [true]),
      Query.orderDesc('$createdAt'),
    ])
    return { quizzes: quizzes.rows }
  }

  return { quizzes: [] }
})

export const getQuizFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ quizId: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const quiz = await db.instructorQuizzes.get(data.quizId)

    // Get user profile to check access
    const userProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (userProfile.total === 0) {
      throw new Error('User not found')
    }

    const user = userProfile.rows[0]

    // Check if user is the instructor or a member of this instructor's group
    const isInstructor = quiz.instructorId === user.$id
    const isGroupMember = user.instructorId === quiz.instructorId

    if (!isInstructor && !isGroupMember) {
      // Check if user is in the instructor's group
      const groupMembership = await db.groupMembers.list([
        Query.equal('instructorId', [quiz.instructorId]),
        Query.equal('memberId', [user.$id]),
        Query.equal('status', ['active']),
      ])
      if (groupMembership.total === 0) {
        throw new Error('Access denied')
      }
    }

    return { quiz }
  })

export const updateQuizFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string(),
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).nullable().optional(),
      categoryId: z.string().nullable().optional(),
      timerMinutes: z.number().min(1).max(300).nullable().optional(),
      passingScore: z.number().min(0).max(100).nullable().optional(),
      allowRetake: z.boolean().optional(),
      maxRetakes: z.number().min(1).max(10).nullable().optional(),
      isActive: z.boolean().optional(),
      shuffleQuestions: z.boolean().optional(),
      showResults: z.boolean().optional(),
      totalPoints: z.number().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Verify ownership
    const quiz = await db.instructorQuizzes.get(data.id)
    if (quiz.createdBy !== currentUser.$id) {
      throw new Error('Access denied')
    }

    const updated = await db.instructorQuizzes.update(data.id, {
      ...(data.title && { title: data.title.trim() }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.timerMinutes !== undefined && {
        timerMinutes: data.timerMinutes,
      }),
      ...(data.passingScore !== undefined && {
        passingScore: data.passingScore,
      }),
      ...(data.allowRetake !== undefined && { allowRetake: data.allowRetake }),
      ...(data.maxRetakes !== undefined && { maxRetakes: data.maxRetakes }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.shuffleQuestions !== undefined && {
        shuffleQuestions: data.shuffleQuestions,
      }),
      ...(data.showResults !== undefined && { showResults: data.showResults }),
      ...(data.totalPoints !== undefined && { totalPoints: data.totalPoints }),
    })

    return { quiz: updated }
  })

export const deleteQuizFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Verify ownership
    const quiz = await db.instructorQuizzes.get(data.id)
    if (quiz.createdBy !== currentUser.$id) {
      throw new Error('Access denied')
    }

    // Delete all questions in the quiz
    const questions = await db.instructorQuestions.list([
      Query.equal('quizId', [data.id]),
    ])
    for (const q of questions.rows) {
      await db.instructorQuestions.delete(q.$id)
    }

    await db.instructorQuizzes.delete(data.id)
    return { success: true }
  })

// Publish quiz results to all students
export const publishQuizResultsFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ quizId: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Verify ownership
    const quiz = await db.instructorQuizzes.get(data.quizId)
    if (quiz.createdBy !== currentUser.$id) {
      throw new Error('Access denied')
    }

    // Update quiz to mark results as published
    const updated = await db.instructorQuizzes.update(data.quizId, {
      resultsPublished: true,
      publishedAt: new Date().toISOString(),
    })

    // Create notifications for all students who took the quiz
    const attempts = await db.quizAttempts.list([
      Query.equal('quizId', [data.quizId]),
      Query.equal('status', ['completed']),
    ])

    const notifiedStudents = new Set<string>()
    for (const attempt of attempts.rows) {
      if (!notifiedStudents.has(attempt.studentId)) {
        notifiedStudents.add(attempt.studentId)

        // Create notification
        const notification = await db.notifications.create({
          createdBy: currentUser.$id,
          title: 'Quiz Results Published',
          message: `Results for "${quiz.title}" are now available. Check your score!`,
          type: 'quiz_result',
          targetType: 'user',
          targetCategory: null,
          targetUserId: attempt.studentId,
          relatedId: data.quizId,
          isRead: false,
        })

        // Create user notification
        await db.userNotifications.create({
          createdBy: currentUser.$id,
          userId: attempt.studentId,
          notificationId: notification.$id,
          isRead: false,
          readAt: null,
        })
      }
    }

    return { quiz: updated, notifiedCount: notifiedStudents.size }
  })

// ============================================
// INSTRUCTOR QUESTION FUNCTIONS
// ============================================

const createInstructorQuestionSchema = z.object({
  quizId: z.string(),
  questionNumber: z.number().min(1),
  questionText: z.string().min(1).max(5000),
  optionA: z.string().min(1).max(1000),
  optionB: z.string().min(1).max(1000),
  optionC: z.string().min(1).max(1000),
  optionD: z.string().min(1).max(1000),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().max(5000).nullable().optional(),
  imageUrl: z.string().max(2000).nullable().optional(),
  points: z.number().min(1).max(100).nullable().optional(),
})

export const createInstructorQuestionFn = createServerFn({ method: 'POST' })
  .inputValidator(createInstructorQuestionSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Verify user is an instructor and owns the quiz
    const userProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('accessCategory', ['instructor']),
    ])

    if (userProfile.total === 0) {
      throw new Error('Access denied: Instructor only')
    }

    const instructorId = userProfile.rows[0].$id

    // Verify quiz ownership
    const quiz = await db.instructorQuizzes.get(data.quizId)
    if (quiz.instructorId !== instructorId) {
      throw new Error('Access denied: Not your quiz')
    }

    const question = await db.instructorQuestions.create({
      createdBy: currentUser.$id,
      instructorId,
      quizId: data.quizId,
      questionNumber: data.questionNumber,
      questionText: data.questionText.trim(),
      optionA: data.optionA.trim(),
      optionB: data.optionB.trim(),
      optionC: data.optionC.trim(),
      optionD: data.optionD.trim(),
      correctAnswer: data.correctAnswer,
      explanation: data.explanation ?? null,
      imageUrl: data.imageUrl ?? null,
      points: data.points ?? 1,
    })

    // Update quiz total questions count and total points
    const questionsList = await db.instructorQuestions.list([
      Query.equal('quizId', [data.quizId]),
    ])

    const totalPoints = questionsList.rows.reduce(
      (sum, q) => sum + (q.points || 1),
      0,
    )

    await db.instructorQuizzes.update(data.quizId, {
      totalQuestions: questionsList.total,
      totalPoints,
    })

    return { question }
  })

export const listQuizQuestionsFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ quizId: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Get user profile
    const userProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (userProfile.total === 0) {
      throw new Error('User not found')
    }

    const user = userProfile.rows[0]

    // Get quiz to verify access
    const quiz = await db.instructorQuizzes.get(data.quizId)

    // Check if user is the instructor or a member of this instructor's group
    const isInstructor = quiz.instructorId === user.$id
    const isGroupMember = user.instructorId === quiz.instructorId

    if (!isInstructor && !isGroupMember) {
      // Check group membership
      const groupMembership = await db.groupMembers.list([
        Query.equal('instructorId', [quiz.instructorId]),
        Query.equal('memberId', [user.$id]),
        Query.equal('status', ['active']),
      ])
      if (groupMembership.total === 0) {
        throw new Error('Access denied')
      }
    }

    const questions = await db.instructorQuestions.list([
      Query.equal('quizId', [data.quizId]),
      Query.orderAsc('questionNumber'),
    ])

    return { questions: questions.rows }
  })

export const updateInstructorQuestionFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string(),
      questionNumber: z.number().min(1).optional(),
      questionText: z.string().min(1).max(5000).optional(),
      optionA: z.string().min(1).max(1000).optional(),
      optionB: z.string().min(1).max(1000).optional(),
      optionC: z.string().min(1).max(1000).optional(),
      optionD: z.string().min(1).max(1000).optional(),
      correctAnswer: z.enum(['A', 'B', 'C', 'D']).optional(),
      explanation: z.string().max(5000).nullable().optional(),
      imageUrl: z.string().max(2000).nullable().optional(),
      points: z.number().min(1).max(100).nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Verify ownership
    const question = await db.instructorQuestions.get(data.id)
    if (question.createdBy !== currentUser.$id) {
      throw new Error('Access denied')
    }

    const updated = await db.instructorQuestions.update(data.id, {
      ...(data.questionNumber && { questionNumber: data.questionNumber }),
      ...(data.questionText && { questionText: data.questionText.trim() }),
      ...(data.optionA && { optionA: data.optionA.trim() }),
      ...(data.optionB && { optionB: data.optionB.trim() }),
      ...(data.optionC && { optionC: data.optionC.trim() }),
      ...(data.optionD && { optionD: data.optionD.trim() }),
      ...(data.correctAnswer && { correctAnswer: data.correctAnswer }),
      ...(data.explanation !== undefined && { explanation: data.explanation }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      ...(data.points !== undefined && { points: data.points }),
    })

    // Update quiz total points
    if (data.points !== undefined) {
      const questionsList = await db.instructorQuestions.list([
        Query.equal('quizId', [question.quizId]),
      ])
      const totalPoints = questionsList.rows.reduce(
        (sum, q) => sum + (q.points || 1),
        0,
      )
      await db.instructorQuizzes.update(question.quizId, { totalPoints })
    }

    return { question: updated }
  })

export const deleteInstructorQuestionFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Verify ownership
    const question = await db.instructorQuestions.get(data.id)
    if (question.createdBy !== currentUser.$id) {
      throw new Error('Access denied')
    }

    const quizId = question.quizId
    await db.instructorQuestions.delete(data.id)

    // Update quiz total questions count and total points
    const questionsList = await db.instructorQuestions.list([
      Query.equal('quizId', [quizId]),
    ])
    const totalPoints = questionsList.rows.reduce(
      (sum, q) => sum + (q.points || 1),
      0,
    )

    await db.instructorQuizzes.update(quizId, {
      totalQuestions: questionsList.total,
      totalPoints,
    })

    return { success: true }
  })

// ============================================
// GROUP CENTER FUNCTIONS (Renamed from Sharing Center)
// ============================================

export const listGroupMembersFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { currentUser } = await authMiddleware()
  if (!currentUser) throw new Error('Unauthorized')

  // Verify user is an instructor
  const userProfile = await db.users.list([
    Query.equal('authUserId', [currentUser.$id]),
    Query.equal('accessCategory', ['instructor']),
  ])

  if (userProfile.total === 0) {
    throw new Error('Access denied: Instructor only')
  }

  const instructorId = userProfile.rows[0].$id
  const maxStudents = userProfile.rows[0].maxStudents || 0

  const members = await db.groupMembers.list([
    Query.equal('instructorId', [instructorId]),
    Query.orderDesc('$createdAt'),
  ])

  return {
    members: members.rows,
    currentCount: members.total,
    maxStudents,
  }
})

export const addGroupMemberFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ memberUsername: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Verify user is an instructor
    const userProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('accessCategory', ['instructor']),
    ])

    if (userProfile.total === 0) {
      throw new Error('Access denied: Instructor only')
    }

    const instructor = userProfile.rows[0]
    const maxStudents = instructor.maxStudents || 0

    // Check current member count
    const currentMembers = await db.groupMembers.list([
      Query.equal('instructorId', [instructor.$id]),
      Query.equal('status', ['active']),
    ])

    if (currentMembers.total >= maxStudents) {
      throw new Error(
        `Member limit reached (${maxStudents}). Please upgrade your plan.`,
      )
    }

    // Find the member by username
    const memberUser = await db.users.list([
      Query.equal('username', [data.memberUsername]),
    ])

    if (memberUser.total === 0) {
      throw new Error('User not found')
    }

    const member = memberUser.rows[0]

    // Check if already added
    const existing = await db.groupMembers.list([
      Query.equal('instructorId', [instructor.$id]),
      Query.equal('memberId', [member.$id]),
    ])

    if (existing.total > 0) {
      throw new Error('User is already in your group')
    }

    // Add member
    const groupMember = await db.groupMembers.create({
      createdBy: currentUser.$id,
      instructorId: instructor.$id,
      memberId: member.$id,
      memberUsername: member.username,
      memberEmail: member.email,
      status: 'active',
      joinedAt: new Date().toISOString(),
    })

    // Update member's instructorId
    await db.users.update(member.$id, {
      instructorId: instructor.$id,
    })

    return { member: groupMember }
  })

export const removeGroupMemberFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ memberId: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Verify user is an instructor
    const userProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('accessCategory', ['instructor']),
    ])

    if (userProfile.total === 0) {
      throw new Error('Access denied: Instructor only')
    }

    const instructorId = userProfile.rows[0].$id

    // Find the group member relationship
    const relationship = await db.groupMembers.list([
      Query.equal('instructorId', [instructorId]),
      Query.equal('memberId', [data.memberId]),
    ])

    if (relationship.total === 0) {
      throw new Error('Member not found in your group')
    }

    // Remove the relationship
    await db.groupMembers.delete(relationship.rows[0].$id)

    // Clear member's instructorId
    await db.users.update(data.memberId, {
      instructorId: null,
    })

    return { success: true }
  })

// Search users to add to group
export const searchUsersForGroupFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ query: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Verify user is an instructor
    const userProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('accessCategory', ['instructor']),
    ])

    if (userProfile.total === 0) {
      throw new Error('Access denied: Instructor only')
    }

    const instructorId = userProfile.rows[0].$id

    // Search users by username
    const users = await db.users.list([
      Query.equal('isActive', [true]),
      Query.limit(20),
    ])

    // Filter by search query and exclude instructor and existing members
    const existingMembers = await db.groupMembers.list([
      Query.equal('instructorId', [instructorId]),
    ])
    const existingMemberIds = new Set(
      existingMembers.rows.map((m) => m.memberId),
    )

    const filteredUsers = users.rows.filter(
      (u) =>
        u.$id !== instructorId &&
        !existingMemberIds.has(u.$id) &&
        (u.username.toLowerCase().includes(data.query.toLowerCase()) ||
          u.email.toLowerCase().includes(data.query.toLowerCase())),
    )

    return {
      users: filteredUsers.map((u) => ({
        $id: u.$id,
        username: u.username,
        email: u.email,
        accessCategory: u.accessCategory,
      })),
    }
  })

// ============================================
// INSTRUCTOR STUDENT MANAGEMENT (Legacy - kept for compatibility)
// ============================================

export const listInstructorStudentsFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { currentUser } = await authMiddleware()
  if (!currentUser) throw new Error('Unauthorized')

  // Verify user is an instructor
  const userProfile = await db.users.list([
    Query.equal('authUserId', [currentUser.$id]),
    Query.equal('accessCategory', ['instructor']),
  ])

  if (userProfile.total === 0) {
    throw new Error('Access denied: Instructor only')
  }

  const instructorId = userProfile.rows[0].$id
  const maxStudents = userProfile.rows[0].maxStudents || 0

  // Get from group members
  const members = await db.groupMembers.list([
    Query.equal('instructorId', [instructorId]),
    Query.orderDesc('$createdAt'),
  ])

  // Map to student format for compatibility
  const students = members.rows.map((m) => ({
    $id: m.$id,
    studentId: m.memberId,
    studentUsername: m.memberUsername,
    studentEmail: m.memberEmail,
    status: m.status,
    joinedAt: m.joinedAt,
    instructorId: m.instructorId,
    createdBy: m.createdBy,
    $createdAt: m.$createdAt,
    $updatedAt: m.$updatedAt,
  }))

  return {
    students,
    currentCount: members.total,
    maxStudents,
  }
})

export const addStudentFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ studentUsername: z.string() }))
  .handler(async ({ data }) => {
    // Delegate to addGroupMemberFn
    const result = await addGroupMemberFn({
      data: { memberUsername: data.studentUsername },
    })
    return {
      student: {
        ...result.member,
        studentId: result.member.memberId,
        studentUsername: result.member.memberUsername,
        studentEmail: result.member.memberEmail,
      },
    }
  })

export const removeStudentFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ studentId: z.string() }))
  .handler(async ({ data }) => {
    // Delegate to removeGroupMemberFn
    return await removeGroupMemberFn({ data: { memberId: data.studentId } })
  })

// ============================================
// QUIZ ATTEMPT FUNCTIONS
// ============================================

export const startQuizAttemptFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ quizId: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Get user profile
    const userProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (userProfile.total === 0) {
      throw new Error('User not found')
    }

    const user = userProfile.rows[0]

    // Get quiz
    const quiz = await db.instructorQuizzes.get(data.quizId)

    // Verify access - must be a member of this instructor's group
    const isGroupMember = user.instructorId === quiz.instructorId
    if (!isGroupMember) {
      const groupMembership = await db.groupMembers.list([
        Query.equal('instructorId', [quiz.instructorId]),
        Query.equal('memberId', [user.$id]),
        Query.equal('status', ['active']),
      ])
      if (groupMembership.total === 0) {
        throw new Error('Access denied')
      }
    }

    // Check for existing incomplete attempt
    const existingAttempt = await db.quizAttempts.list([
      Query.equal('quizId', [data.quizId]),
      Query.equal('studentId', [user.$id]),
      Query.equal('status', ['in_progress']),
    ])

    if (existingAttempt.total > 0) {
      return { attempt: existingAttempt.rows[0], resumed: true }
    }

    // Check retake limits
    const completedAttempts = await db.quizAttempts.list([
      Query.equal('quizId', [data.quizId]),
      Query.equal('studentId', [user.$id]),
      Query.equal('status', ['completed']),
    ])

    if (!quiz.allowRetake && completedAttempts.total > 0) {
      throw new Error('You have already completed this quiz')
    }

    if (
      quiz.maxRetakes &&
      completedAttempts.total >= (quiz.maxRetakes as number)
    ) {
      throw new Error(
        `Maximum retakes (${quiz.maxRetakes}) reached for this quiz`,
      )
    }

    // Create new attempt
    const attempt = await db.quizAttempts.create({
      createdBy: currentUser.$id,
      quizId: data.quizId,
      studentId: user.$id,
      instructorId: quiz.instructorId,
      studentUsername: user.username,
      score: null,
      totalPoints: null,
      percentage: null,
      passed: false,
      timeTakenSeconds: null,
      attemptNumber: completedAttempts.total + 1,
      startedAt: new Date().toISOString(),
      completedAt: null,
      status: 'in_progress',
      answers: null,
      flaggedQuestions: [],
      currentQuestionIndex: 0,
      questionResults: null,
    })

    return { attempt, resumed: false }
  })

export const saveQuizProgressFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      attemptId: z.string(),
      currentQuestionIndex: z.number(),
      answers: z.string(), // JSON string of answers
      flaggedQuestions: z.array(z.string()).optional(),
      timeTakenSeconds: z.number().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Verify ownership
    const attempt = await db.quizAttempts.get(data.attemptId)
    if (attempt.createdBy !== currentUser.$id) {
      throw new Error('Access denied')
    }

    if (attempt.status !== 'in_progress') {
      throw new Error('Quiz already completed')
    }

    await db.quizAttempts.update(data.attemptId, {
      currentQuestionIndex: data.currentQuestionIndex,
      answers: data.answers,
      flaggedQuestions: data.flaggedQuestions ?? [],
      timeTakenSeconds: data.timeTakenSeconds ?? null,
    })

    return { success: true }
  })

export const submitQuizFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      attemptId: z.string(),
      answers: z.string(), // JSON string of answers { questionId: selectedAnswer }
      timeTakenSeconds: z.number(),
    }),
  )
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Verify ownership
    const attempt = await db.quizAttempts.get(data.attemptId)
    if (attempt.createdBy !== currentUser.$id) {
      throw new Error('Access denied')
    }

    if (attempt.status !== 'in_progress') {
      throw new Error('Quiz already completed')
    }

    // Get quiz and questions
    const quiz = await db.instructorQuizzes.get(attempt.quizId)
    const questions = await db.instructorQuestions.list([
      Query.equal('quizId', [attempt.quizId]),
    ])

    // Parse answers
    const answers = JSON.parse(data.answers) as Record<string, string>

    // Calculate score and build question results
    let score = 0
    let totalPoints = 0
    const questionResults: Record<
      string,
      {
        correct: boolean
        points: number
        userAnswer: string
        correctAnswer: string
      }
    > = {}

    for (const question of questions.rows) {
      const points = question.points || 1
      totalPoints += points
      const userAnswer = answers[question.$id] || ''
      const isCorrect = userAnswer === question.correctAnswer

      if (isCorrect) {
        score += points
      }

      questionResults[question.$id] = {
        correct: isCorrect,
        points: isCorrect ? points : 0,
        userAnswer,
        correctAnswer: question.correctAnswer,
      }
    }

    const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0
    const passed = quiz.passingScore ? percentage >= quiz.passingScore : true

    // Update attempt
    const updated = await db.quizAttempts.update(data.attemptId, {
      score,
      totalPoints,
      percentage: Math.round(percentage * 100) / 100,
      passed,
      timeTakenSeconds: data.timeTakenSeconds,
      completedAt: new Date().toISOString(),
      status: 'completed',
      answers: data.answers,
      questionResults: JSON.stringify(questionResults),
    })

    return {
      attempt: updated,
      score,
      totalPoints,
      percentage: Math.round(percentage * 100) / 100,
      passed,
      resultsPublished: quiz.resultsPublished,
      showResults: quiz.showResults,
    }
  })

export const getQuizAttemptsFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ quizId: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Get user profile
    const userProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (userProfile.total === 0) {
      throw new Error('User not found')
    }

    const user = userProfile.rows[0]

    // Get quiz
    const quiz = await db.instructorQuizzes.get(data.quizId)

    // If instructor, get all attempts for this quiz
    if (
      user.accessCategory === 'instructor' &&
      quiz.instructorId === user.$id
    ) {
      const attempts = await db.quizAttempts.list([
        Query.equal('quizId', [data.quizId]),
        Query.orderDesc('$createdAt'),
      ])
      return { attempts: attempts.rows, isInstructor: true, quiz }
    }

    // If student, get only their attempts
    const isGroupMember = user.instructorId === quiz.instructorId
    if (isGroupMember) {
      const attempts = await db.quizAttempts.list([
        Query.equal('quizId', [data.quizId]),
        Query.equal('studentId', [user.$id]),
        Query.orderDesc('$createdAt'),
      ])
      return { attempts: attempts.rows, isInstructor: false, quiz }
    }

    throw new Error('Access denied')
  })

// Get all quiz attempts for instructor (across all quizzes)
export const getInstructorAllAttemptsFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { currentUser } = await authMiddleware()
  if (!currentUser) throw new Error('Unauthorized')

  // Verify user is an instructor
  const userProfile = await db.users.list([
    Query.equal('authUserId', [currentUser.$id]),
    Query.equal('accessCategory', ['instructor']),
  ])

  if (userProfile.total === 0) {
    throw new Error('Access denied: Instructor only')
  }

  const instructorId = userProfile.rows[0].$id

  const attempts = await db.quizAttempts.list([
    Query.equal('instructorId', [instructorId]),
    Query.orderDesc('$createdAt'),
    Query.limit(100),
  ])

  return { attempts: attempts.rows }
})

// ============================================
// ANALYTICS FUNCTIONS
// ============================================

export const getQuizAnalyticsFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ quizId: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Verify user is an instructor and owns the quiz
    const userProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('accessCategory', ['instructor']),
    ])

    if (userProfile.total === 0) {
      throw new Error('Access denied: Instructor only')
    }

    const quiz = await db.instructorQuizzes.get(data.quizId)
    if (quiz.instructorId !== userProfile.rows[0].$id) {
      throw new Error('Access denied')
    }

    // Get all attempts for this quiz
    const attempts = await db.quizAttempts.list([
      Query.equal('quizId', [data.quizId]),
      Query.limit(500),
    ])

    // Get group members
    const members = await db.groupMembers.list([
      Query.equal('instructorId', [quiz.instructorId]),
      Query.equal('status', ['active']),
    ])

    const completedAttempts = attempts.rows.filter(
      (a) => a.status === 'completed',
    )
    const inProgressAttempts = attempts.rows.filter(
      (a) => a.status === 'in_progress',
    )

    // Calculate who hasn't started
    const startedStudentIds = new Set(attempts.rows.map((a) => a.studentId))
    const notStartedCount = members.rows.filter(
      (m) => !startedStudentIds.has(m.memberId),
    ).length

    // Calculate scores
    const scores = completedAttempts.map((a) => a.percentage || 0)
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0
    const meanScore =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

    // Calculate most common mistakes
    const questionMistakes: Record<string, number> = {}
    for (const attempt of completedAttempts) {
      if (attempt.questionResults) {
        try {
          const results = JSON.parse(attempt.questionResults) as Record<
            string,
            { correct: boolean }
          >
          for (const [questionId, result] of Object.entries(results)) {
            if (!result.correct) {
              questionMistakes[questionId] =
                (questionMistakes[questionId] || 0) + 1
            }
          }
        } catch {
          // Ignore parse errors
        }
      }
    }

    // Get question details for most common mistakes
    const questions = await db.instructorQuestions.list([
      Query.equal('quizId', [data.quizId]),
    ])

    const questionMap = new Map(questions.rows.map((q) => [q.$id, q]))
    const commonMistakes = Object.entries(questionMistakes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([questionId, count]) => ({
        questionId,
        question: questionMap.get(questionId),
        mistakeCount: count,
        percentage:
          completedAttempts.length > 0
            ? (count / completedAttempts.length) * 100
            : 0,
      }))

    // Score distribution for curve
    const scoreDistribution = [
      { range: '0-20', count: scores.filter((s) => s >= 0 && s < 20).length },
      { range: '20-40', count: scores.filter((s) => s >= 20 && s < 40).length },
      { range: '40-60', count: scores.filter((s) => s >= 40 && s < 60).length },
      { range: '60-80', count: scores.filter((s) => s >= 60 && s < 80).length },
      {
        range: '80-100',
        count: scores.filter((s) => s >= 80 && s <= 100).length,
      },
    ]

    return {
      quiz,
      totalMembers: members.total,
      completedCount: completedAttempts.length,
      inProgressCount: inProgressAttempts.length,
      notStartedCount,
      highestScore: Math.round(highestScore * 100) / 100,
      lowestScore: Math.round(lowestScore * 100) / 100,
      meanScore: Math.round(meanScore * 100) / 100,
      passedCount: completedAttempts.filter((a) => a.passed).length,
      failedCount: completedAttempts.filter((a) => !a.passed).length,
      commonMistakes,
      scoreDistribution,
      attempts: attempts.rows,
    }
  })

// Get instructor dashboard analytics
export const getInstructorDashboardAnalyticsFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { currentUser } = await authMiddleware()
  if (!currentUser) throw new Error('Unauthorized')

  // Verify user is an instructor
  const userProfile = await db.users.list([
    Query.equal('authUserId', [currentUser.$id]),
    Query.equal('accessCategory', ['instructor']),
  ])

  if (userProfile.total === 0) {
    throw new Error('Access denied: Instructor only')
  }

  const instructorId = userProfile.rows[0].$id

  // Get all quizzes
  const quizzes = await db.instructorQuizzes.list([
    Query.equal('instructorId', [instructorId]),
  ])

  // Get all attempts
  const attempts = await db.quizAttempts.list([
    Query.equal('instructorId', [instructorId]),
    Query.limit(500),
  ])

  // Get group members
  const members = await db.groupMembers.list([
    Query.equal('instructorId', [instructorId]),
    Query.equal('status', ['active']),
  ])

  const completedAttempts = attempts.rows.filter(
    (a) => a.status === 'completed',
  )
  const passedAttempts = completedAttempts.filter((a) => a.passed)

  // Recent activity
  const recentAttempts = attempts.rows.slice(0, 10)

  // Per-quiz stats
  const quizStats = quizzes.rows.map((quiz) => {
    const quizAttempts = attempts.rows.filter((a) => a.quizId === quiz.$id)
    const quizCompleted = quizAttempts.filter((a) => a.status === 'completed')
    const quizPassed = quizCompleted.filter((a) => a.passed)
    const scores = quizCompleted.map((a) => a.percentage || 0)

    return {
      quiz,
      totalAttempts: quizAttempts.length,
      completedCount: quizCompleted.length,
      passedCount: quizPassed.length,
      averageScore:
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0,
    }
  })

  return {
    totalQuizzes: quizzes.total,
    activeQuizzes: quizzes.rows.filter((q) => q.isActive).length,
    totalMembers: members.total,
    totalAttempts: attempts.total,
    completedAttempts: completedAttempts.length,
    passedAttempts: passedAttempts.length,
    passRate:
      completedAttempts.length > 0
        ? (passedAttempts.length / completedAttempts.length) * 100
        : 0,
    recentAttempts,
    quizStats,
  }
})

// Get student's quiz results (for when results are published)
export const getStudentQuizResultFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ attemptId: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const attempt = await db.quizAttempts.get(data.attemptId)

    // Verify ownership
    if (attempt.createdBy !== currentUser.$id) {
      throw new Error('Access denied')
    }

    const quiz = await db.instructorQuizzes.get(attempt.quizId)

    // Check if results are available
    if (!quiz.showResults && !quiz.resultsPublished) {
      return {
        attempt,
        quiz,
        resultsAvailable: false,
        questions: [],
      }
    }

    // Get questions with results
    const questions = await db.instructorQuestions.list([
      Query.equal('quizId', [attempt.quizId]),
      Query.orderAsc('questionNumber'),
    ])

    let questionResults: Record<
      string,
      { correct: boolean; userAnswer: string; correctAnswer: string }
    > = {}
    if (attempt.questionResults) {
      try {
        questionResults = JSON.parse(attempt.questionResults)
      } catch {
        // Ignore parse errors
      }
    }

    const questionsWithResults = questions.rows.map((q) => ({
      ...q,
      result: questionResults[q.$id] || null,
    }))

    return {
      attempt,
      quiz,
      resultsAvailable: true,
      questions: questionsWithResults,
    }
  })
