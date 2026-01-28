import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { sendBusinessApprovalNotification } from '@/utilities/email'

// Generate a random temporary password
function generateTempPassword(length: number = 10): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

export async function POST(req: NextRequest) {
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
      try {
        // Convert File to Buffer
        const arrayBuffer = await logoFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload to media collection
        const mediaResult = await payload.create({
          collection: 'media',
          data: {
            alt: `${businessName} logo`,
          },
          file: {
            data: buffer,
            mimetype: logoFile.type,
            name: logoFile.name,
            size: logoFile.size,
          },
        })

        logoId = typeof mediaResult.id === 'number' ? mediaResult.id : parseInt(mediaResult.id as string)
      } catch (error) {
        payload.logger.error(`Failed to upload logo: ${error}`)
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
              },
            ],
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
      },
    })

    // Generate temporary password for user account
    const tempPassword = generateTempPassword(12)

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

    // Get all admin and chamber_staff emails
    const admins = await payload.find({
      collection: 'users',
      where: {
        or: [
          { role: { equals: 'admin' } },
          { role: { equals: 'chamber_staff' } },
        ],
      },
      limit: 100,
    })

    const adminEmails = admins.docs.map(admin => admin.email).filter(Boolean) as string[]

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
        payload.logger.info(`Sent approval notification to ${adminEmails.length} admins`)
      } catch (error) {
        payload.logger.error(`Failed to send approval notification: ${error}`)
        // Continue - don't fail the application if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      businessId: business.id,
      tier: tierData.name,
      tierPrice: tierData.annualPrice,
    })
  } catch (error) {
    payload.logger.error(`Failed to process business application: ${error}`)
    return NextResponse.json(
      { error: 'Failed to process application. Please try again.' },
      { status: 500 }
    )
  }
}
