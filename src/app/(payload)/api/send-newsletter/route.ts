import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { sendNewsletterEmail } from '@/utilities/email'
import { headers } from 'next/headers'

// Helper function to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })

  try {
    // Authenticate user using Payload's auth
    const headersList = await headers()
    const { user } = await payload.auth({ headers: headersList })

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user is admin or chamber_staff
    if (user.role !== 'admin' && user.role !== 'chamber_staff') {
      return NextResponse.json(
        { error: 'Unauthorized - requires admin or chamber_staff role' },
        { status: 403 }
      )
    }

    const userData = user

    const body = await req.json()
    // Support both newsId and announcementId for backward compatibility
    const newsId = body.newsId || body.announcementId

    if (!newsId) {
      return NextResponse.json({ error: 'newsId is required' }, { status: 400 })
    }

    // Fetch news item
    const newsItem = (await payload.findByID({
      collection: 'news',
      id: newsId,
      depth: 1,
    })) as any

    if (!newsItem) {
      return NextResponse.json({ error: 'News item not found' }, { status: 404 })
    }

    if (newsItem._status !== 'published') {
      return NextResponse.json(
        { error: 'News item must be published before sending' },
        { status: 400 }
      )
    }

    if (newsItem.emailSent) {
      return NextResponse.json(
        { error: 'This news item has already been sent as a newsletter' },
        { status: 400 }
      )
    }

    // Fetch next 5 upcoming events (within 45 days)
    const now = new Date()
    const futureDate = new Date(now)
    futureDate.setDate(futureDate.getDate() + 45)

    const events = await payload.find({
      collection: 'events',
      where: {
        and: [
          {
            date: {
              greater_than_equal: now.toISOString(),
            },
          },
          {
            date: {
              less_than_equal: futureDate.toISOString(),
            },
          },
          {
            eventStatus: {
              equals: 'published',
            },
          },
        ],
      },
      limit: 5,
      sort: 'date',
      depth: 0,
    })

    // Fetch all active subscribers
    const subscribers = await payload.find({
      collection: 'mailing-list' as any,
      where: {
        subscribed: {
          equals: true,
        },
      },
      limit: 1000, // Adjust if needed
      depth: 0,
    })

    if (subscribers.docs.length === 0) {
      return NextResponse.json(
        { error: 'No active subscribers found' },
        { status: 400 }
      )
    }

    payload.logger.info(
      `Sending newsletter to ${subscribers.docs.length} subscribers for news item: ${newsItem.title}`
    )

    // Send emails to all subscribers (batch 100 at a time with 1s delay)
    let successCount = 0
    let failCount = 0
    const batchSize = 100

    for (let i = 0; i < subscribers.docs.length; i += batchSize) {
      const batch = subscribers.docs.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (subscriber) => {
          try {
            await sendNewsletterEmail({
              to: subscriber.email,
              announcement: newsItem,
              events: events.docs,
              unsubscribeToken: subscriber.unsubscribeToken!,
            })
            successCount++
          } catch (error) {
            payload.logger.error(`Failed to send to ${subscriber.email}: ${error}`)
            failCount++
          }
        })
      )

      // Delay between batches to avoid rate limits
      if (i + batchSize < subscribers.docs.length) {
        await delay(1000)
      }
    }

    const sentAt = new Date().toISOString()

    // Create email campaign record
    const campaign = await payload.create({
      collection: 'email-campaigns' as any,
      data: {
        newsItem: newsId,
        sentAt,
        sentBy: userData.id,
        recipientCount: successCount,
        subject: `${newsItem.title} - North Country Chamber Newsletter`,
        includedEvents: events.docs.map((e) => e.id),
      },
    })

    // Update news item emailSent and sentAt fields
    await payload.update({
      collection: 'news',
      id: newsId,
      data: {
        emailSent: true,
        sentAt,
      } as any,
    })

    payload.logger.info(
      `Newsletter sent successfully. Success: ${successCount}, Failed: ${failCount}`
    )

    return NextResponse.json({
      success: true,
      message: 'Newsletter sent successfully',
      recipientCount: successCount,
      failedCount: failCount,
      campaignId: campaign.id,
      eventsIncluded: events.docs.length,
    })
  } catch (error) {
    payload.logger.error(`Failed to send newsletter: ${error}`)
    return NextResponse.json(
      { error: 'Failed to send newsletter. Please try again.' },
      { status: 500 }
    )
  }
}
