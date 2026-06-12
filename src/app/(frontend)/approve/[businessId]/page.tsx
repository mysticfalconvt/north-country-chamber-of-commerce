import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/utilities/auth'
import { getPayload } from 'payload'
import config from '@/payload.config'
import Link from 'next/link'
import ApproveBusinessForm from './ApproveBusinessForm'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ businessId: string }>
}

export default async function ApproveBusinessPage({ params }: PageProps) {
  const { businessId } = await params
  const user = await getCurrentUser()

  // Check authentication
  if (!user) {
    redirect('/admin/login?redirect=/approve/' + businessId)
  }

  // CRITICAL: Check authorization - only admin and chamber_staff can approve
  if (user.role !== 'admin' && user.role !== 'chamber_staff') {
    redirect('/')
  }

  const payload = await getPayload({ config })

  // Get the business details with full depth for related data
  let business
  try {
    business = await payload.findByID({
      collection: 'businesses',
      id: parseInt(businessId),
      depth: 2,
    })
  } catch {
    business = null
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Business Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The business you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link href="/admin/collections/businesses" className="text-blue-600 hover:underline">
              Go to Businesses Admin
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Fetch tiers, categories, and the current owner for the editable form
  const [tiersGlobal, categoriesResult, ownerResult] = await Promise.all([
    payload.findGlobal({ slug: 'membershipTiers' }),
    payload.find({ collection: 'categories', limit: 100, sort: 'name' }),
    payload.find({
      collection: 'users',
      where: { business: { equals: business.id } },
      limit: 1,
    }),
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

  const ownerDoc = ownerResult.docs[0]
  const owner = ownerDoc
    ? { id: ownerDoc.id as number, name: ownerDoc.name as string, email: ownerDoc.email as string }
    : null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/admin/collections/businesses"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Businesses Admin
          </Link>
          <Link
            href={`/admin/collections/businesses/${business.id}`}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Edit in Admin Panel
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Review &amp; Approve: {business.name}
        </h1>

        <ApproveBusinessForm
          business={business}
          owner={owner}
          tiers={tiers}
          categories={categories}
        />
      </div>
    </div>
  )
}
