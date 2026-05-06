import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../lib/db'
import { authMiddleware } from './auth'
import { Query, Permission, Role } from 'node-appwrite'

// Schema for creating a user
const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  planType: z.enum(['free', 'paid']),
  planDuration: z.enum(['monthly', '3months', '6months']),
  startDate: z.string(),
  endDate: z.string(),
  accessCategory: z.enum(['trainee_resident']),
  isActive: z.boolean().default(true),
  isExamAdmin: z.boolean().default(false),
})

// Schema for updating a user
const updateUserSchema = z.object({
  id: z.string(),
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  planType: z.enum(['free', 'paid']).optional(),
  planDuration: z.enum(['monthly', '3months', '6months']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  accessCategory: z.enum(['trainee_resident']).optional(),
  isActive: z.boolean().optional(),
  isExamAdmin: z.boolean().optional(),
})

// List all users (admin only)
export const listUsersFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Check if user is admin (full admin, not exam admin)
    const adminUser = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('isAdmin', [true]),
    ])

    if (adminUser.total === 0) {
      throw new Error('Access denied: Admin only')
    }

    const users = await db.users.list([Query.orderDesc('$createdAt')])
    return { users: users.rows }
  },
)

// Get single user
export const getUserFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const user = await db.users.get(data.id)
    return { user }
  })

// Ensure user profile exists (creates one if not)
// This should be called when users access protected routes
export const ensureUserProfileFn = createServerFn({ method: 'POST' }).handler(
  async () => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Check if user record already exists
    const existingUsers = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (existingUsers.total > 0) {
      // User profile exists, return it
      return { user: existingUsers.rows[0], created: false }
    }

    // Create new user record with free plan
    const now = new Date()
    const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const newUser = await db.users.create(
      {
        createdBy: currentUser.$id,
        username:
          currentUser.name || currentUser.email?.split('@')[0] || 'User',
        email: currentUser.email || '',
        planType: 'free',
        planDuration: 'monthly',
        startDate: now.toISOString(),
        endDate: oneMonthLater.toISOString(),
        accessCategory: 'trainee_resident',
        isActive: true,
        isAdmin: false,
        authUserId: currentUser.$id,
        deviceIds: null,
        lastDeviceId: null,
        accessLevel: 'limited',
        isInstructor: false,
        maxStudents: null,
        instructorId: null,
      },
      {
        permissions: [
          Permission.read(Role.user(currentUser.$id)),
          Permission.write(Role.user(currentUser.$id)),
          Permission.update(Role.user(currentUser.$id)),
          Permission.delete(Role.user(currentUser.$id)),
        ],
      },
    )

    return { user: newUser, created: true }
  },
)

// Get current user profile
export const getCurrentUserProfileFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { currentUser } = await authMiddleware()
  if (!currentUser) throw new Error('Unauthorized')

  const users = await db.users.list([
    Query.equal('authUserId', [currentUser.$id]),
  ])

  if (users.total === 0) {
    return { user: null }
  }

  return { user: users.rows[0] }
})

// Create user (admin only)
export const createUserFn = createServerFn({ method: 'POST' })
  .inputValidator(createUserSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Check if user is admin (full admin only)
    const adminUser = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('isAdmin', [true]),
    ])

    if (adminUser.total === 0) {
      throw new Error('Access denied: Admin only')
    }

    // Create auth user first via Appwrite
    const { createAdminClient } = await import('../lib/appwrite')
    const { account } = createAdminClient()
    const { ID } = await import('node-appwrite')

    const authUser = await account.create({
      userId: ID.unique(),
      email: data.email,
      password: data.password,
    })

    // Create user record in database
    const user = await db.users.create({
      createdBy: currentUser.$id,
      username: data.username.trim(),
      email: data.email.trim().toLowerCase(),
      planType: data.planType,
      planDuration: data.planDuration,
      startDate: data.startDate,
      endDate: data.endDate,
      accessCategory: data.accessCategory,
      isActive: data.isActive,
      isAdmin: data.isExamAdmin ? false : false, // Exam admins are not full admins
      authUserId: authUser.$id,
      deviceIds: null,
      lastDeviceId: null,
      accessLevel: data.planType === 'free' ? 'limited' : 'full',
      isInstructor: false,
      maxStudents: null,
      instructorId: null,
    })

    // If exam admin, we need to store this in a custom field
    // For now, we'll use the accessLevel field to indicate exam admin
    if (data.isExamAdmin) {
      await db.users.update(user.$id, {
        accessLevel: 'exam_admin',
      })
    }

    return { user }
  })

