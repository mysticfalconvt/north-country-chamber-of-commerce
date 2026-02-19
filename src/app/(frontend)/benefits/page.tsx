import React from 'react'
import { Container } from '@/design-system/Container'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Gift, Clock, ExternalLink, Building2 } from 'lucide-react'
import Image from 'next/image'
import { headers } from 'next/headers'
import { getLocaleFromPathname, addLocaleToPathname } from '@/utilities/getLocale'
import BenefitsSearch from './BenefitsSearch'
import { getOptimizedImageUrl } from '@/utilities/getMediaUrl'
import type { Business, Media } from '@/payload-types'

export default async function BenefitsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const locale = getLocaleFromPathname(pathname)
  const params = await searchParams
  const searchQuery = params.q || ''

  const payload = await getPayload({ config })

  // Get current date at start of day
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  // Get date 1 week ago (to show recently expired benefits)
  const oneWeekAgo = new Date(now)
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  // Build query for published benefits (including those expired within the last week)
  const whereQuery: any = {
    benefitStatus: { equals: 'published' },
    or: [
      // Not expired yet
      { expirationDate: { greater_than_equal: now.toISOString() } },
      // No expiration date
      { expirationDate: { equals: null } },
      // Expired within the last week
      {
        and: [
          { expirationDate: { less_than: now.toISOString() } },
          { expirationDate: { greater_than_equal: oneWeekAgo.toISOString() } },
        ],
      },
    ],
  }

  // Add search filter if provided
  if (searchQuery) {
    whereQuery.and = [
      {
        or: [
          { 'title.en': { like: searchQuery } },
          { 'title.fr': { like: searchQuery } },
          { discountValue: { like: searchQuery } },
          { code: { like: searchQuery } },
        ],
      },
    ]
  }

  // Query benefits
  const benefits = await payload.find({
    collection: 'benefits',
    where: whereQuery,
    limit: 100,
    sort: '-featured,-createdAt',
    depth: 2,
    locale,
  })

  // Helper to check if benefit is expired
  const isExpired = (expirationDate: string | null | undefined) => {
    if (!expirationDate) return false
    return new Date(expirationDate) < now
  }

  // Separate featured and regular benefits
  const featuredBenefits = benefits.docs.filter((b) => b.featured)
  const regularBenefits = benefits.docs.filter((b) => !b.featured)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const translations = {
    en: {
      title: 'Member Benefits',
      description:
        'Discover exclusive deals, discounts, and special offers from our chamber member businesses.',
      featured: 'Featured Offers',
      all: 'All Benefits',
      noBenefits: 'No benefits found.',
      startsOn: 'Starts',
      expiresOn: 'Expires',
      expired: 'Expired',
      fromBusiness: 'From',
      useCode: 'Use code:',
    },
    fr: {
      title: 'Avantages membres',
      description:
        'Découvrez des offres exclusives, des rabais et des offres spéciales de nos entreprises membres.',
      featured: 'Offres en vedette',
      all: 'Tous les avantages',
      noBenefits: 'Aucun avantage trouvé.',
      startsOn: 'Commence le',
      expiresOn: 'Expire le',
      expired: 'Expiré',
      fromBusiness: 'De',
      useCode: 'Code:',
    },
  }

  const t = translations[locale]

  const BenefitCard = ({ benefit }: { benefit: any }) => {
    const benefitUrl = addLocaleToPathname(`/benefits/${benefit.slug}`, locale)
    const expired = isExpired(benefit.expirationDate)

    // Get business info
    const business = benefit.business as Business | null
    const businessLogo = business?.logo as Media | null
    const businessLogoUrl = getOptimizedImageUrl(businessLogo, 'thumbnail')

    // Get benefit image
    const benefitImage = benefit.image as Media | null
    const benefitImageUrl = getOptimizedImageUrl(benefitImage, 'small')

    return (
      <Link href={benefitUrl} className="group">
        <Card
          className={`h-full overflow-hidden transition-all hover:shadow-lg ${expired ? 'opacity-75' : ''}`}
        >
          {/* Image */}
          {benefitImageUrl && (
            <div className="relative w-full h-40 bg-gray-100 dark:bg-gray-800">
              <Image src={benefitImageUrl} alt={benefit.title} fill className="object-cover" />
              {expired && (
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-500 text-white">
                    {t.expired}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="p-6 space-y-4">
            <div className="space-y-2">
              {/* Expired badge (if no image) */}
              {expired && !benefitImageUrl && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                  {t.expired}
                </span>
              )}

              {/* Title */}
              <h3
                className={`text-xl font-semibold group-hover:text-primary transition-colors ${expired ? 'text-muted-foreground' : ''}`}
              >
                {benefit.title}
              </h3>

              {/* Discount value */}
              {benefit.discountValue && (
                <span
                  className={`inline-flex items-center text-sm font-bold ${expired ? 'text-muted-foreground line-through' : 'text-green-600 dark:text-green-400'}`}
                >
                  {benefit.discountValue}
                </span>
              )}
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              {/* Business */}
              {business && (
                <div className="flex items-center gap-2">
                  {businessLogoUrl ? (
                    <Image
                      src={businessLogoUrl}
                      alt={business.name}
                      width={20}
                      height={20}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-4 w-4" />
                  )}
                  <span>
                    {t.fromBusiness} {business.name}
                  </span>
                </div>
              )}

              {/* Promo code */}
              {benefit.code && (
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  <span>
                    {t.useCode}{' '}
                    <code
                      className={`bg-muted px-1.5 py-0.5 rounded font-mono text-xs ${expired ? 'line-through' : ''}`}
                    >
                      {benefit.code}
                    </code>
                  </span>
                </div>
              )}

              {/* Start date - show if benefit hasn't started yet */}
              {benefit.startDate && new Date(benefit.startDate) > now && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {t.startsOn} {formatDate(benefit.startDate)}
                  </span>
                </div>
              )}

              {/* Expiration */}
              {benefit.expirationDate && (
                <div
                  className={`flex items-center gap-2 ${expired ? 'text-red-600 dark:text-red-400' : ''}`}
                >
                  <Clock className="h-4 w-4" />
                  <span>
                    {expired ? t.expired : t.expiresOn} {formatDate(benefit.expirationDate)}
                  </span>
                </div>
              )}

              {/* External link indicator */}
              {benefit.externalUrl && (
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  <span className="truncate">{benefit.linkText || benefit.externalUrl}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </Link>
    )
  }

  const hasAnyBenefits = benefits.docs.length > 0

  return (
    <Container className="py-12 md:py-16">
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{t.title}</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">{t.description}</p>
        </div>

        <BenefitsSearch locale={locale} initialQuery={searchQuery} />

        {!hasAnyBenefits ? (
          <div className="rounded-lg border bg-card p-8 text-center">
            <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t.noBenefits}</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Featured Section */}
            {featuredBenefits.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg">
                    <h2 className="text-2xl font-bold">{t.featured}</h2>
                  </div>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {featuredBenefits.map((benefit) => (
                    <BenefitCard key={benefit.id} benefit={benefit} />
                  ))}
                </div>
              </div>
            )}

            {/* All Benefits Section */}
            {regularBenefits.length > 0 && (
              <div className="space-y-4">
                {featuredBenefits.length > 0 && <h2 className="text-2xl font-bold">{t.all}</h2>}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {regularBenefits.map((benefit) => (
                    <BenefitCard key={benefit.id} benefit={benefit} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Container>
  )
}

export async function generateMetadata() {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const locale = getLocaleFromPathname(pathname)

  const metadata = {
    en: {
      title: 'Member Benefits | North Country Chamber of Commerce',
      description:
        "Discover exclusive deals, discounts, and special offers from chamber member businesses in Vermont's Northeast Kingdom.",
    },
    fr: {
      title: 'Avantages membres | Chambre de commerce du North Country',
      description:
        'Découvrez des offres exclusives, des rabais et des offres spéciales de nos entreprises membres dans le Northeast Kingdom du Vermont.',
    },
  }

  return metadata[locale]
}
