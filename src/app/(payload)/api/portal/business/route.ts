import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getCurrentUser } from '@/utilities/auth'
import { validateImageFile, sanitizeFilename } from '@/utilities/fileValidation'

export async function PATCH(req: NextRequest) {
  const payload = await getPayload({ config })

  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'business_member') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's business
    const businessId = typeof user.business === 'number' ? user.business : user.business?.id

    if (!businessId) {
      return NextResponse.json({ error: 'No business linked to account' }, { status: 400 })
    }

    // Check content type to determine how to parse the request
    const contentType = req.headers.get('content-type') || ''
    let body: any = {}
    let logoFile: File | null = null
    let coverImageFile: File | null = null

    if (contentType.includes('multipart/form-data')) {
      // Parse FormData
      const formData = await req.formData()

      // Extract files
      logoFile = formData.get('logo') as File | null
      coverImageFile = formData.get('coverImage') as File | null

      // Extract other fields (may be JSON strings)
      const description = formData.get('description')
      const hoursOfOperation = formData.get('hoursOfOperation')
      const coordinates = formData.get('coordinates')

      body = {
        description: description ? JSON.parse(description as string) : undefined,
        hoursOfOperation: hoursOfOperation ? JSON.parse(hoursOfOperation as string) : undefined,
        coordinates: coordinates ? JSON.parse(coordinates as string) : undefined,
        phone: formData.get('phone') as string,
        email: formData.get('email') as string,
        website: formData.get('website') as string,
        address: formData.get('address') as string,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        zipCode: formData.get('zipCode') as string,
        removeLogo: formData.get('removeLogo') === 'true',
        removeCoverImage: formData.get('removeCoverImage') === 'true',
      }
    } else {
      // Parse JSON
      body = await req.json()
    }

    // Only allow updating certain fields
    const allowedFields = [
      'description',
      'phone',
      'email',
      'website',
      'socialLinks',
      'hoursOfOperation',
      'advertisingSlots',
      'address',
      'city',
      'state',
      'zipCode',
      'coordinates',
      'logo',
      'coverImage',
    ]

    const updateData: any = {}
    for (const field of allowedFields) {
      if (field in body && body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Handle logo removal
    if (body.removeLogo && !logoFile) {
      updateData.logo = null
    }

    // Handle cover image removal
    if (body.removeCoverImage && !coverImageFile) {
      updateData.coverImage = null
    }

    // Get current business for name (used in alt text)
    const currentBusiness = await payload.findByID({
      collection: 'businesses',
      id: businessId,
    })

    // Upload logo if provided
    if (logoFile && logoFile.size > 0) {
      const validation = validateImageFile(logoFile)
      if (!validation.valid) {
        return NextResponse.json(
          { error: `Invalid logo file: ${validation.error}` },
          { status: 400 }
        )
      }

      try {
        const arrayBuffer = await logoFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const safeName = sanitizeFilename(logoFile.name)

        const mediaResult = await payload.create({
          collection: 'media',
          data: {
            alt: `${currentBusiness.name} logo`,
          },
          file: {
            data: buffer,
            mimetype: logoFile.type,
            name: safeName,
            size: logoFile.size,
          },
        })

        updateData.logo = typeof mediaResult.id === 'number' ? mediaResult.id : parseInt(mediaResult.id as string)
      } catch (error) {
        payload.logger.error(`Failed to upload logo: ${error}`)
        return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 })
      }
    }

    // Upload cover image if provided
    if (coverImageFile && coverImageFile.size > 0) {
      const validation = validateImageFile(coverImageFile)
      if (!validation.valid) {
        return NextResponse.json(
          { error: `Invalid cover image file: ${validation.error}` },
          { status: 400 }
        )
      }

      try {
        const arrayBuffer = await coverImageFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const safeName = sanitizeFilename(coverImageFile.name)

        const mediaResult = await payload.create({
          collection: 'media',
          data: {
            alt: `${currentBusiness.name} cover image`,
          },
          file: {
            data: buffer,
            mimetype: coverImageFile.type,
            name: safeName,
            size: coverImageFile.size,
          },
        })

        updateData.coverImage = typeof mediaResult.id === 'number' ? mediaResult.id : parseInt(mediaResult.id as string)
      } catch (error) {
        payload.logger.error(`Failed to upload cover image: ${error}`)
        return NextResponse.json({ error: 'Failed to upload cover image' }, { status: 500 })
      }
    }

    // Update the business
    const updatedBusiness = await payload.update({
      collection: 'businesses',
      id: businessId,
      data: updateData,
    })

    return NextResponse.json({ success: true, business: updatedBusiness })
  } catch (error) {
    payload.logger.error(`Failed to update business: ${error}`)
    return NextResponse.json({ error: 'Failed to update business' }, { status: 500 })
  }
}
