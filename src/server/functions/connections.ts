import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../lib/db'
import { authMiddleware } from './auth'
import { Query } from 'node-appwrite'

// Schema for sending connection request
const sendConnectionRequestSchema = z.object({
  receiverUsername: z.string().min(1),
})

// Schema for responding to connection request
const respondConnectionSchema = z.object({
  connectionId: z.string(),
  accept: z.boolean(),
})

// Schema for sharing a question
const shareQuestionSchema = z.object({
  questionId: z.string(),
  sharedWithId: z.string(),
  permission: z.enum(['view', 'practice']).default('view'),
})

// Schema for sharing an OSCE topic
const shareOsceTopicSchema = z.object({
  osceTopicId: z.string(),
  sharedWithId: z.string(),
})

// Schema for removing shared question
const removeSharedQuestionSchema = z.object({
  sharedQuestionId: z.string(),
})

/**
 * Search for users by username - only returns paid users in the same category
 * Only available for paid plan users
 */
export const searchUsersFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ query: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Get current user's profile
    const currentUserProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (currentUserProfile.total === 0) {
      throw new Error('User profile not found')
    }

    const userProfile = currentUserProfile.rows[0]

    // Check if current user has a paid plan
    if (userProfile.planType !== 'paid') {
      throw new Error('Search is only available for paid plan users.')
    }

    const userCategory = userProfile.accessCategory

    // Search for users by username (case-insensitive partial match)
    // Only return paid users in the same category
    const users = await db.users.list([
      Query.contains('username', [data.query]),
      Query.equal('accessCategory', [userCategory]),
      Query.equal('planType', ['paid']),
      Query.limit(10),
    ])

    // Filter out current user
    const filteredUsers = users.rows.filter(
      (u) => u.authUserId !== currentUser.$id,
    )

    return {
      users: filteredUsers.map((u) => ({
        $id: u.$id,
        username: u.username,
        email: u.email,
        accessCategory: u.accessCategory,
      })),
      currentUserCategory: userCategory,
    }
  })

/**
 * Send a connection request - only allowed to paid users in the same category
 */
export const sendConnectionRequestFn = createServerFn({ method: 'POST' })
  .inputValidator(sendConnectionRequestSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Get current user's profile
    const currentUserProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (currentUserProfile.total === 0) {
      throw new Error('User profile not found')
    }

    const requester = currentUserProfile.rows[0]

    // Check if requester has a paid plan
    if (requester.planType !== 'paid') {
      throw new Error(
        'Connections are only available for paid plan users. Please upgrade your plan to connect with other users.',
      )
    }

    // Find receiver by username
    const receiverProfile = await db.users.list([
      Query.equal('username', [data.receiverUsername]),
    ])

    if (receiverProfile.total === 0) {
      throw new Error('User not found')
    }

    const receiver = receiverProfile.rows[0]

    if (receiver.authUserId === currentUser.$id) {
      throw new Error('Cannot send connection request to yourself')
    }

    // Check if receiver has a paid plan
    if (receiver.planType !== 'paid') {
      throw new Error('You can only connect with other paid plan users.')
    }

    // Check if both users are in the same category
    if (requester.accessCategory !== receiver.accessCategory) {
      const getCategoryLabel = (cat: string) => {
        switch (cat) {
          case 'medical_student':
            return 'Medical Students'
          case 'intern':
            return 'Interns'
          case 'trainee_resident':
            return 'Trainee Residents'
          default:
            return cat
        }
      }
      throw new Error(
        `You can only connect with users in your category (${getCategoryLabel(requester.accessCategory)}). ${receiver.username} is in ${getCategoryLabel(receiver.accessCategory)}.`,
      )
    }

    // Check if connection already exists
    const existingConnection = await db.userConnections.list([
      Query.or([
        Query.and([
          Query.equal('requesterId', [requester.$id]),
          Query.equal('receiverId', [receiver.$id]),
        ]),
        Query.and([
          Query.equal('requesterId', [receiver.$id]),
          Query.equal('receiverId', [requester.$id]),
        ]),
      ]),
    ])

    if (existingConnection.total > 0) {
      throw new Error('Connection already exists or pending')
    }

    // Create connection request
    const connection = await db.userConnections.create({
      createdBy: currentUser.$id,
      requesterId: requester.$id,
      receiverId: receiver.$id,
      status: 'pending',
      requesterUsername: requester.username,
      receiverUsername: receiver.username,
    })

    return { connection }
  })