// Update user (admin only)
export const updateUserFn = createServerFn({ method: 'POST' })
  .inputValidator(updateUserSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Check if user is admin (full admin only)
    const adminUser = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('isAdmin', [true]),
    ])

    if (adminUser.total === 0) {
      throw new Error('Access denied: Admin only')
    }

    const { id, ...updateData } = data
    const cleanData: Record<string, unknown> = {}

    if (updateData.username) cleanData.username = updateData.username.trim()
    if (updateData.email)
      cleanData.email = updateData.email.trim().toLowerCase()
    if (updateData.planType) cleanData.planType = updateData.planType
    if (updateData.planDuration)
      cleanData.planDuration = updateData.planDuration
    if (updateData.startDate) cleanData.startDate = updateData.startDate
    if (updateData.endDate) cleanData.endDate = updateData.endDate
    if (updateData.accessCategory)
      cleanData.accessCategory = updateData.accessCategory
    if (typeof updateData.isActive === 'boolean')
      cleanData.isActive = updateData.isActive
    if (typeof updateData.isExamAdmin === 'boolean') {
      // Only set exam_admin if explicitly true, otherwise determine based on plan
      if (updateData.isExamAdmin) {
        cleanData.accessLevel = 'exam_admin'
      } else {
        // When removing exam admin, set access level based on plan type
        // We need to get the current user to check their plan
        const targetUser = await db.users.get(id)
        const planType = updateData.planType || targetUser.planType
        cleanData.accessLevel = planType === 'paid' ? 'full' : 'limited'
      }
    }

    const user = await db.users.update(id, cleanData)
    return { user }
  })

// Delete user (admin only)
export const deleteUserFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Check if user is admin (full admin only)
    const adminUser = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('isAdmin', [true]),
    ])

    if (adminUser.total === 0) {
      throw new Error('Access denied: Admin only')
    }

    await db.users.delete(data.id)
    return { success: true }
  })

// Check if current user is admin
export const isAdminFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { currentUser } = await authMiddleware()
  if (!currentUser) return { isAdmin: false, isExamAdmin: false }

  const users = await db.users.list([
    Query.equal('authUserId', [currentUser.$id]),
  ])

  if (users.total === 0) {
    return { isAdmin: false, isExamAdmin: false }
  }

  const user = users.rows[0]
  return {
    isAdmin: user.isAdmin === true,
    isExamAdmin: user.accessLevel === 'exam_admin',
  }
})

// Setup admin access for the current user (creates user record if not exists)
// This should be called once to set up the first admin
export const setupAdminAccessFn = createServerFn({ method: 'POST' }).handler(
  async () => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Check if user record already exists
    const existingUsers = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (existingUsers.total > 0) {
      // Update existing user to be admin
      const existingUser = existingUsers.rows[0]
      const updatedUser = await db.users.update(
        existingUser.$id,
        { isAdmin: true },
        {
          permissions: [
            Permission.read(Role.any()),
            Permission.write(Role.user(currentUser.$id)),
            Permission.update(Role.user(currentUser.$id)),
            Permission.delete(Role.user(currentUser.$id)),
          ],
        },
      )
      return {
        user: updatedUser,
        message: 'Admin access granted to existing user',
      }
    }

    // Create new user record with admin access
    const now = new Date().toISOString()
    const oneYearLater = new Date(
      Date.now() + 365 * 24 * 60 * 60 * 1000,
    ).toISOString()

    const newUser = await db.users.create(
      {
        createdBy: currentUser.$id,
        username: currentUser.email?.split('@')[0] || 'admin',
        email: currentUser.email || '',
        planType: 'paid',
        planDuration: '6months',
        startDate: now,
        endDate: oneYearLater,
        accessCategory: 'trainee_resident',
        isActive: true,
        isAdmin: true,
        authUserId: currentUser.$id,
        deviceIds: null,
        lastDeviceId: null,
        accessLevel: 'full',
        isInstructor: false,
        maxStudents: null,
        instructorId: null,
      },
      {
        permissions: [
          Permission.read(Role.any()),
          Permission.write(Role.user(currentUser.$id)),
          Permission.update(Role.user(currentUser.$id)),
          Permission.delete(Role.user(currentUser.$id)),
        ],
      },
    )

    return { user: newUser, message: 'Admin user created successfully' }
  },
)

