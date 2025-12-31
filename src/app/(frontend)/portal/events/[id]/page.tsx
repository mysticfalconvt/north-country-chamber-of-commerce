import { requireBusinessMember } from '@/utilities/auth'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { redirect } from 'next/navigation'
import EventForm from '../EventForm'

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireBusinessMember()
  const payload = await getPayload({ config })
  const { id } = await params

  const businessId = typeof user.business === 'number' ? user.business : user.business?.id

  if (!businessId) {
    redirect('/portal')
  }

  // Get the event
  const event = await payload.findByID({
    collection: 'events',
    id,
  })

  // Verify ownership
  const eventBusinessId = typeof event.business === 'number' ? event.business : event.business?.id

  if (eventBusinessId !== businessId) {
    redirect('/portal/events')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Event</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Update your event details</p>
      </div>

      <EventForm event={event} />
    </div>
  )
}
