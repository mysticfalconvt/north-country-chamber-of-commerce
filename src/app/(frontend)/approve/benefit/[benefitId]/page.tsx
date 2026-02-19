import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/utilities/auth'
import { getPayload } from 'payload'
import config from '@/payload.config'
import Link from 'next/link'
import Image from 'next/image'
import { ApproveBenefitButton } from './ApproveBenefitButton'

interface PageProps {
  params: Promise<{ benefitId: string }>
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

export default async function ApproveBenefitPage({ params }: PageProps) {
  const { benefitId } = await params
  const user = await getCurrentUser()

  // Check authentication
  if (!user) {
    redirect('/admin/login?redirect=/approve/benefit/' + benefitId)
  }

  // CRITICAL: Check authorization - only admin and chamber_staff can approve
  if (user.role !== 'admin' && user.role !== 'chamber_staff') {
    redirect('/')
  }

  const payload = await getPayload({ config })

  // Get the benefit details with full depth for related data
  let benefit
  try {
    benefit = await payload.findByID({
      collection: 'benefits',
      id: parseInt(benefitId),
      depth: 2,
    })
  } catch {
    benefit = null
  }

  if (!benefit) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Benefit Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The benefit you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link href="/admin/collections/benefits" className="text-blue-600 hover:underline">
              Go to Benefits Admin
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Get the submitter info
  let submitter = null
  if (benefit.submittedBy) {
    const submitterId =
      typeof benefit.submittedBy === 'number'
        ? benefit.submittedBy
        : (benefit.submittedBy as any).id
    try {
      submitter = await payload.findByID({
        collection: 'users',
        id: submitterId,
      })
    } catch {
      submitter = null
    }
  }

  // Get business info
  let business = null
  if (benefit.business) {
    business = typeof benefit.business === 'object' ? benefit.business : null
  }

  const isAlreadyPublished = benefit.benefitStatus === 'published'

  // Get image URL
  const imageUrl =
    benefit.image && typeof benefit.image === 'object' && benefit.image.url
      ? benefit.image.url
      : null

  // Extract description text
  const descriptionText = extractTextFromLexical(benefit.description)

  // Get benefit title (handle localized)
  const benefitTitle =
    typeof benefit.title === 'string'
      ? benefit.title
      : (benefit.title as any)?.en || 'Untitled Benefit'

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/collections/benefits"
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
            Back to Benefits Admin
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {/* Benefit Image */}
          {imageUrl && (
            <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-700">
              <Image src={imageUrl} alt={benefitTitle} fill className="object-cover" />
            </div>
          )}

          {/* Benefit Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{benefitTitle}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      benefit.benefitStatus === 'published'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : benefit.benefitStatus === 'expired'
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                          : benefit.benefitStatus === 'draft'
                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}
                  >
                    {benefit.benefitStatus === 'published'
                      ? 'Published'
                      : benefit.benefitStatus === 'expired'
                        ? 'Expired'
                        : benefit.benefitStatus === 'draft'
                          ? 'Draft'
                          : 'Pending Approval'}
                  </span>
                  {benefit.featured && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                      Featured
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Benefit Details */}
          <div className="p-6 space-y-6">
            {/* Discount Value & Code */}
            {(benefit.discountValue || benefit.code) && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {benefit.discountValue && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Discount Value</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {benefit.discountValue}
                      </p>
                    </div>
                  )}
                  {benefit.code && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Promo Code</p>
                      <p className="text-xl font-mono font-bold text-gray-900 dark:text-white">
                        {benefit.code}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dates */}
            {(benefit.startDate || benefit.expirationDate) && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {benefit.startDate && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {formatDate(benefit.startDate)}
                      </p>
                    </div>
                  )}
                  {benefit.expirationDate && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Expiration Date</p>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {formatDate(benefit.expirationDate)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {descriptionText && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Description
                </h2>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {descriptionText}
                  </p>
                </div>
              </div>
            )}

            {/* External URL */}
            {benefit.externalUrl && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  External Link
                </h2>
                <a
                  href={
                    benefit.externalUrl.startsWith('http')
                      ? benefit.externalUrl
                      : `https://${benefit.externalUrl}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  {benefit.linkText || benefit.externalUrl}
                </a>
              </div>
            )}

            {/* Submitter Info */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Submitted By
              </h2>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {business && (
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
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Business</p>
                        <p className="text-gray-900 dark:text-white">{business.name}</p>
                      </div>
                    </div>
                  )}
                  {submitter && (
                    <>
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
                          <p className="text-gray-900 dark:text-white">{submitter.name}</p>
                        </div>
                      </div>
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
                            href={`mailto:${submitter.email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {submitter.email}
                          </a>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700">
            {isAlreadyPublished ? (
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
                  This benefit has already been published
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  <Link
                    href={`/benefits/${benefit.slug}`}
                    className="text-blue-600 hover:underline"
                  >
                    View benefit on site
                  </Link>
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                <ApproveBenefitButton benefitId={benefit.id} benefitTitle={benefitTitle} />
                <Link
                  href={`/admin/collections/benefits/${benefit.id}`}
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
