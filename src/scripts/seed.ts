// Load environment variables FIRST, before any imports
import { config as dotenvConfig } from 'dotenv'
import { resolve } from 'path'

dotenvConfig({ path: resolve(process.cwd(), '.env') })

// Now import Payload after env vars are loaded
import { getPayload } from 'payload'
import payloadConfig from '@/payload.config'
import { seed } from '@/endpoints/seed'

console.log('PAYLOAD_SECRET loaded:', process.env.PAYLOAD_SECRET ? 'yes' : 'no')
console.log('DATABASE_URL loaded:', process.env.DATABASE_URL ? 'yes' : 'no')

async function runSeed() {
  try {
    // Ensure secret is set
    if (!process.env.PAYLOAD_SECRET) {
      throw new Error('PAYLOAD_SECRET environment variable is not set')
    }

    const payload = await getPayload({ config: payloadConfig })

    console.log('Starting database seed...')

    // Create a mock request object for the seed function
    const req = {
      payload,
      user: {
        id: 1,
        email: 'admin@northcountrychamber.com',
        role: 'admin',
      },
    } as any

    await seed({ payload, req })

    console.log('✓ Database seeded successfully!')
    process.exit(0)
  } catch (error) {
    console.error('✗ Error seeding database:', error)
    process.exit(1)
  }
}

runSeed()
