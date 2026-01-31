import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function GET(req: NextRequest) {
  return handleUnsubscribe(req)
}

export async function POST(req: NextRequest) {
  return handleUnsubscribe(req)
}

async function handleUnsubscribe(req: NextRequest) {
  const payload = await getPayload({ config })

  try {
    const searchParams = req.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Unsubscribe token is required' }, { status: 400 })
    }

    // Find subscriber by token
    const subscribers = await payload.find({
      collection: 'mailing-list' as any,
      where: {
        unsubscribeToken: {
          equals: token,
        },
      },
      limit: 1,
    })

    if (subscribers.docs.length === 0) {
      return NextResponse.json(
        { error: 'Invalid unsubscribe token' },
        { status: 404 }
      )
    }

    const subscriber = subscribers.docs[0]

    // If already unsubscribed, just return success
    if (!subscriber.subscribed) {
      return NextResponse.json({
        success: true,
        message: 'You are already unsubscribed',
        alreadyUnsubscribed: true,
      })
    }

    // Update subscriber status
    await payload.update({
      collection: 'mailing-list' as any,
      id: subscriber.id,
      data: {
        subscribed: false,
        unsubscribedAt: new Date().toISOString(),
      },
    })

    payload.logger.info(`Unsubscribed email: ${subscriber.email}`)

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter',
      email: subscriber.email,
    })
  } catch (error) {
    payload.logger.error(`Failed to process unsubscribe: ${error}`)
    return NextResponse.json(
      { error: 'Failed to unsubscribe. Please try again.' },
      { status: 500 }
    )
  }
}
