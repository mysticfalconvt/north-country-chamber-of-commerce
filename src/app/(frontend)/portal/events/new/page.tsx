import { requireBusinessMember } from '@/utilities/auth'
import EventForm from '../EventForm'

export default async function NewEventPage() {
  await requireBusinessMember()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Event</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Add a new event for your business</p>
      </div>

      <EventForm />
    </div>
  )
}
