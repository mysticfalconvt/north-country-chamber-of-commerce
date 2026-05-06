import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/utilities/auth'
import { getPayload } from 'payload'
import config from '@/payload.config'
import CleanupEventsForm from './CleanupEventsForm'

export const dynamic = 'force-dynamic'

export default async function CleanupEventsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/admin/login?redirect=/admin-tools/cleanup-events')
  }

  if (user.role !== 'admin' && user.role !== 'chamber_staff') {
    redirect('/')
  }

  const payload = await getPayload({ config })

  const empties = await payload.find({
    collection: 'events',
    where: {
      or: [
        { title: { equals: null } },
        { title: { equals: '' } },
        { title: { exists: false } },
      ],
    },
    depth: 0,
    locale: 'en',
    limit: 0,
    pagination: false,
  })

  const count = empties.totalDocs ?? empties.docs.length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            ← Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">
            Clean Up Empty Events
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Removes events that have no title — these are typically leftovers from the previous
            admin-panel autosave behavior. This action cannot be undone.
          </p>
        </div>

        <CleanupEventsForm count={count} />
      </div>
    </div>
  )
}
