import React from 'react'
import { Container } from '@/design-system/Container'
import { getPayload, type PaginatedDocs } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Calendar, Clock, MapPin, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import { headers } from 'next/headers'
import { getLocaleFromPathname, addLocaleToPathname } from '@/utilities/getLocale'
import EventsSearch from './EventsSearch'
import { expandRecurringEvents, type EventOccurrence } from '@/utilities/expandRecurringEvents'
import { getOptimizedImageUrl } from '@/utilities/getMediaUrl'
import type { Event, Business, Media } from '@/payload-types'

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; showPast?: string }>
}) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const locale = getLocaleFromPathname(pathname)
  const params = await searchParams
  const searchQuery = params.q || ''
  const showPast = params.showPast === 'true'

  const payload = await getPayload({ config })

  // Get current date at start of day
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  // Get date for one week from now
  const oneWeekFromNow = new Date(now)
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7)

  // Get date for 6 months from now (for recurring event expansion)
  const sixMonthsFromNow = new Date(now)
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)

  // Build query
  const baseQuery: any = {
    eventStatus: {
      equals: 'published',
    },
  }

  // Add search filter if provided
  if (searchQuery) {
    baseQuery.or = [
      { 'title.en': { like: searchQuery } },
      { 'title.fr': { like: searchQuery } },
      { location: { like: searchQuery } },
      { city: { like: searchQuery } },
    ]
  }

  // Query for all future events (including recurring ones)
  const futureEvents = await payload.find({
    collection: 'events',
    where: {
      ...baseQuery,
      or: [
        // Non-recurring events with date in the future
        {
          and: [
            { isRecurring: { not_equals: true } },
            { date: { greater_than_equal: now.toISOString() } },
          ],
        },
        // Recurring events where end date (when recurrence ends) is in the future
        {
          and: [
            { isRecurring: { equals: true } },
            { endDate: { greater_than_equal: now.toISOString() } },
          ],
        },
      ],
    },
    limit: 200,
    sort: 'date',
    depth: 2,
    locale,
  })

  // Expand recurring events
  const expandedFutureEvents = expandRecurringEvents(futureEvents.docs, now, sixMonthsFromNow)

  // Split into this week and upcoming
  const thisWeekOccurrences = expandedFutureEvents.filter((occ) => {
    const occDate = new Date(occ.occurrenceDate)
    return occDate >= now && occDate < oneWeekFromNow
  })

  const upcomingOccurrences = expandedFutureEvents.filter((occ) => {
    const occDate = new Date(occ.occurrenceDate)
    return occDate >= oneWeekFromNow
  })

  // Query for past events if requested
  let pastOccurrences: EventOccurrence[] = []
  if (showPast) {
    const pastEvents = await payload.find({
      collection: 'events',
      where: {
        ...baseQuery,
        isRecurring: { not_equals: true }, // Don't show recurring events in past
        date: {
          less_than: now.toISOString(),
        },
      },
      limit: 50,
      sort: '-date', // Most recent first
      depth: 2,
      locale,
    })
    pastOccurrences = pastEvents.docs.map((event) => ({
      event,
      occurrenceDate: event.date,
      isRecurringInstance: false,
    }))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const translations = {
    en: {
      title: 'Events',
      description:
        'Stay connected with upcoming events, networking opportunities, and community gatherings in the Northeast Kingdom.',
      thisWeek: 'This Week',
      upcoming: 'Upcoming Events',
      past: 'Past Events',
      noEvents: 'No events found.',
      noThisWeek: 'No events scheduled for this week.',
      noUpcoming: 'No upcoming events at this time.',
      noPast: 'No past events to display.',
      recurring: 'Recurring',
      chamberEvent: 'Chamber Event',
    },
    fr: {
      title: 'Événements',
      description:
        'Restez connecté avec les événements à venir, les opportunités de réseautage et les rassemblements communautaires dans le Northeast Kingdom.',
      thisWeek: 'Cette semaine',
      upcoming: 'Événements à venir',
      past: 'Événements passés',
      noEvents: 'Aucun événement trouvé.',
      noThisWeek: 'Aucun événement prévu pour cette semaine.',
      noUpcoming: 'Aucun événement à venir pour le moment.',
      noPast: 'Aucun événement passé à afficher.',
      recurring: 'Récurrent',
      chamberEvent: 'Événement de la chambre',
    },
  }

  const t = translations[locale]

  const EventCard = ({ occurrence }: { occurrence: EventOccurrence }) => {
    const { event, occurrenceDate, isRecurringInstance } = occurrence
    // Build URL with occurrence date for recurring events
    const eventUrl = isRecurringInstance
      ? addLocaleToPathname(`/events/${event.slug}?date=${occurrenceDate}`, locale)
      : addLocaleToPathname(`/events/${event.slug}`, locale)

    // Get business logo if event has a business
    const business = event.business as Business | null
    const businessLogo = business?.logo as Media | null
    const businessLogoUrl = getOptimizedImageUrl(businessLogo, 'thumbnail')

    return (
      <Link href={eventUrl} className="group">
        <Card className="h-full p-6 transition-all hover:shadow-lg">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xl font-semibold group-hover:text-primary transition-colors flex-1">
                  {event.title}
                </h3>
                {/* Right side: Business and Chamber logos */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {businessLogoUrl && (
                    <span title={business?.name || ''}>
                      <Image
                        src={businessLogoUrl}
                        alt={business?.name || 'Business'}
                        width={28}
                        height={28}
                        className="rounded-full object-cover"
                      />
                    </span>
                  )}
                  {event.isChamberEvent && (
                    <span title={t.chamberEvent}>
                      <Image
                        src="/north-country-chamber-logo.png"
                        alt={t.chamberEvent}
                        width={28}
                        height={28}
                        className="rounded-full"
                      />
                    </span>
                  )}
                </div>
              </div>
              {/* Left side: Event badges */}
              {isRecurringInstance && (
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                    <RefreshCw className="h-3 w-3" />
                    {t.recurring}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(occurrenceDate)}</span>
              </div>
              {event.startTime && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {event.startTime}
                    {event.endTime && ` - ${event.endTime}`}
                  </span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </Link>
    )
  }

  const hasAnyEvents =
    thisWeekOccurrences.length > 0 ||
    upcomingOccurrences.length > 0 ||
    (showPast && pastOccurrences.length > 0)

  return (
    <Container className="py-12 md:py-16">
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{t.title}</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">{t.description}</p>
        </div>

        <EventsSearch showPast={showPast} locale={locale} initialQuery={searchQuery} />

        {!hasAnyEvents ? (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-muted-foreground">{t.noEvents}</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* This Week Section - Highlighted */}
            {thisWeekOccurrences.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg">
                    <h2 className="text-2xl font-bold">{t.thisWeek}</h2>
                  </div>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  {thisWeekOccurrences.map((occurrence, index) => (
                    <EventCard
                      key={`${occurrence.event.id}-${occurrence.occurrenceDate}-${index}`}
                      occurrence={occurrence}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Events Section */}
            {upcomingOccurrences.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">{t.upcoming}</h2>
                <div className="grid gap-6 lg:grid-cols-2">
                  {upcomingOccurrences.map((occurrence, index) => (
                    <EventCard
                      key={`${occurrence.event.id}-${occurrence.occurrenceDate}-${index}`}
                      occurrence={occurrence}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past Events Section */}
            {showPast && pastOccurrences.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-muted-foreground">{t.past}</h2>
                <div className="grid gap-6 lg:grid-cols-2 opacity-75">
                  {pastOccurrences.map((occurrence, index) => (
                    <EventCard
                      key={`${occurrence.event.id}-${occurrence.occurrenceDate}-${index}`}
                      occurrence={occurrence}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Show messages when specific sections are empty */}
            {thisWeekOccurrences.length === 0 && upcomingOccurrences.length > 0 && (
              <div className="rounded-lg border bg-muted/50 p-6 text-center">
                <p className="text-sm text-muted-foreground">{t.noThisWeek}</p>
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
      title: 'Events | North Country Chamber of Commerce',
      description:
        "Discover upcoming chamber events, networking opportunities, and community gatherings in Vermont's Northeast Kingdom.",
    },
    fr: {
      title: 'Événements | Chambre de commerce du North Country',
      description:
        'Découvrez les événements à venir de la chambre, les opportunités de réseautage et les rassemblements communautaires dans le Northeast Kingdom du Vermont.',
    },
  }

  return metadata[locale]
}
