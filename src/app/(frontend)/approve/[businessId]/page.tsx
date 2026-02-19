import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/utilities/auth'
import { getPayload } from 'payload'
import config from '@/payload.config'
import Link from 'next/link'
import Image from 'next/image'
import { ApproveButton } from './ApproveButton'

interface PageProps {
  params: Promise<{ businessId: string }>
}

// Helper to extract plain text from Lexical rich text
function extractTextFromLexical(richText: any): string {
  if (!richText || !richText.root || !richText.root.children) return ''

  const extractText = (node: any): string => {
    if (node.type === 'text') {
      return node.text || ''
    }
    if (node.children && Array.isArray(node.children)) {
      return node.children.map(extractText).join('')
    }
    return ''
  }

  return richText.root.children.map(extractText).join('\n').trim()
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

  // Get membership tier details
  let tierData = null
  if (business.membershipTier) {
    const membershipTiersGlobal = await payload.findGlobal({
      slug: 'membershipTiers',
    })
    tierData = (membershipTiersGlobal as any)?.tiers?.find(
      (t: any) => t.slug === business.membershipTier,
    )
  }

  // Get the business owner
  const businessOwner = await payload.find({
    collection: 'users',
    where: {
      business: { equals: business.id },
    },
    limit: 1,
  })
  const owner = businessOwner.docs[0]

  const isAlreadyApproved = business.approvalStatus === 'approved'

  // Get logo URL
  const logoUrl =
    business.logo && typeof business.logo === 'object' && business.logo.url
      ? business.logo.url
      : null

  // Extract description text
  const descriptionText = extractTextFromLexical(business.description)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
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
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {/* Business Header with Logo */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-6">
              {/* Logo */}
              {logoUrl ? (
                <div className="flex-shrink-0">
                  <Image
                    src={logoUrl}
                    alt={`${business.name} logo`}
                    width={120}
                    height={120}
                    className="rounded-lg object-contain bg-gray-100 dark:bg-gray-700"
                    style={{ maxHeight: '120px', width: 'auto' }}
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 w-[120px] h-[120px] bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <svg
                    className="h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
              )}

              {/* Business Name and Status */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {business.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      business.approvalStatus === 'approved'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : business.approvalStatus === 'rejected'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}
                  >
                    {business.approvalStatus === 'approved'
                      ? 'Approved'
                      : business.approvalStatus === 'rejected'
                        ? 'Rejected'
                        : 'Pending Approval'}
                  </span>
                  {tierData && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {tierData.name} - ${tierData.annualPrice}/year
                    </span>
                  )}
                </div>
                {business.website && (
                  <a
                    href={
                      business.website.startsWith('http')
                        ? business.website
                        : `https://${business.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:underline"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    {business.website}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="p-6 space-y-6">
            {/* Description */}
            {descriptionText && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Business Description
                </h2>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {descriptionText}
                  </p>
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {owner && (
                  <div className="flex items-center gap-3">
                    <svg
                      className="h-5 w-5 text-gray-400 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Contact Person</p>
                      <p className="text-gray-900 dark:text-white">{owner.name}</p>
                    </div>
                  </div>
                )}
                {business.email && (
                  <div className="flex items-center gap-3">
                    <svg
                      className="h-5 w-5 text-gray-400 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <a
                        href={`mailto:${business.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {business.email}
                      </a>
                    </div>
                  </div>
                )}
                {business.phone && (
                  <div className="flex items-center gap-3">
                    <svg
                      className="h-5 w-5 text-gray-400 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                      <p className="text-gray-900 dark:text-white">{business.phone}</p>
                    </div>
                  </div>
                )}
                {(business.address || business.city) && (
                  <div className="flex items-center gap-3">
                    <svg
                      className="h-5 w-5 text-gray-400 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                      <p className="text-gray-900 dark:text-white">
                        {business.address && (
                          <span>
                            {business.address}
                            <br />
                          </span>
                        )}
                        {[business.city, business.state, business.zipCode]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Categories */}
            {business.category &&
              Array.isArray(business.category) &&
              business.category.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Categories
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {business.category.map((cat: any) => (
                      <span
                        key={typeof cat === 'object' ? cat.id : cat}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                        {typeof cat === 'object' ? cat.name : cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Application Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Application Summary
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Applied On</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {business.applicationDate
                      ? new Date(business.applicationDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Membership Tier</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {tierData ? tierData.name : business.membershipTier || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Annual Dues</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {tierData ? `$${tierData.annualPrice}` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700">
            {isAlreadyApproved ? (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  This business has already been approved
                </div>
                {business.approvedAt && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Approved on{' '}
                    {new Date(business.approvedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                <ApproveButton businessId={business.id} businessName={business.name} />
                <Link
                  href={`/admin/collections/businesses/${business.id}`}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Edit in Admin Panel
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
