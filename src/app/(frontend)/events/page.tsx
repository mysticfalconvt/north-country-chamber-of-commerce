import React from 'react'
import { Container } from '@/design-system/Container'
import { getPayload, type PaginatedDocs } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Calendar, Clock, MapPin } from 'lucide-react'
import { headers } from 'next/headers'
import { getLocaleFromPathname, addLocaleToPathname } from '@/utilities/getLocale'
import EventsFilters from './EventsFilters'
import type { Event } from '@/payload-types'

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; showPast?: string }>
}) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const locale = getLocaleFromPathname(pathname)
  const params = await searchParams
  const selectedCategory = params.category
  const showPast = params.showPast === 'true'

  const payload = await getPayload({ config })

  // Get current date at start of day
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  // Get date for one week from now
  const oneWeekFromNow = new Date(now)
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7)

  // Build query
  const baseQuery: any = {
    eventStatus: {
      equals: 'published',
    },
  }

  // Add category filter if selected
  if (selectedCategory) {
    baseQuery.category = { equals: selectedCategory }
  }

  // Query for events happening this week
  const thisWeekEvents = await payload.find({
    collection: 'events',
    where: {
      ...baseQuery,
      date: {
        greater_than_equal: now.toISOString(),
        less_than: oneWeekFromNow.toISOString(),
      },
    },
    limit: 100,
    sort: 'date',
    depth: 1,
    locale,
  })

  // Query for upcoming events (after this week)
  const upcomingEvents = await payload.find({
    collection: 'events',
    where: {
      ...baseQuery,
      date: {
        greater_than_equal: oneWeekFromNow.toISOString(),
      },
    },
    limit: 100,
    sort: 'date',
    depth: 1,
    locale,
  })

  // Query for past events if requested
  let pastEvents: PaginatedDocs<Event> = {
    docs: [],
    totalDocs: 0,
    limit: 0,
    totalPages: 0,
    page: 1,
    pagingCounter: 1,
    hasPrevPage: false,
    hasNextPage: false,
    prevPage: null,
    nextPage: null,
  }
  if (showPast) {
    pastEvents = await payload.find({
      collection: 'events',
      where: {
        ...baseQuery,
        date: {
          less_than: now.toISOString(),
        },
      },
      limit: 50,
      sort: '-date', // Most recent first
      depth: 1,
      locale,
    })
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
    },
  }

  const t = translations[locale]

  const EventCard = ({ event }: { event: Event }) => (
    <Link
      key={event.id}
      href={addLocaleToPathname(`/events/${event.slug}`, locale)}
      className="group"
    >
      <Card className="h-full p-6 transition-all hover:shadow-lg">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
              {event.title}
            </h3>
            {event.category && (
              <span className="inline-block text-xs bg-muted px-2 py-1 rounded capitalize">
                {event.category}
              </span>
            )}
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(event.date)}</span>
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

  const hasAnyEvents =
    thisWeekEvents.docs.length > 0 ||
    upcomingEvents.docs.length > 0 ||
    (showPast && pastEvents.docs.length > 0)

  return (
    <Container className="py-12 md:py-16">
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{t.title}</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">{t.description}</p>
        </div>

        <EventsFilters selectedCategory={selectedCategory} showPast={showPast} locale={locale} />

        {!hasAnyEvents ? (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-muted-foreground">{t.noEvents}</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* This Week Section - Highlighted */}
            {thisWeekEvents.docs.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg">
                    <h2 className="text-2xl font-bold">{t.thisWeek}</h2>
                  </div>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  {thisWeekEvents.docs.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Events Section */}
            {upcomingEvents.docs.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">{t.upcoming}</h2>
                <div className="grid gap-6 lg:grid-cols-2">
                  {upcomingEvents.docs.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}

            {/* Past Events Section */}
            {showPast && pastEvents.docs.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-muted-foreground">{t.past}</h2>
                <div className="grid gap-6 lg:grid-cols-2 opacity-75">
                  {pastEvents.docs.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}

            {/* Show messages when specific sections are empty */}
            {thisWeekEvents.docs.length === 0 && upcomingEvents.docs.length > 0 && (
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
