import { requireBusinessMember } from '@/utilities/auth'
import { getPayload } from 'payload'
import config from '@/payload.config'
import Link from 'next/link'
import { AlertCircle, Building2, Calendar, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function PortalDashboard() {
  const user = await requireBusinessMember()
  const payload = await getPayload({ config })

  // Get the user's business
  const business = user.business
    ? typeof user.business === 'number'
      ? await payload.findByID({ collection: 'businesses', id: user.business })
      : user.business
    : null

  // Get tier details if we have a membership tier
  let membershipTier: any = null
  if (business && business.membershipTier) {
    const tierGlobal = await payload.findGlobal({ slug: 'membershipTiers' })
    membershipTier = tierGlobal?.tiers?.find((t: any) => t.slug === business.membershipTier)
  }

  // Calculate days until expiration
  let daysUntilExpiration = null
  let isExpired = false
  let isExpiringSoon = false
  if (business?.membershipExpires) {
    const expirationDate = new Date(business.membershipExpires)
    const today = new Date()
    const diffTime = expirationDate.getTime() - today.getTime()
    daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    isExpired = daysUntilExpiration < 0
    isExpiringSoon = daysUntilExpiration > 0 && daysUntilExpiration <= 30
  }

  // Get events count for this business
  let eventsCount = 0
  if (business) {
    const events = await payload.find({
      collection: 'events',
      where: {
        business: { equals: business.id },
      },
      limit: 0,
    })
    eventsCount = events.totalDocs
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Welcome back, {user.name || user.email}
        </p>
      </div>

      {/* No Business Warning */}
      {!business && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-900 dark:text-yellow-200">
                No Business Profile
              </h3>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                Your account is not linked to a business profile. Please contact chamber staff.
              </p>
            </div>
          </div>
        </div>
      )}

      {business && (
        <>
          {/* Membership Status Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Membership Status
            </h2>

            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                {business.membershipStatus === 'active' ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-700 dark:text-green-400 font-medium">Active</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-700 dark:text-red-400 font-medium">Inactive</span>
                  </>
                )}
                {business.paymentStatus && (
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      business.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : business.paymentStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    Payment: {business.paymentStatus}
                  </span>
                )}
              </div>

              {/* Tier */}
              {membershipTier && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Membership Tier</p>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {membershipTier.name}
                  </p>
                </div>
              )}

              {/* Expiration */}
              {business.membershipExpires && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Expires</p>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {new Date(business.membershipExpires).toLocaleDateString()}
                  </p>
                  {daysUntilExpiration !== null && (
                    <p
                      className={`text-sm mt-1 ${
                        isExpired
                          ? 'text-red-600 dark:text-red-400'
                          : isExpiringSoon
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {isExpired
                        ? `Expired ${Math.abs(daysUntilExpiration)} days ago`
                        : `${daysUntilExpiration} days remaining`}
                    </p>
                  )}
                </div>
              )}

              {/* Renew Button */}
              {(isExpired || isExpiringSoon) && (
                <div className="pt-2">
                  <Link href="/portal/membership">
                    <Button className="w-full">Renew Membership</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Business Card */}
            <Link
              href="/portal/business"
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">My Business</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{business.name}</p>
                </div>
              </div>
            </Link>

            {/* Events Card */}
            <Link
              href="/portal/events"
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">My Events</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {eventsCount} {eventsCount === 1 ? 'event' : 'events'}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
