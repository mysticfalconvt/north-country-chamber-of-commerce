import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { sendWelcomeEmail } from '@/utilities/email'
import { generateSecurePassword } from '@/utilities/generatePassword'
import { validateImageFile, sanitizeFilename } from '@/utilities/fileValidation'
import { getSafeErrorMessage } from '@/utilities/errorLogging'

// Build a minimal Lexical richText document from plain text
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

// Upload an image file to the media collection, returning its id
async function uploadMedia(
  payload: Awaited<ReturnType<typeof getPayload>>,
  file: File,
  alt: string,
): Promise<number> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const safeName = sanitizeFilename(file.name)

  const mediaResult = await payload.create({
    collection: 'media',
    data: { alt },
    file: {
      data: buffer,
      mimetype: file.type,
      name: safeName,
      size: file.size,
    },
  })

  return typeof mediaResult.id === 'number' ? mediaResult.id : parseInt(mediaResult.id as string)
}

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

    const businessId = parseInt((formData.get('businessId') as string) || '')
    const action = (formData.get('action') as string) || 'save'

    if (!businessId || isNaN(businessId)) {
      return NextResponse.json({ error: 'Missing or invalid businessId' }, { status: 400 })
    }

    if (action !== 'save' && action !== 'approve') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "save" or "approve"' },
        { status: 400 },
      )
    }

    // Load the business
    const business = (await payload.findByID({
      collection: 'businesses',
      id: businessId,
    })) as any

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // ---- Parse fields ----
    const name = (formData.get('name') as string)?.trim()
    const phone = (formData.get('phone') as string)?.trim()
    const email = (formData.get('email') as string)?.trim().toLowerCase()
    const website = ((formData.get('website') as string) || '').trim()
    const address = (formData.get('address') as string)?.trim()
    const city = (formData.get('city') as string)?.trim()
    const state = (formData.get('state') as string)?.trim()
    const zipCode = (formData.get('zipCode') as string)?.trim()
    const description = ((formData.get('description') as string) || '').trim()
    const hoursOfOperation = ((formData.get('hoursOfOperation') as string) || '').trim()
    const tier = (formData.get('tier') as string)?.trim()
    const categoriesStr = (formData.get('categories') as string) || ''
    const coordinatesStr = (formData.get('coordinates') as string) || ''
    const ownerName = (formData.get('ownerName') as string)?.trim()
    const ownerEmail = (formData.get('ownerEmail') as string)?.trim().toLowerCase()
    const removeLogo = formData.get('removeLogo') === 'true'
    const removeCoverImage = formData.get('removeCoverImage') === 'true'
    const logoFile = formData.get('logo') as File | null
    const coverImageFile = formData.get('coverImage') as File | null

    if (!name) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 })
    }

    const categories = categoriesStr
      .split(',')
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id))

    if (categories.length === 0) {
      return NextResponse.json({ error: 'At least one category is required' }, { status: 400 })
    }

    // Validate the tier against the global config
    if (tier) {
      const membershipTiersGlobal = await payload.findGlobal({ slug: 'membershipTiers' })
      const tierData = (membershipTiersGlobal as any)?.tiers?.find((t: any) => t.slug === tier)
      if (!tierData) {
        return NextResponse.json({ error: 'Invalid membership tier' }, { status: 400 })
      }
    }

    // Parse coordinates (blank -> null triggers address geocoding hook)
    let coordinates: { latitude: number | null; longitude: number | null } = {
      latitude: null,
      longitude: null,
    }
    if (coordinatesStr) {
      try {
        const parsed = JSON.parse(coordinatesStr)
        coordinates = {
          latitude:
            parsed.latitude !== null && parsed.latitude !== undefined
              ? Number(parsed.latitude)
              : null,
          longitude:
            parsed.longitude !== null && parsed.longitude !== undefined
              ? Number(parsed.longitude)
              : null,
        }
      } catch {
        return NextResponse.json({ error: 'Invalid coordinates format' }, { status: 400 })
      }
    }

    // ---- Owner resolution (match-by-email-else-create) ----
    // Current owner linked to this business (if any)
    const currentOwnerResult = await payload.find({
      collection: 'users',
      where: { business: { equals: businessId } },
      limit: 1,
    })
    const currentOwner = currentOwnerResult.docs[0]

    let ownerId: number | null = currentOwner ? (currentOwner.id as number) : null
    let createdNewUser = false
    let newUserTempPassword = ''

    if (ownerEmail) {
      const existing = await payload.find({
        collection: 'users',
        where: { email: { equals: ownerEmail } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        const matchedUser = existing.docs[0]
        ownerId = matchedUser.id as number

        // Link the matched user to this business (if not already)
        await payload.update({
          collection: 'users',
          id: matchedUser.id,
          data: {
            business: businessId,
            ...(ownerName ? { name: ownerName } : {}),
          } as any,
          context: { skipUserUpdate: true },
        })

        // Unlink the previous owner if it was a different user
        if (currentOwner && currentOwner.id !== matchedUser.id) {
          await payload.update({
            collection: 'users',
            id: currentOwner.id,
            data: { business: null } as any,
            context: { skipUserUpdate: true },
          })
        }
      } else {
        // Create a brand-new business_member user
        newUserTempPassword = generateSecurePassword(12)
        const created = await payload.create({
          collection: 'users',
          data: {
            name: ownerName || name,
            email: ownerEmail,
            password: newUserTempPassword,
            role: 'business_member',
            business: businessId,
          },
          context: { skipUserUpdate: true },
        })
        ownerId = created.id as number
        createdNewUser = true

        // Unlink the previous owner (replaced)
        if (currentOwner && currentOwner.id !== created.id) {
          await payload.update({
            collection: 'users',
            id: currentOwner.id,
            data: { business: null } as any,
            context: { skipUserUpdate: true },
          })
        }
      }
    } else if (currentOwner && ownerName && ownerName !== currentOwner.name) {
      // No email change, but the owner's name was edited
      await payload.update({
        collection: 'users',
        id: currentOwner.id,
        data: { name: ownerName } as any,
        context: { skipUserUpdate: true },
      })
    }

    // ---- Images ----
    const updateData: any = {
      name,
      phone,
      email: email || undefined,
      website: website || undefined,
      address,
      city,
      state,
      zipCode,
      coordinates,
      category: categories,
      // Only overwrite richText fields when text was provided; an empty value would
      // produce an invalid (empty) Lexical document and is rejected by Payload.
      description: description ? buildLexical(description) : undefined,
      hoursOfOperation: hoursOfOperation ? buildLexical(hoursOfOperation) : undefined,
    }

    if (tier) {
      updateData.membershipTier = tier
    }

    if (ownerId) {
      updateData.owner = ownerId
    }

    if (logoFile && logoFile.size > 0) {
      const validation = validateImageFile(logoFile)
      if (!validation.valid) {
        return NextResponse.json({ error: `Invalid logo file: ${validation.error}` }, { status: 400 })
      }
      updateData.logo = await uploadMedia(payload, logoFile, `${name} logo`)
    } else if (removeLogo) {
      updateData.logo = null
    }

    if (coverImageFile && coverImageFile.size > 0) {
      const validation = validateImageFile(coverImageFile)
      if (!validation.valid) {
        return NextResponse.json(
          { error: `Invalid cover image file: ${validation.error}` },
          { status: 400 },
        )
      }
      updateData.coverImage = await uploadMedia(payload, coverImageFile, `${name} cover image`)
    } else if (removeCoverImage) {
      updateData.coverImage = null
    }

    // ---- Approval branch ----
    if (action === 'approve') {
      const startDate = new Date()
      const endDate = new Date()
      endDate.setFullYear(endDate.getFullYear() + 1)

      updateData.approvalStatus = 'approved'
      updateData.membershipStatus = 'active'
      updateData.paymentStatus = 'paid'
      updateData.approvedBy = userData.id
      updateData.approvedAt = startDate.toISOString()
      updateData.memberSince = startDate.toISOString()
      updateData.membershipExpires = endDate.toISOString()
    }

    // ---- Persist the business ----
    await payload.update({
      collection: 'businesses',
      id: businessId,
      data: updateData,
      context: { skipUserUpdate: true },
    })

    // ---- Welcome email ----
    // Only email when we created a brand-new account in this request — they need their
    // login credentials. An existing owner (e.g. someone who self-registered) already has
    // an account and credentials, so we don't reset their password or re-send a welcome
    // email on approval. This applies to both "save" and "approve".
    if (createdNewUser && ownerEmail) {
      try {
        await sendWelcomeEmail({
          to: ownerEmail,
          businessName: name,
          tempPassword: newUserTempPassword,
        })
        payload.logger.info(`Sent welcome email to ${ownerEmail}`)
      } catch (error) {
        payload.logger.error(`Failed to send welcome email: ${getSafeErrorMessage(error)}`)
      }
    }

    payload.logger.info(
      `Admin ${userData.id} performed "${action}" on business ${businessId}`,
    )

    return NextResponse.json({ success: true, businessId, action })
  } catch (error) {
    payload.logger.error(`Failed to process business review: ${getSafeErrorMessage(error)}`)

    // Surface Payload field-validation errors to the user (safe, actionable messages)
    const err = error as any
    if (err?.name === 'ValidationError') {
      const fieldErrors: any[] = err?.data?.errors || []
      const detail =
        fieldErrors.length > 0
          ? fieldErrors
              .map((e) => {
                const field = typeof e.label === 'string' ? e.label : e.path
                return field ? `${field}: ${e.message}` : e.message
              })
              .join('; ')
          : err.message
      return NextResponse.json(
        { error: detail || 'Some fields are invalid. Please review and try again.' },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: 'Failed to save changes. Please try again.' },
      { status: 500 },
    )
  }
}
