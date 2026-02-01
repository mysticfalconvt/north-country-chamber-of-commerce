import { getPayload, Payload } from 'payload'

/**
 * Get admin notification email addresses
 *
 * Priority:
 * 1. ADMIN_NOTIFICATION_EMAIL environment variable (preferred for security)
 * 2. Fallback to querying admin/chamber_staff users from database
 *
 * Using an environment variable is preferred because:
 * - Doesn't expose admin emails via database queries
 * - Easier to configure and update
 * - Can be set to a group/distribution email
 */
export async function getAdminNotificationEmails(payload?: Payload): Promise<string[]> {
  // First, check environment variable (preferred)
  const envEmails = process.env.ADMIN_NOTIFICATION_EMAIL
  if (envEmails) {
    return envEmails
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email.length > 0 && email.includes('@'))
  }

  // Fallback: query database for admin/chamber_staff users
  // This is less secure as it exposes email addresses via queries
  if (!payload) {
    const config = (await import('@/payload.config')).default
    payload = await getPayload({ config })
  }

  const adminUsers = await payload.find({
    collection: 'users',
    where: {
      or: [{ role: { equals: 'admin' } }, { role: { equals: 'chamber_staff' } }],
    },
    limit: 100,
    depth: 0,
  })

  return adminUsers.docs
    .map((user) => user.email)
    .filter((email): email is string => !!email)
}