/**
 * Get pending connection requests (received)
 */
export const getPendingConnectionsFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { currentUser } = await authMiddleware()
  if (!currentUser) throw new Error('Unauthorized')

  // Get current user's profile
  const currentUserProfile = await db.users.list([
    Query.equal('authUserId', [currentUser.$id]),
  ])

  if (currentUserProfile.total === 0) {
    throw new Error('User profile not found')
  }

  const userProfileId = currentUserProfile.rows[0].$id

  // Get pending requests where current user is receiver
  const pendingConnections = await db.userConnections.list([
    Query.equal('receiverId', [userProfileId]),
    Query.equal('status', ['pending']),
  ])

  return { connections: pendingConnections.rows }
})

/**
 * Get all connections (accepted)
 */
export const getConnectionsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Get current user's profile
    const currentUserProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (currentUserProfile.total === 0) {
      throw new Error('User profile not found')
    }

    const userProfileId = currentUserProfile.rows[0].$id

    // Get accepted connections where current user is either requester or receiver
    const connections = await db.userConnections.list([
      Query.equal('status', ['accepted']),
      Query.or([
        Query.equal('requesterId', [userProfileId]),
        Query.equal('receiverId', [userProfileId]),
      ]),
    ])

    // Map connections to show the other user's info
    const mappedConnections = connections.rows.map((conn) => {
      const isRequester = conn.requesterId === userProfileId
      return {
        ...conn,
        connectedUserId: isRequester ? conn.receiverId : conn.requesterId,
        connectedUsername: isRequester
          ? conn.receiverUsername
          : conn.requesterUsername,
      }
    })

    return { connections: mappedConnections }
  },
)

/**
 * Respond to a connection request
 */
export const respondToConnectionFn = createServerFn({ method: 'POST' })
  .inputValidator(respondConnectionSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Get current user's profile
    const currentUserProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (currentUserProfile.total === 0) {
      throw new Error('User profile not found')
    }

    const userProfileId = currentUserProfile.rows[0].$id

    // Get the connection
    const connection = await db.userConnections.get(data.connectionId)

    if (connection.receiverId !== userProfileId) {
      throw new Error('Not authorized to respond to this request')
    }

    if (connection.status !== 'pending') {
      throw new Error('Connection request already processed')
    }

    if (data.accept) {
      await db.userConnections.update(data.connectionId, {
        status: 'accepted',
      })
    } else {
      await db.userConnections.delete(data.connectionId)
    }

    return { success: true }
  })

/**
 * Remove a connection
 */
export const removeConnectionFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ connectionId: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Get current user's profile
    const currentUserProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (currentUserProfile.total === 0) {
      throw new Error('User profile not found')
    }

    const userProfileId = currentUserProfile.rows[0].$id

    // Get the connection
    const connection = await db.userConnections.get(data.connectionId)

    if (
      connection.requesterId !== userProfileId &&
      connection.receiverId !== userProfileId
    ) {
      throw new Error('Not authorized to remove this connection')
    }

    await db.userConnections.delete(data.connectionId)

    return { success: true }
  })

/**
 * Share a question with a connected user
 * Only available for paid plan users in the same category
 */
