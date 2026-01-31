import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { sendMailingListConfirmation } from '@/utilities/email'
import { randomBytes } from 'crypto'
import { rateLimiters } from '@/utilities/rateLimit'

export async function POST(req: NextRequest) {
  // Rate limit: 10 requests per hour per IP
  const rateLimitResponse = rateLimiters.mailingListSubscribe(req)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const payload = await getPayload({ config })

  try {
    const body = await req.json()
    const { email, name } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if email already exists
    const existing = await payload.find({
      collection: 'mailing-list' as any,
      where: {
        email: {
          equals: email,
        },
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      const subscriber = existing.docs[0]

      if (subscriber.subscribed) {
        return NextResponse.json(
          { message: 'This email is already subscribed to our newsletter' },
          { status: 200 }
        )
      }

      // Re-subscribe existing unsubscribed user
      await payload.update({
        collection: 'mailing-list' as any,
        id: subscriber.id,
        data: {
          subscribed: true,
          subscribedAt: new Date().toISOString(),
          unsubscribedAt: null,
          name: name || subscriber.name,
        },
      })

      // Send confirmation email
      try {
        await sendMailingListConfirmation({
          to: email,
          name: name || subscriber.name,
          unsubscribeToken: subscriber.unsubscribeToken!,
        })
      } catch (error) {
        payload.logger.error(`Failed to send confirmation email: ${error}`)
      }

      return NextResponse.json({
        success: true,
        message: 'Successfully re-subscribed to newsletter',
      })
    }

    // Create new subscriber
    const unsubscribeToken = randomBytes(32).toString('hex')

    const newSubscriber = await payload.create({
      collection: 'mailing-list' as any,
      data: {
        email,
        name,
        subscribed: true,
        subscribedAt: new Date().toISOString(),
        unsubscribeToken,
      },
    })

    // Send confirmation email
    try {
      await sendMailingListConfirmation({
        to: email,
        name: name || undefined,
        unsubscribeToken,
      })
    } catch (error) {
      payload.logger.error(`Failed to send confirmation email: ${error}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      subscriberId: newSubscriber.id,
    })
  } catch (error) {
    payload.logger.error(`Failed to process subscription: ${error}`)
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    )
  }
}
