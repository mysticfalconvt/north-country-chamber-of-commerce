import { requireBusinessMember } from '@/utilities/auth'
import { getPayload } from 'payload'
import config from '@/payload.config'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Plus } from 'lucide-react'

export default async function EventsPage() {
  const user = await requireBusinessMember()
  const payload = await getPayload({ config })

  // Get the user's business
  const businessId = typeof user.business === 'number' ? user.business : user.business?.id

  if (!businessId) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-900 dark:text-yellow-200">
          Your account is not linked to a business profile. Please contact chamber staff.
        </p>
      </div>
    )
  }

  // Get all events for this business
  const events = await payload.find({
    collection: 'events',
    where: {
      business: { equals: businessId },
    },
    sort: '-date',
    limit: 100,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Events</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your business events</p>
        </div>
        <Link href="/portal/events/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        </Link>
      </div>

      {events.docs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No events yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first event to get started
          </p>
          <Link href="/portal/events/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {events.docs.map((event) => (
            <Link
              key={event.id}
              href={`/portal/events/${event.id}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {typeof event.title === 'string'
                      ? event.title
                      : (event.title as any)?.en || 'Untitled Event'}
                  </h3>

                  <div className="space-y-2">
                    {event.date && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(event.date).toLocaleDateString()}
                          {event.startTime && ` at ${event.startTime}`}
                        </span>
                      </div>
                    )}

                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        event._status === 'published'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {event._status}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