export const shareQuestionFn = createServerFn({ method: 'POST' })
  .inputValidator(shareQuestionSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Get current user's profile
    const currentUserProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (currentUserProfile.total === 0) {
      throw new Error('User profile not found')
    }

    const sharer = currentUserProfile.rows[0]

    // Check if sharer has a paid plan
    if (sharer.planType !== 'paid') {
      throw new Error(
        'Sharing is only available for paid plan users. Please upgrade your plan to share questions.',
      )
    }

    // Get receiver's profile
    const receiver = await db.users.get(data.sharedWithId)

    // Check if receiver has a paid plan
    if (receiver.planType !== 'paid') {
      throw new Error(
        'You can only share questions with other paid plan users.',
      )
    }

    // Check if both users are in the same category
    if (sharer.accessCategory !== receiver.accessCategory) {
      throw new Error(
        'You can only share questions with users in your same category.',
      )
    }

    // Verify connection exists
    const connections = await db.userConnections.list([
      Query.equal('status', ['accepted']),
      Query.or([
        Query.and([
          Query.equal('requesterId', [sharer.$id]),
          Query.equal('receiverId', [data.sharedWithId]),
        ]),
        Query.and([
          Query.equal('requesterId', [data.sharedWithId]),
          Query.equal('receiverId', [sharer.$id]),
        ]),
      ]),
    ])

    if (connections.total === 0) {
      throw new Error('You can only share with connected users')
    }

    // Get the question
    const question = await db.questions.get(data.questionId)

    // Check if already shared
    const existingShare = await db.sharedQuestions.list([
      Query.equal('questionId', [data.questionId]),
      Query.equal('sharedById', [sharer.$id]),
      Query.equal('sharedWithId', [data.sharedWithId]),
    ])

    if (existingShare.total > 0) {
      throw new Error('Question already shared with this user')
    }

    // Create shared question record
    const sharedQuestion = await db.sharedQuestions.create({
      createdBy: currentUser.$id,
      questionId: data.questionId,
      sharedById: sharer.$id,
      sharedWithId: data.sharedWithId,
      sharedByUsername: sharer.username,
      sharedWithUsername: receiver.username,
      permission: data.permission,
      questionNumber: question.questionNumber,
      poolNumber: question.poolNumber,
    })

    return { sharedQuestion }
  })

/**
 * Get questions shared with me
 */
export const getSharedWithMeFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Get current user's profile
    const currentUserProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (currentUserProfile.total === 0) {
      throw new Error('User profile not found')
    }

    const userProfileId = currentUserProfile.rows[0].$id

    // Get shared questions (exclude OSCE topics which have questionNumber = -1)
    const sharedQuestions = await db.sharedQuestions.list([
      Query.equal('sharedWithId', [userProfileId]),
      Query.notEqual('questionNumber', [-1]),
      Query.orderDesc('$createdAt'),
    ])

    // Fetch all categories to map pool numbers to category names
    const allCategories = await db.categories.list([
      Query.equal('isActive', [true]),
      Query.limit(500),
    ])

    // Create a map of poolNumber -> categoryName
    const poolToCategoryMap: Record<number, string> = {}
    allCategories.rows.forEach((cat) => {
      if (cat.poolNumbers) {
        cat.poolNumbers.forEach((poolNum: number) => {
          poolToCategoryMap[poolNum] = cat.name
        })
      }
    })

    // Fetch actual question data for each shared question
    const questionsWithData = await Promise.all(
      sharedQuestions.rows.map(async (sq) => {
        try {
          const question = await db.questions.get(sq.questionId)
          const categoryName = sq.poolNumber
            ? poolToCategoryMap[sq.poolNumber] || null
            : null
          return { ...sq, question, categoryName }
        } catch {
          return { ...sq, question: null, categoryName: null }
        }
      }),
    )

    return { sharedQuestions: questionsWithData }
  },
)

/**
 * Get questions I've shared
 */
