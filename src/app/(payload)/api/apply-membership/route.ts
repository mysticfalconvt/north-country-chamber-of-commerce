import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { sendBusinessApprovalNotification, sendApplicationReceivedEmail } from '@/utilities/email'
import { generateSecurePassword } from '@/utilities/generatePassword'
import { rateLimiters } from '@/utilities/rateLimit'
import { getAdminNotificationEmails } from '@/utilities/getAdminEmails'
import { validateImageFile, sanitizeFilename } from '@/utilities/fileValidation'
import { getSafeErrorMessage } from '@/utilities/errorLogging'

export async function POST(req: NextRequest) {
  // Rate limit: 5 requests per 15 minutes per IP
  const rateLimitResponse = rateLimiters.membershipApplication(req)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const payload = await getPayload({ config })

  try {
    const formData = await req.formData()

    // Extract form fields
    const businessName = formData.get('businessName') as string
    const contactName = formData.get('contactName') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const address = formData.get('address') as string
    const city = formData.get('city') as string
    const state = formData.get('state') as string
    const zipCode = formData.get('zipCode') as string
    const website = formData.get('website') as string | null
    const description = formData.get('description') as string
    const tier = formData.get('tier') as string
    const categoriesStr = formData.get('categories') as string
    const logoFile = formData.get('logo') as File | null

    // Validate required fields
    if (!businessName || !contactName || !email || !phone || !address || !city || !state || !zipCode || !tier || !categoriesStr) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Parse categories (expecting comma-separated IDs)
    const categories = categoriesStr.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))

    if (categories.length === 0) {
      return NextResponse.json(
        { error: 'At least one category is required' },
        { status: 400 }
      )
    }

    // Get tier details for email
    const membershipTiersGlobal = await payload.findGlobal({
      slug: 'membershipTiers',
    })
    const tierData = membershipTiersGlobal?.tiers?.find((t: any) => t.slug === tier)

    if (!tierData) {
      return NextResponse.json({ error: 'Invalid membership tier' }, { status: 400 })
    }

    // Upload logo if provided
    let logoId: number | null = null
    if (logoFile && logoFile.size > 0) {
      // Validate file before upload
      const validation = validateImageFile(logoFile)
      if (!validation.valid) {
        return NextResponse.json(
          { error: `Invalid logo file: ${validation.error}` },
          { status: 400 }
        )
      }

      try {
        // Convert File to Buffer
        const arrayBuffer = await logoFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Sanitize filename to prevent path traversal
        const safeName = sanitizeFilename(logoFile.name)

        // Upload to media collection
        const mediaResult = await payload.create({
          collection: 'media',
          data: {
            alt: `${businessName} logo`,
          },
          file: {
            data: buffer,
            mimetype: logoFile.type,
            name: safeName,
            size: logoFile.size,
          },
        })

        logoId = typeof mediaResult.id === 'number' ? mediaResult.id : parseInt(mediaResult.id as string)
      } catch (error) {
        payload.logger.error('Failed to upload logo')
        // Continue without logo rather than failing the application
      }
    }

    // Create business record
    const business = await payload.create({
      collection: 'businesses',
      data: {
        name: businessName,
        description: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [{ type: 'text', text: description || '' }],
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        },
        address,
        city,
        state,
        zipCode,
        phone,
        email,
        website: website || undefined,
        membershipTier: tier,
        membershipStatus: 'pending',
        approvalStatus: 'pending',
        applicationDate: new Date().toISOString(),
        category: categories,
        logo: logoId || undefined,
      } as any,
    })

    // Generate temporary password for user account
    const tempPassword = generateSecurePassword(12)

    // Create user account
    const user = await payload.create({
      collection: 'users',
      data: {
        name: contactName,
        email: email,
        password: tempPassword,
        role: 'business_member',
        business: business.id,
      },
    })

    payload.logger.info(`Created user ${user.id} for business ${business.id}`)

    // Update business to set owner (bidirectional link)
    await payload.update({
      collection: 'businesses',
      id: business.id,
      data: {
        owner: user.id,
      } as any,
      context: {
        skipUserUpdate: true, // Prevent hook recursion
      },
    })

    payload.logger.info(`Set business ${business.id} owner to user ${user.id}`)

    // Get admin notification emails (from env var or fallback to database)
    const adminEmails = await getAdminNotificationEmails(payload)

    // Send approval notification emails to admins
    if (adminEmails.length > 0) {
      try {
        await sendBusinessApprovalNotification({
          businessId: typeof business.id === 'number' ? business.id : parseInt(business.id as string),
          businessName,
          tier: tierData.name,
          contactEmail: email,
          contactName,
          adminEmails,
        })
        payload.logger.info('Sent business approval notification to admins')
      } catch (error) {
        payload.logger.error(`Failed to send approval notification: ${getSafeErrorMessage(error)}`)
        // Continue - don't fail the application if email fails
      }
    }

    // Send confirmation email to applicant with their credentials
    try {
      await sendApplicationReceivedEmail({
        to: email,
        businessName,
        contactName,
        tempPassword,
        tier: tierData.name,
        tierPrice: tierData.annualPrice,
      })
      payload.logger.info(`Sent application received email to ${email}`)
    } catch (error) {
      payload.logger.error(`Failed to send application received email: ${getSafeErrorMessage(error)}`)
      // Continue - don't fail the application if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      businessId: business.id,
      tier: tierData.name,
      tierPrice: tierData.annualPrice,
    })
  } catch (error) {
    payload.logger.error(`Failed to process business application: ${getSafeErrorMessage(error)}`)
    return NextResponse.json(
      { error: 'Failed to process application. Please try again.' },
      { status: 500 }
    )
  }
}
