import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { sendWelcomeEmail } from '@/utilities/email'
import { generateSecurePassword } from '@/utilities/generatePassword'
import { validateImageFile, sanitizeFilename } from '@/utilities/fileValidation'
import { getSafeErrorMessage } from '@/utilities/errorLogging'

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })

  try {
    // Authenticate using Payload cookies
    const { user: userData } = await payload.auth({ headers: req.headers })

    if (!userData) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (userData.role !== 'admin' && userData.role !== 'chamber_staff') {
      return NextResponse.json(
        { error: 'Unauthorized - requires admin or chamber_staff role' },
        { status: 403 },
      )
    }

    const formData = await req.formData()

    const businessName = (formData.get('businessName') as string)?.trim()
    const contactName = (formData.get('contactName') as string)?.trim()
    const email = (formData.get('email') as string)?.trim().toLowerCase()
    const phone = (formData.get('phone') as string)?.trim()
    const address = (formData.get('address') as string)?.trim()
    const city = (formData.get('city') as string)?.trim()
    const state = (formData.get('state') as string)?.trim()
    const zipCode = (formData.get('zipCode') as string)?.trim()
    const website = ((formData.get('website') as string) || '').trim()
    const description = ((formData.get('description') as string) || '').trim()
    const hoursOfOperation = ((formData.get('hoursOfOperation') as string) || '').trim()
    const tier = (formData.get('tier') as string)?.trim()
    const categoriesStr = (formData.get('categories') as string) || ''
    const coordinatesStr = (formData.get('coordinates') as string) || ''
    const logoFile = formData.get('logo') as File | null
    const coverImageFile = formData.get('coverImage') as File | null

    if (
      !businessName ||
      !contactName ||
      !email ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !zipCode ||
      !tier ||
      !categoriesStr
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const categories = categoriesStr
      .split(',')
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id))

    if (categories.length === 0) {
      return NextResponse.json({ error: 'At least one category is required' }, { status: 400 })
    }

    let coordinates: { latitude: number | null; longitude: number | null } | undefined
    if (coordinatesStr) {
      try {
        const parsed = JSON.parse(coordinatesStr)
        coordinates = {
          latitude: parsed.latitude !== null && parsed.latitude !== undefined
            ? Number(parsed.latitude)
            : null,
          longitude: parsed.longitude !== null && parsed.longitude !== undefined
            ? Number(parsed.longitude)
            : null,
        }
      } catch {
        return NextResponse.json({ error: 'Invalid coordinates format' }, { status: 400 })
      }
    } else {
      // Trigger geocoding from address
      coordinates = { latitude: null, longitude: null }
    }

    const membershipTiersGlobal = await payload.findGlobal({ slug: 'membershipTiers' })
    const tierData = (membershipTiersGlobal as any)?.tiers?.find((t: any) => t.slug === tier)

    if (!tierData) {
      return NextResponse.json({ error: 'Invalid membership tier' }, { status: 400 })
    }

    const existingUser = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
    })

    if (existingUser.docs.length > 0) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 },
      )
    }

    let logoId: number | null = null
    if (logoFile && logoFile.size > 0) {
      const validation = validateImageFile(logoFile)
      if (!validation.valid) {
        return NextResponse.json(
          { error: `Invalid logo file: ${validation.error}` },
          { status: 400 },
        )
      }

      const arrayBuffer = await logoFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const safeName = sanitizeFilename(logoFile.name)

      const mediaResult = await payload.create({
        collection: 'media',
        data: { alt: `${businessName} logo` },
        file: {
          data: buffer,
          mimetype: logoFile.type,
          name: safeName,
          size: logoFile.size,
        },
      })

      logoId =
        typeof mediaResult.id === 'number' ? mediaResult.id : parseInt(mediaResult.id as string)
    }

    let coverImageId: number | null = null
    if (coverImageFile && coverImageFile.size > 0) {
      const validation = validateImageFile(coverImageFile)
      if (!validation.valid) {
        return NextResponse.json(
          { error: `Invalid cover image file: ${validation.error}` },
          { status: 400 },
        )
      }

      const arrayBuffer = await coverImageFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const safeName = sanitizeFilename(coverImageFile.name)

      const mediaResult = await payload.create({
        collection: 'media',
        data: { alt: `${businessName} cover image` },
        file: {
          data: buffer,
          mimetype: coverImageFile.type,
          name: safeName,
          size: coverImageFile.size,
        },
      })

      coverImageId =
        typeof mediaResult.id === 'number' ? mediaResult.id : parseInt(mediaResult.id as string)
    }

    const now = new Date()
    const expires = new Date()
    expires.setFullYear(expires.getFullYear() + 1)

    const buildLexical = (text: string) => ({
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', text }],
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    })

    const business = await payload.create({
      collection: 'businesses',
      data: {
        name: businessName,
        description: buildLexical(description),
        hoursOfOperation: hoursOfOperation ? buildLexical(hoursOfOperation) : undefined,
        address,
        city,
        state,
        zipCode,
        coordinates,
        phone,
        email,
        website: website || undefined,
        membershipTier: tier,
        membershipStatus: 'active',
        approvalStatus: 'approved',
        paymentStatus: 'paid',
        applicationDate: now.toISOString(),
        memberSince: now.toISOString(),
        membershipExpires: expires.toISOString(),
        approvedBy: userData.id,
        approvedAt: now.toISOString(),
        category: categories,
        logo: logoId || undefined,
        coverImage: coverImageId || undefined,
      } as any,
    })

    const tempPassword = generateSecurePassword(12)

    const user = await payload.create({
      collection: 'users',
      data: {
        name: contactName,
        email,
        password: tempPassword,
        role: 'business_member',
        business: business.id,
      },
    })

    payload.logger.info(
      `Admin ${userData.id} created business ${business.id} on behalf of user ${user.id}`,
    )

    await payload.update({
      collection: 'businesses',
      id: business.id,
      data: { owner: user.id } as any,
      context: { skipUserUpdate: true },
    })

    try {
      await sendWelcomeEmail({
        to: email,
        businessName,
        tempPassword,
      })
      payload.logger.info(`Sent welcome email to ${email}`)
    } catch (error) {
      payload.logger.error(`Failed to send welcome email: ${getSafeErrorMessage(error)}`)
      // Don't fail the request if the email fails — the business is already created.
    }

    return NextResponse.json({
      success: true,
      businessId: business.id,
      businessSlug: (business as any).slug,
    })
  } catch (error) {
    payload.logger.error(`Failed to create business on behalf: ${getSafeErrorMessage(error)}`)
    return NextResponse.json(
      { error: 'Failed to create business. Please try again.' },
      { status: 500 },
    )
  }
}
