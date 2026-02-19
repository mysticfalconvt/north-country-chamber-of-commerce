import { requireBusinessMember } from '@/utilities/auth'
import { getPayload } from 'payload'
import config from '@/payload.config'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Gift, Plus, Clock, ExternalLink } from 'lucide-react'

export default async function BenefitsPage() {
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

  // Get all benefits for this business
  const benefits = await payload.find({
    collection: 'benefits',
    where: {
      business: { equals: businessId },
    },
    sort: '-createdAt',
    limit: 100,
  })

  // Current date for expiration check
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const isExpired = (expirationDate: string | null | undefined) => {
    if (!expirationDate) return false
    return new Date(expirationDate) < now
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'expired':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Benefits</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your coupons, discounts, and special offers
          </p>
        </div>
        <Link href="/portal/benefits/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Benefit
          </Button>
        </Link>
      </div>

      {benefits.docs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No benefits yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first coupon, discount, or special offer to attract customers
          </p>
          <Link href="/portal/benefits/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Benefit
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {benefits.docs.map((benefit) => {
            const expired = isExpired(benefit.expirationDate)

            return (
              <Link
                key={benefit.id}
                href={`/portal/benefits/${benefit.id}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {typeof benefit.title === 'string'
                          ? benefit.title
                          : (benefit.title as any)?.en || 'Untitled Benefit'}
                      </h3>
                      {benefit.discountValue && (
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {benefit.discountValue}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {benefit.expirationDate && (
                        <div
                          className={`flex items-center gap-2 text-sm ${expired ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}
                        >
                          <Clock className="h-4 w-4" />
                          <span>
                            {expired ? 'Expired:' : 'Expires:'}{' '}
                            {new Date(benefit.expirationDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {benefit.externalUrl && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <ExternalLink className="h-4 w-4" />
                          <span className="truncate max-w-xs">
                            {benefit.linkText || benefit.externalUrl}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(benefit.benefitStatus)}`}
                      >
                        {benefit.benefitStatus === 'pending'
                          ? 'Pending Approval'
                          : benefit.benefitStatus}
                      </span>
                      {expired && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          Expired
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
