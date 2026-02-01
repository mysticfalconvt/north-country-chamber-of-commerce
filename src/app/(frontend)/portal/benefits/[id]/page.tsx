import { requireBusinessMember } from '@/utilities/auth'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { notFound } from 'next/navigation'
import BenefitForm from '../BenefitForm'

export default async function EditBenefitPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireBusinessMember()
  const payload = await getPayload({ config })
  const { id } = await params

  // Get the benefit
  const benefit = await payload.findByID({
    collection: 'benefits',
    id: parseInt(id),
  })

  if (!benefit) {
    notFound()
  }

  // Verify the benefit belongs to the user's business
  const businessId = typeof user.business === 'number' ? user.business : user.business?.id
  const benefitBusinessId =
    typeof benefit.business === 'number' ? benefit.business : benefit.business?.id

  if (benefitBusinessId !== businessId) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Benefit</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Update your benefit details</p>
      </div>

      {benefit.benefitStatus === 'pending' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-900 dark:text-yellow-200">
            This benefit is pending approval. You can still edit it while waiting for review.
          </p>
        </div>
      )}

      {benefit.benefitStatus === 'published' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-900 dark:text-green-200">
            This benefit is published and visible to the public.
          </p>
        </div>
      )}

      <BenefitForm benefit={benefit} />
    </div>
  )
}
