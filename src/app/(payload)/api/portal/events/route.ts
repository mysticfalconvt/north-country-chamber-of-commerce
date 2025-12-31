import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getCurrentUser } from '@/utilities/auth'

export async function POST(req: NextRequest) {
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

    // Create the event
    const event = await payload.create({
      collection: 'events',
      data: {
        ...body,
        business: businessId,
        submittedBy: user.id,
      },
    })

    return NextResponse.json({ success: true, event })
  } catch (error) {
    payload.logger.error(`Failed to create event: ${error}`)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const payload = await getPayload({ config })

  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'business_member') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 })
    }

    // Verify the event belongs to the user's business
    const existingEvent = await payload.findByID({
      collection: 'events',
      id,
    })

    const businessId = typeof user.business === 'number' ? user.business : user.business?.id
    const eventBusinessId =
      typeof existingEvent.business === 'number'
        ? existingEvent.business
        : existingEvent.business?.id

    if (eventBusinessId !== businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update the event
    const event = await payload.update({
      collection: 'events',
      id,
      data: updateData,
    })

    return NextResponse.json({ success: true, event })
  } catch (error) {
    payload.logger.error(`Failed to update event: ${error}`)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}
