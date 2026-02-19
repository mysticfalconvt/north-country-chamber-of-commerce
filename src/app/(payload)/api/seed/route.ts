import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { seed } from '@/endpoints/seed'

export async function POST(req: NextRequest) {
  // Check if seeding is completely disabled via environment variable
  if (process.env.ENABLE_SEED_ENDPOINT !== 'true') {
    return NextResponse.json({ error: 'Seed endpoint is disabled' }, { status: 403 })
  }

  // Require seed token for authentication
  const authHeader = req.headers.get('Authorization')
  const expectedToken = process.env.SEED_API_TOKEN

  if (!expectedToken) {
    return NextResponse.json(
      { error: 'Seed endpoint is not configured (SEED_API_TOKEN not set)' },
      { status: 500 },
    )
  }

  // Check Bearer token format: "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid Authorization header. Use: Authorization: Bearer <token>' },
      { status: 401 },
    )
  }

  const providedToken = authHeader.substring(7) // Remove "Bearer " prefix

  if (providedToken !== expectedToken) {
    return NextResponse.json({ error: 'Invalid seed token' }, { status: 401 })
  }

  const payload = await getPayload({ config })

  try {
    payload.logger.info('Starting database seed via API...')

    // Create a mock request object for the seed function
    const mockReq = {
      payload,
      user: {
        id: 1,
        email: 'admin@northcountrychamber.com',
        role: 'admin',
      },
    } as any

    await seed({ payload, req: mockReq })

    payload.logger.info('Database seeded successfully!')

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully!',
    })
  } catch (error) {
    payload.logger.error(`Failed to seed database: ${error}`)
    return NextResponse.json(
      { error: 'Failed to seed database', details: String(error) },
      { status: 500 },
    )
  }
}
