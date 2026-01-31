import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { cookies } from 'next/headers'
import { sendWelcomeEmail, sendBusinessRejectedEmail } from '@/utilities/email'
import { generateSecurePassword } from '@/utilities/generatePassword'

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })

  try {
    // Authenticate user using Payload's cookie-based auth
    const cookieStore = await cookies()
    const token = cookieStore.get('payload-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify the token and get user
    const { user: userData } = await payload.auth({ headers: req.headers })

    if (!userData) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin or chamber_staff
    if (userData.role !== 'admin' && userData.role !== 'chamber_staff') {
      return NextResponse.json(
        { error: 'Unauthorized - requires admin or chamber_staff role' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { businessId, action, rejectionReason } = body

    if (!businessId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: businessId and action' },
        { status: 400 }
      )
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Get the business
    const business = (await payload.findByID({
      collection: 'businesses',
      id: businessId,
    })) as any

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (business.approvalStatus === 'approved') {
      return NextResponse.json(
        { error: 'Business is already approved' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      // Calculate membership expiration (1 year from today)
      const startDate = new Date()
      const endDate = new Date()
      endDate.setFullYear(endDate.getFullYear() + 1)

      // Update business approval status and payment status
      await payload.update({
        collection: 'businesses',
        id: businessId,
        data: {
          approvalStatus: 'approved',
          membershipStatus: 'active',
          paymentStatus: 'paid',
          approvedBy: userData.id,
          approvedAt: new Date().toISOString(),
          memberSince: startDate.toISOString(),
          membershipExpires: endDate.toISOString(),
        } as any,
      })

      // Get the user associated with this business
      const businessOwner = await payload.find({
        collection: 'users',
        where: {
          business: { equals: businessId },
        },
        limit: 1,
      })

      // Send welcome email with temp password
      if (businessOwner.docs.length > 0) {
        const owner = businessOwner.docs[0]
        // Generate a new temporary password
        const tempPassword = generateSecurePassword(12)

        // Update user password
        await payload.update({
          collection: 'users',
          id: owner.id,
          data: {
            password: tempPassword,
          },
        })

        try {
          await sendWelcomeEmail({
            to: owner.email,
            businessName: business.name,
            tempPassword,
          })
          payload.logger.info(`Sent welcome email to ${owner.email}`)
        } catch (error) {
          payload.logger.error(`Failed to send welcome email: ${error}`)
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Business approved successfully',
        businessId,
      })
    } else {
      // Reject the business
      await payload.update({
        collection: 'businesses',
        id: businessId,
        data: {
          approvalStatus: 'rejected',
          rejectionReason: rejectionReason || undefined,
        } as any,
      })

      // Send rejection email
      try {
        await sendBusinessRejectedEmail({
          to: business.email,
          businessName: business.name,
          reason: rejectionReason,
        })
        payload.logger.info(`Sent rejection email to ${business.email}`)
      } catch (error) {
        payload.logger.error(`Failed to send rejection email: ${error}`)
      }

      return NextResponse.json({
        success: true,
        message: 'Business rejected',
        businessId,
      })
    }
  } catch (error) {
    payload.logger.error(`Failed to process business approval: ${error}`)
    return NextResponse.json(
      { error: 'Failed to process approval. Please try again.' },
      { status: 500 }
    )
  }
}
