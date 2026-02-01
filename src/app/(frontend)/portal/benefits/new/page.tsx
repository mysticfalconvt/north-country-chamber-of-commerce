import { requireBusinessMember } from '@/utilities/auth'
import BenefitForm from '../BenefitForm'

export default async function NewBenefitPage() {
  await requireBusinessMember()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Benefit</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Add a new coupon, discount, or special offer for your customers
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          Your benefit will be submitted for approval by chamber staff before it becomes visible to
          the public. You&apos;ll receive an email once it&apos;s been reviewed.
        </p>
      </div>

      <BenefitForm />
    </div>
  )
}
