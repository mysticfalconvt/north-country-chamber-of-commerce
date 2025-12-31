import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function getCurrentUser() {
  const payload = await getPayload({ config })
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')

  if (!token) {
    return null
  }

  try {
    // Create a Headers object with the cookie
    const headers = new Headers()
    headers.set('cookie', `payload-token=${token.value}`)

    const { user } = await payload.auth({ headers })
    return user
  } catch (_error) {
    return null
  }
}

export async function requireBusinessMember() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  if (user.role !== 'business_member') {
    throw new Error('Not authorized - business member access only')
  }

  return user
}