// Register device for paid user (max 2 devices)
const registerDeviceSchema = z.object({
  deviceFingerprint: z.string().min(1),
})

export const registerDeviceFn = createServerFn({ method: 'POST' })
  .inputValidator(registerDeviceSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Get user profile
    const users = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (users.total === 0) {
      throw new Error('User profile not found')
    }

    const userProfile = users.rows[0]

    // Admin users bypass device limits
    if (userProfile.isAdmin || userProfile.accessLevel === 'exam_admin') {
      return { success: true, message: 'Admin user - no device limit' }
    }

    // Free users don't have device tracking
    if (userProfile.planType === 'free') {
      return { success: true, message: 'Free user - no device tracking' }
    }

    // DEVICE RESTRICTION DISABLED - Allow unlimited devices for paid users
    const deviceFingerprint = data.deviceFingerprint.trim()

    // Ensure deviceIds is always an array (handle null case)
    const currentDevices: string[] = Array.isArray(userProfile.deviceIds)
      ? userProfile.deviceIds.filter(
          (id): id is string => typeof id === 'string' && id.length > 0,
        )
      : []

    // If device is already registered, just update lastDeviceId
    if (currentDevices.includes(deviceFingerprint)) {
      // Only update if lastDeviceId is different to avoid unnecessary writes
      if (userProfile.lastDeviceId !== deviceFingerprint) {
        await db.users.update(userProfile.$id, {
          lastDeviceId: deviceFingerprint,
        })
      }
      return {
        success: true,
        message: 'Device already registered',
        devicesUsed: currentDevices.length,
        maxDevices: null, // Unlimited
      }
    }

    // Register new device - NO LIMIT CHECK
    const updatedDevices = [...currentDevices, deviceFingerprint]

    await db.users.update(userProfile.$id, {
      deviceIds: updatedDevices,
      lastDeviceId: deviceFingerprint,
    })

    return {
      success: true,
      message: 'Device registered successfully',
      devicesUsed: updatedDevices.length,
      maxDevices: null, // Unlimited
    }
  })

// Check device limit status
export const checkDeviceLimitFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Get user profile
    const users = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
    ])

    if (users.total === 0) {
      return { hasLimit: false, devicesUsed: 0, maxDevices: 0 }
    }

    const userProfile = users.rows[0]

    // Admin and free users don't have device limits
    if (
      userProfile.isAdmin ||
      userProfile.accessLevel === 'exam_admin' ||
      userProfile.planType === 'free'
    ) {
      return { hasLimit: false, devicesUsed: 0, maxDevices: 0 }
    }

    const currentDevices = userProfile.deviceIds || []

    return {
      hasLimit: true,
      devicesUsed: currentDevices.length,
      maxDevices: 2,
      devices: currentDevices,
    }
  },
)

// Reset user devices (admin only)
const resetDevicesSchema = z.object({
  userId: z.string(),
})

export const resetUserDevicesFn = createServerFn({ method: 'POST' })
  .inputValidator(resetDevicesSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Check if user is admin
    const adminUser = await db.users.list([
      Query.equal('authUserId', [currentUser.$id]),
      Query.equal('isAdmin', [true]),
    ])

    if (adminUser.total === 0) {
      throw new Error('Access denied: Admin only')
    }

    // Reset devices for target user
    await db.users.update(data.userId, {
      deviceIds: null,
      lastDeviceId: null,
    })

    return { success: true, message: 'User devices reset successfully' }
  })
