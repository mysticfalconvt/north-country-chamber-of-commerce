import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getCurrentUser } from '@/utilities/auth'

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

    const body = await req.json()

    // Only allow updating certain fields
    const allowedFields = [
      'description',
      'phone',
      'email',
      'website',
      'socialLinks',
      'hoursOfOperation',
      'advertisingSlots',
    ]

    const updateData: any = {}
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field]
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
