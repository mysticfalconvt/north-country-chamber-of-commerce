import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { createCheckoutSession } from '@/utilities/stripe'

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })

  try {
    const body = await req.json()
    const { businessId, tier } = body

    if (!businessId || !tier) {
      return NextResponse.json(
        { error: 'Missing required fields: businessId and tier' },
        { status: 400 },
      )
    }

    // Get business details
    const business = await payload.findByID({
      collection: 'businesses',
      id: businessId,
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Get membership tier details from global
    const membershipTiersGlobal = await payload.findGlobal({
      slug: 'membershipTiers',
    })

    const tierData = membershipTiersGlobal?.tiers?.find((t: any) => t.slug === tier)

    if (!tierData) {
      return NextResponse.json({ error: 'Invalid membership tier' }, { status: 400 })
    }

    // Get the base URL for success/cancel redirects
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      businessId: business.id.toString(),
      businessName: business.name,
      tier: tierData.slug,
      amount: tierData.annualPrice,
      successUrl: `${baseUrl}/join/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/join/apply?canceled=true`,
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    payload.logger.error(`Failed to create checkout session: ${error}`)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
