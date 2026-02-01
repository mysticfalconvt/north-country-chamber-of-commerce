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

    // Create the benefit
    const benefit = await payload.create({
      collection: 'benefits',
      data: {
        ...body,
        business: businessId,
        submittedBy: user.id,
        benefitStatus: 'pending', // Always start as pending for approval
      },
    })

    return NextResponse.json({ success: true, benefit })
  } catch (error) {
    payload.logger.error(`Failed to create benefit: ${error}`)
    return NextResponse.json({ error: 'Failed to create benefit' }, { status: 500 })
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
      return NextResponse.json({ error: 'Benefit ID required' }, { status: 400 })
    }

    // Verify the benefit belongs to the user's business
    const existingBenefit = await payload.findByID({
      collection: 'benefits',
      id,
    })

    const businessId = typeof user.business === 'number' ? user.business : user.business?.id
    const benefitBusinessId =
      typeof existingBenefit.business === 'number'
        ? existingBenefit.business
        : existingBenefit.business?.id

    if (benefitBusinessId !== businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Business members cannot change benefitStatus (only admins can approve)
    delete updateData.benefitStatus

    // Update the benefit
    const benefit = await payload.update({
      collection: 'benefits',
      id,
      data: updateData,
    })

    return NextResponse.json({ success: true, benefit })
  } catch (error) {
    payload.logger.error(`Failed to update benefit: ${error}`)
    return NextResponse.json({ error: 'Failed to update benefit' }, { status: 500 })
  }
}
