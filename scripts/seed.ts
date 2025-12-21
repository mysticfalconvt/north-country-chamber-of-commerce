import { getPayload } from 'payload'
import { seed } from '../src/endpoints/seed'
import config from '../src/payload.config'

async function runSeed() {
  const payload = await getPayload({ config: await config })

  // Create a fake request object for the seed function
  const req = {
    payload,
    user: null,
    locale: 'en',
  } as any

  await seed({ payload, req })
  process.exit(0)
}

runSeed().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
