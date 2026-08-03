import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/utilities/auth'
import BugsinkTestButtons from './BugsinkTestButtons'

export const dynamic = 'force-dynamic'

export default async function BugsinkTestPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/admin/login?redirect=/admin-tools/bugsink-test')
  }

  if (user.role !== 'admin') {
    redirect('/')
  }

  const configured = Boolean(process.env.NEXT_PUBLIC_BUGSINK_DSN)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            ← Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">
            Error Tracking Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Throw a deliberate error to confirm it reaches Bugsink. Events should appear under open
            issues within a few seconds.
          </p>
        </div>

        {!configured ? (
          <p className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4 text-sm text-yellow-800 dark:text-yellow-200">
            <code>NEXT_PUBLIC_BUGSINK_DSN</code> is not set, so error reporting is disabled. These
            buttons will still throw, but nothing will be sent.
          </p>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Release: <code>{process.env.NEXT_PUBLIC_SENTRY_RELEASE}</code>
          </p>
        )}

        <BugsinkTestButtons />
      </div>
    </div>
  )
}
