import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../lib/db'
import { Query, Permission, Role } from 'node-appwrite'

// Schema for interest registration
const registerInterestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Please enter a valid email').max(255),
  specialty: z.string().min(1, 'Specialty is required').max(255),
  level: z.enum(['PGY-1', 'PGY-2', 'PGY-3', 'PGY-4', 'PGY-5', 'PGY-6'], {
    message: 'Please select a valid PGY level',
  }),
})

// Register interest (public - no auth required)
export const registerInterestFn = createServerFn({ method: 'POST' })
  .inputValidator(registerInterestSchema)
  .handler(async ({ data }) => {
    const { name, email, specialty, level } = data

    // Check if email already registered
    const existing = await db.interestRegistrations.list([
      Query.equal('email', [email.toLowerCase().trim()]),
    ])

    if (existing.total > 0) {
      // Already registered - return success without error
      return {
        success: true,
        message: 'You are already on our interest list!',
        alreadyRegistered: true,
      }
    }

    // Create new registration with anonymous createdBy since no auth required
    await db.interestRegistrations.create(
      {
        createdBy: 'anonymous',
        name: name.trim(),
        email: email.toLowerCase().trim(),
        status: 'pending',
        notes: `Specialty: ${specialty} | Level: ${level}`,
      },
      {
        permissions: [
          Permission.read(Role.any()),
          Permission.write(Role.any()),
        ],
      },
    )

    return {
      success: true,
      message: 'Thank you for your interest! We will be in touch soon.',
      alreadyRegistered: false,
    }
  })

// Get interest registration count (for admin dashboard)
export const getInterestCountFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const result = await db.interestRegistrations.list([Query.limit(1)])
    return { count: result.total }
  },
)