export const getMySharedQuestionsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Get current user's profile
    const currentUserProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (currentUserProfile.total === 0) {
      throw new Error('User profile not found')
    }

    const userProfileId = currentUserProfile.rows[0].$id

    // Get shared questions (exclude OSCE topics which have questionNumber = -1)
    const sharedQuestions = await db.sharedQuestions.list([
      Query.equal('sharedById', [userProfileId]),
      Query.notEqual('questionNumber', [-1]),
      Query.orderDesc('$createdAt'),
    ])

    return { sharedQuestions: sharedQuestions.rows }
  },
)

/**
 * Remove a shared question
 */
export const removeSharedQuestionFn = createServerFn({ method: 'POST' })
  .inputValidator(removeSharedQuestionSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Get current user's profile
    const currentUserProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (currentUserProfile.total === 0) {
      throw new Error('User profile not found')
    }

    const userProfileId = currentUserProfile.rows[0].$id

    // Get the shared question
    const sharedQuestion = await db.sharedQuestions.get(data.sharedQuestionId)

    // Only the sharer can remove
    if (sharedQuestion.sharedById !== userProfileId) {
      throw new Error('Not authorized to remove this shared question')
    }

    await db.sharedQuestions.delete(data.sharedQuestionId)

    return { success: true }
  })

// ============ OSCE Topic Sharing ============

/**
 * Share an OSCE topic with a connected user
 * Only available for paid plan users in the same category
 */
export const shareOsceTopicFn = createServerFn({ method: 'POST' })
  .inputValidator(shareOsceTopicSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Get current user's profile
    const currentUserProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (currentUserProfile.total === 0) {
      throw new Error('User profile not found')
    }

    const sharer = currentUserProfile.rows[0]

    // Check if sharer has a paid plan
    if (sharer.planType !== 'paid') {
      throw new Error(
        'Sharing is only available for paid plan users. Please upgrade your plan to share OSCE topics.',
      )
    }

    // Get receiver's profile
    const receiver = await db.users.get(data.sharedWithId)

    // Check if receiver has a paid plan
    if (receiver.planType !== 'paid') {
      throw new Error(
        'You can only share OSCE topics with other paid plan users.',
      )
    }

    // Check if both users are in the same category
    if (sharer.accessCategory !== receiver.accessCategory) {
      throw new Error(
        'You can only share OSCE topics with users in your same category.',
      )
    }

    // Verify connection exists
    const connections = await db.userConnections.list([
      Query.equal('status', ['accepted']),
      Query.or([
        Query.and([
          Query.equal('requesterId', [sharer.$id]),
          Query.equal('receiverId', [data.sharedWithId]),
        ]),
        Query.and([
          Query.equal('requesterId', [data.sharedWithId]),
          Query.equal('receiverId', [sharer.$id]),
        ]),
      ]),
    ])

    if (connections.total === 0) {
      throw new Error('You can only share with connected users')
    }

    // Get the OSCE topic
    const osceTopic = await db.osceTopics.get(data.osceTopicId)

    // Check if already shared (using sharedQuestions table with a marker)
    // We use questionNumber = -1 to indicate this is an OSCE topic share
    const existingShare = await db.sharedQuestions.list([
      Query.equal('questionId', [data.osceTopicId]),
      Query.equal('sharedById', [sharer.$id]),
      Query.equal('sharedWithId', [data.sharedWithId]),
      Query.equal('questionNumber', [-1]), // Marker for OSCE topics
    ])

    if (existingShare.total > 0) {
      throw new Error('OSCE topic already shared with this user')
    }

    // Create shared OSCE topic record (using sharedQuestions table)
    // We use questionNumber = -1 as a marker to identify OSCE shares
    const sharedOsceTopic = await db.sharedQuestions.create({
      createdBy: currentUser.$id,
      questionId: data.osceTopicId, // Store OSCE topic ID here
      sharedById: sharer.$id,
      sharedWithId: data.sharedWithId,
      sharedByUsername: sharer.username,
      sharedWithUsername: receiver.username,
      permission: 'view',
      questionNumber: -1, // Marker: -1 indicates OSCE topic
      poolNumber: null,
    })

    return {
      sharedOsceTopic,
      osceTitle: osceTopic.title,
      osceSpecialty: osceTopic.specialty,
    }
  })

