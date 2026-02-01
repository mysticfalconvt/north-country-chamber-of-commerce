import React from 'react'
import { Container } from '@/design-system/Container'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { getLocaleFromPathname, addLocaleToPathname } from '@/utilities/getLocale'
import { getOptimizedImageUrl } from '@/utilities/getMediaUrl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Gift,
  Clock,
  ExternalLink,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  ArrowLeft,
  Download,
  AlertTriangle,
} from 'lucide-react'
import type { Business, Media } from '@/payload-types'
import RichText from '@/components/RichText'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function BenefitDetailPage({ params }: PageProps) {
  const { slug } = await params
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const locale = getLocaleFromPathname(pathname)

  const payload = await getPayload({ config })

  // Get current date
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  // Get date 1 week ago
  const oneWeekAgo = new Date(now)
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  // Get the benefit (including recently expired ones)
  const benefits = await payload.find({
    collection: 'benefits',
    where: {
      slug: { equals: slug },
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
    },
    depth: 2,
    limit: 1,
    locale,
  })

  const benefit = benefits.docs[0]

  if (!benefit) {
    notFound()
  }

  // Check if benefit is expired
  const isExpired = benefit.expirationDate ? new Date(benefit.expirationDate) < now : false

  // Get business info
  const business = benefit.business as Business | null
  const businessLogo = business?.logo as Media | null
  const businessLogoUrl = getOptimizedImageUrl(businessLogo, 'small')

  // Get benefit image
  const benefitImage = benefit.image as Media | null
  const benefitImageUrl = getOptimizedImageUrl(benefitImage, 'large')

  // Get attachment
  const attachment = benefit.attachment as Media | null
  const attachmentUrl = attachment?.url

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
      backToOffers: 'Back to Benefits',
      fromBusiness: 'Offered by',
      useCode: 'Promo Code',
      expiresOn: 'Valid until',
      expiredOn: 'Expired on',
      startsOn: 'Starts',
      redeemOnline: 'Visit Link',
      downloadCoupon: 'Download Coupon',
      viewBusiness: 'View Business',
      expired: 'This offer has expired',
      expiredMessage: 'This benefit is no longer available. Check out our other offers!',
    },
    fr: {
      backToOffers: 'Retour aux avantages',
      fromBusiness: 'Offert par',
      useCode: 'Code promo',
      expiresOn: 'Valide jusqu\'au',
      expiredOn: 'Expiré le',
      startsOn: 'Commence le',
      redeemOnline: 'Visiter le lien',
      downloadCoupon: 'Télécharger le coupon',
      viewBusiness: 'Voir l\'entreprise',
      expired: 'Cette offre a expiré',
      expiredMessage: 'Cet avantage n\'est plus disponible. Découvrez nos autres offres!',
    },
  }

  const t = translations[locale]

  return (
    <Container className="py-12 md:py-16">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          href={addLocaleToPathname('/benefits', locale)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.backToOffers}
        </Link>

        {/* Expired Banner */}
        {isExpired && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">{t.expired}</p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{t.expiredMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className={`lg:col-span-2 space-y-6 ${isExpired ? 'opacity-75' : ''}`}>
            {/* Image */}
            {benefitImageUrl && (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <Image
                  src={benefitImageUrl}
                  alt={benefit.title as string}
                  fill
                  className="object-cover"
                />
                {isExpired && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-3 py-1.5 rounded text-sm font-medium bg-red-500 text-white">
                      {t.expired}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Header */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {isExpired && !benefitImageUrl && (
                  <span className="inline-flex items-center text-sm bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 px-3 py-1 rounded-full">
                    {t.expired}
                  </span>
                )}
                {benefit.featured && (
                  <span className="inline-flex items-center text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-3 py-1 rounded-full">
                    Featured
                  </span>
                )}
              </div>

              <h1 className={`text-3xl md:text-4xl font-bold ${isExpired ? 'text-muted-foreground' : ''}`}>
                {benefit.title}
              </h1>

              {/* Discount Value */}
              {benefit.discountValue && (
                <div className={`text-2xl font-bold ${isExpired ? 'text-muted-foreground line-through' : 'text-green-600 dark:text-green-400'}`}>
                  {benefit.discountValue}
                </div>
              )}
            </div>

            {/* Description */}
            {benefit.description && (
              <div className="prose dark:prose-invert max-w-none">
                <RichText data={benefit.description} />
              </div>
            )}

            {/* Promo Code */}
            {benefit.code && (
              <Card className={`p-6 ${isExpired ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'}`}>
                <div className="flex items-center gap-4">
                  <Gift className={`h-8 w-8 ${isExpired ? 'text-muted-foreground' : 'text-green-600 dark:text-green-400'}`} />
                  <div>
                    <p className={`text-sm ${isExpired ? 'text-muted-foreground' : 'text-green-700 dark:text-green-300'}`}>{t.useCode}</p>
                    <p className={`text-2xl font-mono font-bold ${isExpired ? 'text-muted-foreground line-through' : 'text-green-800 dark:text-green-200'}`}>
                      {benefit.code}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            {!isExpired && (
              <div className="flex flex-wrap gap-4">
                {benefit.externalUrl && (
                  <a
                    href={
                      benefit.externalUrl.startsWith('http')
                        ? benefit.externalUrl
                        : `https://${benefit.externalUrl}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="lg" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      {benefit.linkText || t.redeemOnline}
                    </Button>
                  </a>
                )}
                {attachmentUrl && (
                  <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="lg" className="gap-2">
                      <Download className="h-4 w-4" />
                      {t.downloadCoupon}
                    </Button>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Dates Card */}
            {(benefit.startDate || benefit.expirationDate) && (
              <Card className={`p-6 space-y-4 ${isExpired ? 'border-red-200 dark:border-red-800' : ''}`}>
                {benefit.startDate && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t.startsOn}</p>
                      <p className="font-medium">{formatDate(benefit.startDate)}</p>
                    </div>
                  </div>
                )}
                {benefit.expirationDate && (
                  <div className="flex items-center gap-3">
                    <Clock className={`h-5 w-5 ${isExpired ? 'text-red-500' : 'text-muted-foreground'}`} />
                    <div>
                      <p className={`text-sm ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                        {isExpired ? t.expiredOn : t.expiresOn}
                      </p>
                      <p className={`font-medium ${isExpired ? 'text-red-600 dark:text-red-400' : ''}`}>
                        {formatDate(benefit.expirationDate)}
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Business Card */}
            {business && (
              <Card className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground">{t.fromBusiness}</p>
                <Link
                  href={addLocaleToPathname(`/businesses/${business.slug}`, locale)}
                  className="flex items-center gap-3 group hover:opacity-80 transition-opacity"
                >
                  {businessLogoUrl ? (
                    <Image
                      src={businessLogoUrl}
                      alt={business.name}
                      width={48}
                      height={48}
                      className="rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold group-hover:text-primary transition-colors">{business.name}</p>
                    {business.city && (
                      <p className="text-sm text-muted-foreground">{business.city}, {business.state || 'VT'}</p>
                    )}
                  </div>
                </Link>

                <div className="space-y-2 pt-2 border-t">
                  {business.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span>
                        {business.address}
                        {business.city && `, ${business.city}`}
                        {business.state && `, ${business.state}`}
                        {business.zipCode && ` ${business.zipCode}`}
                      </span>
                    </div>
                  )}
                  {business.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${business.phone}`} className="hover:underline">
                        {business.phone}
                      </a>
                    </div>
                  )}
                  {business.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${business.email}`} className="hover:underline">
                        {business.email}
                      </a>
                    </div>
                  )}
                  {business.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={
                          business.website.startsWith('http')
                            ? business.website
                            : `https://${business.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline truncate"
                      >
                        {business.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>

                <Link href={addLocaleToPathname(`/businesses/${business.slug}`, locale)}>
                  <Button variant="outline" className="w-full gap-2">
                    <Building2 className="h-4 w-4" />
                    {t.viewBusiness}
                  </Button>
                </Link>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Container>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const locale = getLocaleFromPathname(pathname)

  const payload = await getPayload({ config })

  const benefits = await payload.find({
    collection: 'benefits',
    where: {
      slug: { equals: slug },
      benefitStatus: { equals: 'published' },
    },
    limit: 1,
    locale,
  })

  const benefit = benefits.docs[0]

  if (!benefit) {
    return {
      title: 'Benefit Not Found',
    }
  }

  const business = benefit.business as Business | null

  return {
    title: `${benefit.title} | North Country Chamber of Commerce`,
    description: `${benefit.discountValue ? `${benefit.discountValue} - ` : ''}${business?.name ? `From ${business.name}` : 'Member benefit'}`,
  }
}
