#!/usr/bin/env node
import { execSync } from 'child_process'

// Use Payload's built-in mechanism to seed via the Local API
// This approach works because Payload compiles TypeScript internally
const code = `
import { getPayload } from 'payload'
import { seed } from './src/endpoints/seed/index.js'

const configModule = await import('./src/payload.config.ts')
const config = configModule.default
const payload = await getPayload({ config: await config })

const req = {
  payload,
  user: null,
  locale: 'en',
}

await seed({ payload, req })
console.log('Seed completed!')
`

try {
  console.log('Running seed script...')
  execSync(`node --input-type=module --eval "${code.replace(/"/g, '\\"')}"`, {
    stdio: 'inherit',
    cwd: process.cwd()
  })
  console.log('Seeding successful!')
  process.exit(0)
} catch (error) {
  console.error('Seeding failed:', error.message)
  process.exit(1)
}
