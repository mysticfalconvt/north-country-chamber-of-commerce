import { getPayload } from 'payload'
import { seed } from '../src/endpoints/seed/index.js'
import type { PayloadRequest } from 'payload'

async function runSeed() {
  console.log('Loading Payload config...')
  const configModule = await import('../src/payload.config.ts')
  const config = configModule.default

  console.log('Initializing Payload...')
  const payload = await getPayload({ config: await config })

  console.log('Running seed function...')
  // Create a fake request object for the seed function
  const req = {
    payload,
    user: null,
    locale: 'en',
  } as PayloadRequest

  await seed({ payload, req })
  console.log('Seed completed!')
  process.exit(0)
}

runSeed().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
