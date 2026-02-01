import React from 'react'
import { Container } from '@/design-system/Container'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Calendar, Clock, MapPin, User, ExternalLink, RefreshCw, FileText } from 'lucide-react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getLocaleFromPathname, addLocaleToPathname } from '@/utilities/getLocale'
import { serializeLexical } from '@/utilities/serializeLexical'
import Image from 'next/image'
import { getOptimizedImageUrl } from '@/utilities/getMediaUrl'
import { BusinessMap } from '@/components/BusinessMap'
import type { Media, Business } from '@/payload-types'

interface EventPageProps {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{
    date?: string
  }>
}

export default async function EventPage({ params, searchParams }: EventPageProps) {
  const { slug } = await params
  const { date: occurrenceDate } = await searchParams
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const locale = getLocaleFromPathname(pathname)

  const payload = await getPayload({ config })

  const events = await payload.find({
    collection: 'events',
    where: {
      slug: {
        equals: slug,
      },
    },
    depth: 2,
    limit: 1,
    locale,
  })

  const event = events.docs[0]

  if (!event) {
    notFound()
  }

  // Use occurrence date if provided (for recurring events), otherwise use event date
  const displayDate = occurrenceDate || event.date

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Get recurrence description - uses event.date as the pattern source
  const getRecurrenceDescription = () => {
    if (!event.isRecurring || !event.recurrence || !event.date) return null

    const { recurrenceType, monthlyType } = event.recurrence
    const startDate = new Date(event.date)

    if (recurrenceType === 'weekly') {
      const dayName = startDate.toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-US', {
        weekday: 'long',
      })
      return locale === 'fr' ? `Chaque ${dayName}` : `Every ${dayName}`
    }

    if (recurrenceType === 'monthly') {
      if (monthlyType === 'dayOfMonth') {
        const dayOfMonth = startDate.getDate()
        return locale === 'fr'
          ? `Le ${dayOfMonth} de chaque mois`
          : `${dayOfMonth}${getOrdinalSuffix(dayOfMonth)} of each month`
      } else {
        const weekOfMonth = Math.ceil(startDate.getDate() / 7)
        const dayName = startDate.toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-US', {
          weekday: 'long',
        })
        const ordinals =
          locale === 'fr'
            ? ['premier', 'deuxième', 'troisième', 'quatrième', 'cinquième']
            : ['1st', '2nd', '3rd', '4th', '5th']
        return locale === 'fr'
          ? `Le ${ordinals[weekOfMonth - 1]} ${dayName} de chaque mois`
          : `${ordinals[weekOfMonth - 1]} ${dayName} of each month`
      }
    }

    return null
  }

  const getOrdinalSuffix = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd']
    const v = n % 100
    return s[(v - 20) % 10] || s[v] || s[0]
  }

  const translations = {
    en: {
      organizer: 'Organizer',
      location: 'Location',
      hostedBy: 'Hosted by',
      registerNow: 'Register Now',
      cancelled: 'This event has been cancelled',
      getDirections: 'Get Directions',
      chamberEvent: 'Chamber Event',
      recurringEvent: 'Recurring Event',
      attachment: 'Attachment',
      downloadPdf: 'Download PDF',
    },
    fr: {
      organizer: 'Organisateur',
      location: 'Lieu',
      hostedBy: 'Organisé par',
      registerNow: "S'inscrire maintenant",
      cancelled: 'Cet événement a été annulé',
      getDirections: 'Obtenir un itinéraire',
      chamberEvent: 'Événement de la chambre',
      recurringEvent: 'Événement récurrent',
      attachment: 'Pièce jointe',
      downloadPdf: 'Télécharger le PDF',
    },
  }

  const t = translations[locale]
  const recurrenceDescription = getRecurrenceDescription()

  return (
    <Container className="py-12 md:py-16">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          {event.eventStatus === 'cancelled' && (
            <div className="rounded-lg bg-destructive/10 border-destructive border p-4">
              <p className="text-destructive font-semibold text-center">{t.cancelled}</p>
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl flex-1">{event.title}</h1>
            {/* Right side: Business and Chamber logos */}
            {(() => {
              const business = event.business as Business | null
              const businessLogo = business?.logo as Media | null
              const businessLogoUrl = getOptimizedImageUrl(businessLogo, 'thumbnail')
              const hasLogos = businessLogoUrl || event.isChamberEvent

              if (!hasLogos) return null

              return (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {businessLogoUrl && business?.slug && (
                    <Link href={addLocaleToPathname(`/directory/${business.slug}`, locale)} title={business?.name || ''}>
                      <Image
                        src={businessLogoUrl}
                        alt={business?.name || 'Business'}
                        width={44}
                        height={44}
                        className="rounded-full object-cover hover:ring-2 hover:ring-primary transition-all"
                      />
                    </Link>
                  )}
                  {event.isChamberEvent && (
                    <span title={t.chamberEvent}>
                      <Image
                        src="/north-country-chamber-logo.png"
                        alt={t.chamberEvent}
                        width={44}
                        height={44}
                        className="rounded-full"
                      />
                    </span>
                  )}
                </div>
              )
            })()}
          </div>

          {/* Left side: Event badges */}
          {event.isRecurring && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-sm bg-muted px-3 py-1 rounded text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5" />
                {t.recurringEvent}
              </span>
            </div>
          )}

          {/* Recurrence description */}
          {recurrenceDescription && (
            <p className="text-sm text-muted-foreground">{recurrenceDescription}</p>
          )}
        </div>

        {/* Event Image */}
        {(() => {
          const image = event.image as Media | null
          const imageUrl = getOptimizedImageUrl(image, 'large')
          if (!imageUrl) return null
          return (
            <div className="relative w-full h-96 rounded-lg overflow-hidden">
              <Image
                src={imageUrl}
                alt={image?.alt || event.title}
                fill
                className="object-cover"
              />
            </div>
          )
        })()}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="p-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {serializeLexical(event.description)}
              </div>
            </Card>

            {/* External Link */}
            {event.externalUrl && (
              <a
                href={event.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                {event.linkTitle || t.registerNow}
              </a>
            )}

            {/* PDF Attachment */}
            {event.attachment && typeof event.attachment === 'object' && event.attachment.url && (
              <Card className="p-6">
                <h3 className="font-semibold mb-3">{t.attachment}</h3>
                <a
                  href={event.attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <FileText className="h-5 w-5" />
                  {event.attachment.filename || t.downloadPdf}
                </a>
                {/* Inline PDF viewer for larger screens */}
                <div className="hidden lg:block mt-4 h-96 border rounded overflow-hidden">
                  <iframe
                    src={`${event.attachment.url}#view=FitH`}
                    className="w-full h-full"
                    title={t.attachment}
                  />
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Date & Time */}
            <Card className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">{formatDate(displayDate)}</p>
                  {!event.isRecurring && event.endDate && event.endDate !== event.date && (
                    <p className="text-sm text-muted-foreground">to {formatDate(event.endDate)}</p>
                  )}
                </div>
              </div>

              {(event.startTime || event.endTime) && (
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <p>
                    {event.startTime}
                    {event.endTime && ` - ${event.endTime}`}
                  </p>
                </div>
              )}
            </Card>

            {/* Location */}
            {(event.location || event.address || event.city) && (
              <Card className="p-6 space-y-4">
                <h3 className="font-semibold">{t.location}</h3>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    {event.location && <p className="font-medium">{event.location}</p>}
                    {(event.address || event.city) && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {[event.address, event.city, event.state, event.zipCode]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Map if coordinates available */}
                {event.coordinates?.latitude && event.coordinates?.longitude && (
                  <div className="w-full h-48 rounded-lg overflow-hidden mt-4">
                    <BusinessMap
                      businesses={[
                        {
                          id: String(event.id),
                          name: event.title,
                          latitude: event.coordinates.latitude,
                          longitude: event.coordinates.longitude,
                          membershipTier: 'basic',
                          slug: event.slug!,
                        },
                      ]}
                      minHeight="100%"
                    />
                  </div>
                )}

                {/* Get Directions Link */}
                {event.coordinates?.latitude && event.coordinates?.longitude && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${event.coordinates.latitude},${event.coordinates.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {t.getDirections}
                  </a>
                )}
              </Card>
            )}

            {/* Organizer */}
            {(event.organizer || event.business) && (
              <Card className="p-6 space-y-4">
                <h3 className="font-semibold">{t.organizer}</h3>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    {event.organizer && <p>{event.organizer}</p>}
                    {event.business &&
                      typeof event.business !== 'string' &&
                      typeof event.business !== 'number' && (
                        <p className="text-sm text-muted-foreground">
                          {t.hostedBy} {event.business.name}
                        </p>
                      )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Container>
  )
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const locale = getLocaleFromPathname(pathname)

  const payload = await getPayload({ config })

  const events = await payload.find({
    collection: 'events',
    where: {
      slug: {
        equals: slug,
      },
    },
    depth: 2,
    limit: 1,
    locale,
  })

  const event = events.docs[0]

  if (!event) {
    return {
      title: 'Event Not Found',
    }
  }

  return {
    title: `${event.title} | North Country Chamber of Commerce`,
    description:
      typeof event.description === 'string'
        ? event.description
        : 'Event hosted by North Country Chamber of Commerce',
  }
}
