import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/utilities/auth'
import Link from 'next/link'
import { Building2, Calendar, ExternalLink, Gift, Home, LogOut } from 'lucide-react'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  // Redirect to admin login if not authenticated
  if (!user) {
    redirect('/admin/login?redirect=/portal')
  }

  // Only business members can access the portal
  if (user.role !== 'business_member') {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative z-40 isolate">
      {/* Header */}
      <header className="relative z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <Link href="/portal" className="text-xl font-bold text-gray-900 dark:text-white">
                Member Portal
              </Link>
              <Link
                href="/"
                className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ExternalLink className="h-4 w-4" />
                Back to Website
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user.name || user.email}
              </span>
              <form action="/api/logout" method="POST">
                <button
                  type="submit"
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              <Link
                href="/portal"
                className="flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Home className="h-5 w-5" />
                Dashboard
              </Link>
              <Link
                href="/portal/business"
                className="flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Building2 className="h-5 w-5" />
                My Business
              </Link>
              <Link
                href="/portal/events"
                className="flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Calendar className="h-5 w-5" />
                My Events
              </Link>
              <Link
                href="/portal/benefits"
                className="flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Gift className="h-5 w-5" />
                My Benefits
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
