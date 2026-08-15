import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
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

/**
 * Guards a portal page. Only for Server Components -- `redirect()` works by
 * throwing a signal Next handles internally, so calling this from a route
 * handler would surface as a 500 rather than a redirect.
 *
 * These redirects intentionally mirror the ones in the portal layout. A layout
 * and its pages render concurrently, so the layout's redirect does not prevent
 * this from running; throwing here reported a bogus error on every logged-out
 * visit to a portal URL even though the visitor was redirected correctly.
 */
export async function requireBusinessMember() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/admin/login?redirect=/portal')
  }

  if (user.role !== 'business_member') {
    redirect('/admin')
  }

  return user
}
