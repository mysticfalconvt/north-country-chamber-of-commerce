import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/utilities/auth'
import { getPayload } from 'payload'
import config from '@/payload.config'
import CreateBusinessForm from './CreateBusinessForm'

export const dynamic = 'force-dynamic'

export default async function CreateBusinessOnBehalfPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/admin/login?redirect=/admin-tools/create-business')
  }

  if (user.role !== 'admin' && user.role !== 'chamber_staff') {
    redirect('/')
  }

  const payload = await getPayload({ config })

  const [tiersGlobal, categoriesResult] = await Promise.all([
    payload.findGlobal({ slug: 'membershipTiers' }),
    payload.find({ collection: 'categories', limit: 100, sort: 'name' }),
  ])

  const tiers = ((tiersGlobal as any)?.tiers || [])
    .filter((t: any) => t.active)
    .map((t: any) => ({
      slug: t.slug,
      name: t.name,
      annualPrice: t.annualPrice,
    }))

  const categories = (categoriesResult.docs || []).map((c: any) => ({
    id: c.id,
    name: c.name,
  }))

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
            Create Business On Behalf of New Member
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Use this form to create an approved business account for a member who can&apos;t sign up
            themselves. The new member will receive a login email with a temporary password. No
            approval step is required.
          </p>
        </div>

        <CreateBusinessForm tiers={tiers} categories={categories} />
      </div>
    </div>
  )
}
