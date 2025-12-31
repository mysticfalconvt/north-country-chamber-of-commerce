import { requireBusinessMember } from '@/utilities/auth'
import { getPayload } from 'payload'
import config from '@/payload.config'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Calendar, CreditCard, DollarSign } from 'lucide-react'
import RenewMembershipButton from './RenewMembershipButton'

export default async function MembershipPage() {
  const user = await requireBusinessMember()
  const payload = await getPayload({ config })

  // Get the user's business
  const businessId = typeof user.business === 'number' ? user.business : user.business?.id

  if (!businessId) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-900 dark:text-yellow-200">
          Your account is not linked to a business profile. Please contact chamber staff.
        </p>
      </div>
    )
  }

  const business = await payload.findByID({
    collection: 'businesses',
    id: businessId,
  })

  console.log('Business data:', {
    id: business.id,
    membershipTier: business.membershipTier,
    membershipExpires: business.membershipExpires,
    membershipStatus: business.membershipStatus,
  })

  // Get membership history
  const memberships = await payload.find({
    collection: 'memberships',
    where: {
      business: { equals: businessId },
    },
    sort: '-createdAt',
    limit: 10,
  })

  // Get current tier details
  const tierGlobal = await payload.findGlobal({ slug: 'membershipTiers' })
  const currentTier = tierGlobal?.tiers?.find((t: any) => t.slug === business.membershipTier)

  console.log('Tier data:', {
    currentTier,
    businessTier: business.membershipTier,
    allTiers: tierGlobal?.tiers?.map((t: any) => t.slug),
  })

  // Calculate expiration status
  let daysUntilExpiration = null
  let isExpired = false
  let isExpiringSoon = false
  if (business.membershipExpires) {
    const expirationDate = new Date(business.membershipExpires)
    const today = new Date()
    const diffTime = expirationDate.getTime() - today.getTime()
    daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    isExpired = daysUntilExpiration < 0
    isExpiringSoon = daysUntilExpiration > 0 && daysUntilExpiration <= 30
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Membership</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your chamber membership</p>
      </div>

      {/* Current Membership Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Current Membership
        </h2>

        <div className="space-y-4">
          {/* Tier */}
          {currentTier && (
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Membership Tier</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {currentTier.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  ${currentTier.annualPrice}/year
                </p>
              </div>
            </div>
          )}

          {/* Expiration */}
          {business.membershipExpires && (
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Expiration Date</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
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
            </div>
          )}

          {/* Status */}
          <div className="pt-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                business.membershipStatus === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {business.membershipStatus === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>

          {/* Renew Button */}
          {currentTier && (
            <div className="pt-4">
              <RenewMembershipButton
                businessId={business.id}
                tier={business.membershipTier || currentTier.slug}
              />
            </div>
          )}
        </div>
      </div>

      {/* Membership History */}
      {memberships.docs.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Payment History
          </h2>

          <div className="space-y-4">
            {memberships.docs.map((membership) => (
              <div
                key={membership.id}
                className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {membership.tier} Membership
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(membership.startDate).toLocaleDateString()} -{' '}
                    {new Date(membership.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-white">${membership.amount}</p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      membership.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}
                  >
                    {membership.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Tiers */}
      {tierGlobal?.tiers && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Available Membership Tiers
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tierGlobal.tiers
              .filter((tier: any) => tier.active)
              .map((tier: any) => (
                <div
                  key={tier.slug}
                  className={`border rounded-lg p-4 ${
                    tier.slug === business.membershipTier
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{tier.name}</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    ${tier.annualPrice}
                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                      /year
                    </span>
                  </p>
                  {tier.slug === business.membershipTier && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Current Tier
                    </span>
                  )}
                </div>
              ))}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            To change your membership tier, please contact chamber staff.
          </p>
        </div>
      )}
    </div>
  )
}
