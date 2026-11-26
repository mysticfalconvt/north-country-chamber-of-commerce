// @vitest-environment node

import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload

const canRunPayloadIntegration = Boolean(process.env.DATABASE_URL && process.env.PAYLOAD_SECRET)

describe.skipIf(!canRunPayloadIntegration)('API', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('fetches users', async () => {
    const users = await payload.find({
      collection: 'users',
    })
    expect(users).toBeDefined()
  })
})
