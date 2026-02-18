import { requireBusinessMember } from '@/utilities/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import EventForm from '../EventForm'

export default async function NewEventPage() {
  const user = await requireBusinessMember()

  let businessLocation: { location?: string; address?: string; city?: string; state?: string; zipCode?: string } | undefined

  if (user.business) {
    try {
      const payload = await getPayload({ config })
      const businessId = typeof user.business === 'number' ? user.business : user.business.id
      const business = await payload.findByID({
        collection: 'businesses',
        id: businessId,
      })

      if (business) {
        businessLocation = {
          location: business.name,
          address: business.address || undefined,
          city: business.city || undefined,
          state: business.state || undefined,
          zipCode: business.zipCode || undefined,
        }
      }
    } catch (_error) {
      // Silently continue without business location defaults
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Event</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Add a new event for your business</p>
      </div>

      <EventForm businessLocation={businessLocation} />
    </div>
  )
}
