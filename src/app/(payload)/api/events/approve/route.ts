import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const payload = await getPayload({ config })

  try {
    // Get the event ID from query params
    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('id')

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 })
    }

    // Verify user is authenticated and has permission
    const cookieStore = await cookies()
    const token = cookieStore.get('payload-token')?.value

    if (!token) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(
        new URL(`/admin/login?redirect=/admin/collections/events/${eventId}`, req.url),
      )
    }

    // Verify the token and get user
    const { user } = await payload.auth({ headers: req.headers })

    if (!user || (user.role !== 'admin' && user.role !== 'chamber_staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get the event
    const event = await payload.findByID({
      collection: 'events',
      id: parseInt(eventId, 10),
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Update event status to published
    await payload.update({
      collection: 'events',
      id: parseInt(eventId, 10),
      data: {
        eventStatus: 'published',
      },
    })

    payload.logger.info(`Event "${event.title}" (ID: ${eventId}) approved by ${user.email}`)

    // Redirect to the event in admin panel
    return NextResponse.redirect(new URL(`/admin/collections/events/${eventId}`, req.url))
  } catch (error) {
    payload.logger.error(`Failed to approve event: ${error}`)
    return NextResponse.json({ error: 'Failed to approve event' }, { status: 500 })
  }
}