/**
 * Get OSCE topics shared with me
 */
export const getSharedOsceTopicsWithMeFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { currentUser } = await authMiddleware()
  if (!currentUser) throw new Error('Unauthorized')

  // Get current user's profile
  const currentUserProfile = await db.users.list([
    Query.equal('authUserId', [currentUser.$id]),
  ])

  if (currentUserProfile.total === 0) {
    throw new Error('User profile not found')
  }

  const userProfileId = currentUserProfile.rows[0].$id

  // Get shared OSCE topics (questionNumber = -1 indicates OSCE)
  const sharedItems = await db.sharedQuestions.list([
    Query.equal('sharedWithId', [userProfileId]),
    Query.equal('questionNumber', [-1]),
    Query.orderDesc('$createdAt'),
  ])

  // Fetch actual OSCE topic data for each shared item
  const osceTopicsWithData = await Promise.all(
    sharedItems.rows.map(async (item) => {
      try {
        const osceTopic = await db.osceTopics.get(item.questionId)
        return {
          ...item,
          osceTopic,
          itemType: 'osce' as const,
        }
      } catch {
        return {
          ...item,
          osceTopic: null,
          itemType: 'osce' as const,
        }
      }
    }),
  )

  return { sharedOsceTopics: osceTopicsWithData }
})

/**
 * Get OSCE topics I've shared
 */
export const getMySharedOsceTopicsFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { currentUser } = await authMiddleware()
  if (!currentUser) throw new Error('Unauthorized')

  // Get current user's profile
  const currentUserProfile = await db.users.list([
    Query.equal('authUserId', [currentUser.$id]),
  ])

  if (currentUserProfile.total === 0) {
    throw new Error('User profile not found')
  }

  const userProfileId = currentUserProfile.rows[0].$id

  // Get shared OSCE topics (questionNumber = -1 indicates OSCE)
  const sharedItems = await db.sharedQuestions.list([
    Query.equal('sharedById', [userProfileId]),
    Query.equal('questionNumber', [-1]),
    Query.orderDesc('$createdAt'),
  ])

  // Fetch actual OSCE topic data for each shared item
  const osceTopicsWithData = await Promise.all(
    sharedItems.rows.map(async (item) => {
      try {
        const osceTopic = await db.osceTopics.get(item.questionId)
        return {
          ...item,
          osceTitle: osceTopic.title,
          osceSpecialty: osceTopic.specialty,
          itemType: 'osce' as const,
        }
      } catch {
        return {
          ...item,
          osceTitle: 'Topic unavailable',
          osceSpecialty: null,
          itemType: 'osce' as const,
        }
      }
    }),
  )

  return { sharedOsceTopics: osceTopicsWithData }
})

/**
 * Remove a shared OSCE topic
 */
export const removeSharedOsceTopicFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ sharedOsceTopicId: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Get current user's profile
    const currentUserProfile = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (currentUserProfile.total === 0) {
      throw new Error('User profile not found')
    }

    const userProfileId = currentUserProfile.rows[0].$id

    // Get the shared item
    const sharedItem = await db.sharedQuestions.get(data.sharedOsceTopicId)

    // Verify it's an OSCE topic share
    if (sharedItem.questionNumber !== -1) {
      throw new Error('This is not a shared OSCE topic')
    }

    // Only the sharer can remove
    if (sharedItem.sharedById !== userProfileId) {
      throw new Error('Not authorized to remove this shared OSCE topic')
    }

    await db.sharedQuestions.delete(data.sharedOsceTopicId)

    return { success: true }
  })
