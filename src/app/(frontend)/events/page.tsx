import React from 'react'
import { Container } from '@/design-system/Container'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Calendar, Clock, MapPin } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  const payload = await getPayload({ config })

  const events = await payload.find({
    collection: 'events',
    where: {
      eventStatus: {
        equals: 'published',
      },
    },
    limit: 100,
    sort: 'date',
    depth: 1,
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Container className="py-12 md:py-16">
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Events</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Stay connected with upcoming events, networking opportunities, and community gatherings
            in the Northeast Kingdom.
          </p>
        </div>

        {events.docs.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {events.docs.map((event) => (
              <Link key={event.id} href={`/events/${event.slug}`} className="group">
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
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-muted-foreground">No upcoming events at this time.</p>
          </div>
        )}
      </div>
    </Container>
  )
}

export function generateMetadata() {
  return {
    title: 'Events | North Country Chamber of Commerce',
    description:
      "Discover upcoming chamber events, networking opportunities, and community gatherings in Vermont's Northeast Kingdom.",
  }
}
