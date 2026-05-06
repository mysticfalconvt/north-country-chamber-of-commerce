import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getCurrentUser } from '@/utilities/auth'

export async function POST(_req: NextRequest) {
  const payload = await getPayload({ config })

  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'admin' && user.role !== 'chamber_staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const empties = await payload.find({
      collection: 'events',
      where: {
        or: [
          { title: { equals: null } },
          { title: { equals: '' } },
          { title: { exists: false } },
        ],
      },
      depth: 0,
      locale: 'en',
      limit: 0,
      pagination: false,
    })

    let deleted = 0
    let failed = 0

    for (const event of empties.docs) {
      try {
        await payload.delete({ collection: 'events', id: event.id })
        deleted += 1
      } catch (err) {
        failed += 1
        payload.logger.error(`Failed to delete empty event ${event.id}: ${err}`)
      }
    }

    payload.logger.info(`Empty-event cleanup by ${user.email}: deleted=${deleted} failed=${failed}`)

    return NextResponse.json({ success: true, deleted, failed })
  } catch (error) {
    payload.logger.error(`Empty-event cleanup failed: ${error}`)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
