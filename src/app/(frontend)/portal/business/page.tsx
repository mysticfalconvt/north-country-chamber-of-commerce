import { requireBusinessMember } from '@/utilities/auth'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { redirect } from 'next/navigation'
import BusinessEditForm from './BusinessEditForm'

export default async function BusinessProfilePage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Business</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Update your business information and settings
        </p>
      </div>

      <BusinessEditForm business={business} />
    </div>
  )
}
