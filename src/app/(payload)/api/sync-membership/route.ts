import { getPayload } from 'payload'
import config from '@/payload.config'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const payload = await getPayload({ config })
    const body = await req.json()
    const { membershipId } = body

    if (!membershipId) {
      return NextResponse.json({ error: 'membershipId required' }, { status: 400 })
    }

    // Fetch the membership
    const membership = await payload.findByID({
      collection: 'memberships',
      id: membershipId,
    })

    const businessId =
      typeof membership.business === 'number' ? membership.business : membership.business?.id

    if (!businessId) {
      return NextResponse.json({ error: 'Invalid business ID' }, { status: 400 })
    }

    // Update business directly with just the membership fields
    await payload.update({
      collection: 'businesses',
      id: businessId,
      data: {
        membershipTier: membership.tier,
        membershipExpires: membership.endDate,
        membershipStatus: membership.paymentStatus === 'paid' ? 'active' : 'inactive',
      },
      depth: 0,
    })

    return NextResponse.json({ success: true, businessId })
  } catch (error) {
    console.error('Sync membership error:', error)
    return NextResponse.json({ error: 'Failed to sync membership' }, { status: 500 })
  }
}
