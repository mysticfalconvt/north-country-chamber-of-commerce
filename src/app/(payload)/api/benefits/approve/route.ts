import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { cookies } from 'next/headers'
import { sendBenefitApprovedEmail } from '@/utilities/email'

export async function GET(req: NextRequest) {
  const payload = await getPayload({ config })

  try {
    // Get the benefit ID from query params
    const { searchParams } = new URL(req.url)
    const benefitId = searchParams.get('id')

    if (!benefitId) {
      return NextResponse.json({ error: 'Benefit ID required' }, { status: 400 })
    }

    // Verify user is authenticated and has permission
    const cookieStore = await cookies()
    const token = cookieStore.get('payload-token')?.value

    if (!token) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(
        new URL(`/admin/login?redirect=/admin/collections/benefits/${benefitId}`, req.url),
      )
    }

    // Verify the token and get user
    const { user } = await payload.auth({ headers: req.headers })

    if (!user || (user.role !== 'admin' && user.role !== 'chamber_staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get the benefit
    const benefit = await payload.findByID({
      collection: 'benefits',
      id: parseInt(benefitId, 10),
    })

    if (!benefit) {
      return NextResponse.json({ error: 'Benefit not found' }, { status: 404 })
    }

    // Update benefit status to published
    await payload.update({
      collection: 'benefits',
      id: parseInt(benefitId, 10),
      data: {
        benefitStatus: 'published',
      },
    })

    payload.logger.info(`Benefit "${benefit.title}" (ID: ${benefitId}) approved by ${user.email}`)

    // Send approval notification to the submitter
    if (benefit.submittedBy) {
      try {
        const submitterId =
          typeof benefit.submittedBy === 'number'
            ? benefit.submittedBy
            : (benefit.submittedBy as any).id
        const submitter = await payload.findByID({
          collection: 'users',
          id: submitterId,
        })

        if (submitter?.email) {
          const benefitTitle =
            typeof benefit.title === 'string'
              ? benefit.title
              : (benefit.title as any)?.en || 'Your Benefit'
          await sendBenefitApprovedEmail({
            to: submitter.email,
            benefitTitle,
            benefitSlug: benefit.slug || benefitId,
          })
          payload.logger.info(`Sent benefit approval notification to ${submitter.email}`)
        }
      } catch (emailError) {
        payload.logger.error(`Failed to send benefit approval email: ${emailError}`)
        // Don't fail the approval if email fails
      }
    }

    // Redirect to the benefit in admin panel
    return NextResponse.redirect(new URL(`/admin/collections/benefits/${benefitId}`, req.url))
  } catch (error) {
    payload.logger.error(`Failed to approve benefit: ${error}`)
    return NextResponse.json({ error: 'Failed to approve benefit' }, { status: 500 })
  }
}
