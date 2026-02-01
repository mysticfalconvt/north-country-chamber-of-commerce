'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TimeInput } from '@/components/ui/time-input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function EventForm({ event }: { event?: any }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: event ? (typeof event.title === 'string' ? event.title : event.title?.en || '') : '',
    description: event
      ? typeof event.description === 'string'
        ? event.description
        : event.description?.root?.children?.[0]?.children?.[0]?.text || ''
      : '',
    location: event?.location || '',
    address: event?.address || '',
    city: event?.city || '',
    state: event?.state || 'VT',
    zipCode: event?.zipCode || '',
    externalUrl: event?.externalUrl || '',
    linkTitle: event?.linkTitle || '',
  })

  const [date, setDate] = useState<Date | undefined>(event?.date ? new Date(event.date) : undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(
    event?.endDate ? new Date(event.endDate) : undefined,
  )
  const [startTime, setStartTime] = useState(event?.startTime || '')
  const [endTime, setEndTime] = useState(event?.endTime || '')

  // Recurring event state
  const [isRecurring, setIsRecurring] = useState(event?.isRecurring || false)
  const [recurrenceType, setRecurrenceType] = useState(event?.recurrence?.recurrenceType || '')
  const [monthlyType, setMonthlyType] = useState(event?.recurrence?.monthlyType || 'dayOfMonth')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!date) {
        throw new Error('Start date is required')
      }

      // Validate recurring event fields
      if (isRecurring) {
        if (!recurrenceType) {
          throw new Error('Please select a recurrence pattern')
        }
        if (!endDate) {
          throw new Error('End date is required for recurring events')
        }
        if (date && endDate && date > endDate) {
          throw new Error('End date must be after start date')
        }
      }

      // Convert to Lexical format
      const description = {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', text: formData.description }],
            },
          ],
        },
      }

      // Combine date and time if provided
      const startDateTime = new Date(date)
      if (startTime) {
        const [hours, minutes] = startTime.split(':').map(Number)
        startDateTime.setHours(hours, minutes, 0, 0)
      }

      let endDateTime = null
      if (endDate) {
        endDateTime = new Date(endDate)
        if (endTime) {
          const [hours, minutes] = endTime.split(':').map(Number)
          endDateTime.setHours(hours, minutes, 0, 0)
        }
      }

      const eventData: any = {
        ...(event && { id: event.id }),
        title: formData.title,
        description,
        date: startDateTime.toISOString(),
        endDate: endDateTime ? endDateTime.toISOString() : null,
        startTime: startTime || null,
        endTime: endTime || null,
        location: formData.location,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        externalUrl: formData.externalUrl || null,
        linkTitle: formData.linkTitle || null,
        isRecurring,
        eventStatus: 'pending',
        _status: 'published',
      }

      // Add recurrence data if recurring
      if (isRecurring) {
        eventData.recurrence = {
          recurrenceType,
          monthlyType: recurrenceType === 'monthly' ? monthlyType : null,
        }
      } else {
        eventData.recurrence = null
      }

      const response = await fetch('/api/portal/events', {
        method: event ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      })

      if (!response.ok) {
        throw new Error('Failed to save event')
      }

      router.push('/portal/events')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-900 dark:text-red-200">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div>
          <Label htmlFor="title">Event Title *</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="mt-1"
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Start Date *</Label>
            <DatePicker
              date={date}
              onDateChange={setDate}
              placeholder="Pick a start date"
              className="mt-1"
            />
          </div>

          <div>
            <Label>End Date {isRecurring ? '*' : '(optional)'}</Label>
            <DatePicker
              date={endDate}
              onDateChange={setEndDate}
              placeholder={isRecurring ? 'When recurrence ends' : 'Pick an end date'}
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startTime">Start Time</Label>
            <TimeInput
              id="startTime"
              name="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="endTime">End Time</Label>
            <TimeInput
              id="endTime"
              name="endTime"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Recurring Event Settings */}
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md">
          <div className="flex items-center gap-3">
            <Checkbox
              id="isRecurring"
              checked={isRecurring}
              onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
            />
            <Label htmlFor="isRecurring" className="font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              This is a recurring event
            </Label>
          </div>

          {isRecurring && (
            <div className="space-y-4 mt-4 pl-7">
              <div>
                <Label>Recurrence Pattern *</Label>
                <Select value={recurrenceType} onValueChange={setRecurrenceType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                {recurrenceType === 'weekly' && date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Repeats every {date.toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
                )}
              </div>

              {recurrenceType === 'monthly' && (
                <div>
                  <Label>Monthly Pattern</Label>
                  <Select value={monthlyType} onValueChange={setMonthlyType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dayOfMonth">Same day of month (e.g., 15th)</SelectItem>
                      <SelectItem value="dayOfWeek">Same week & day (e.g., 2nd Tuesday)</SelectItem>
                    </SelectContent>
                  </Select>
                  {date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {monthlyType === 'dayOfMonth'
                        ? `Repeats on the ${date.getDate()}${getOrdinalSuffix(date.getDate())} of each month`
                        : `Repeats on the ${getWeekOrdinal(date)} ${date.toLocaleDateString('en-US', { weekday: 'long' })} of each month`}
                    </p>
                  )}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Use the <strong>End Date</strong> field above to set when the recurring series ends.
              </p>
            </div>
          )}
        </div>

        {/* Location */}
        <div>
          <Label htmlFor="location">Location Name</Label>
          <Input
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="mt-1"
            placeholder="e.g., Newport Town Hall"
          />
        </div>

        <div>
          <Label htmlFor="address">Street Address</Label>
          <Input
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="zipCode">ZIP</Label>
            <Input
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
        </div>

        {/* External Link */}
        <div>
          <Label htmlFor="externalUrl">External URL (optional)</Label>
          <Input
            id="externalUrl"
            name="externalUrl"
            type="url"
            value={formData.externalUrl}
            onChange={handleChange}
            className="mt-1"
            placeholder="https://..."
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Link to external registration or more info
          </p>
        </div>

        {formData.externalUrl && (
          <div>
            <Label htmlFor="linkTitle">Link Button Text</Label>
            <Input
              id="linkTitle"
              name="linkTitle"
              value={formData.linkTitle}
              onChange={handleChange}
              className="mt-1"
              placeholder="e.g., Buy Tickets, Register, RSVP"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Custom text for the link button (defaults to "Register Now")
            </p>
          </div>
        )}

        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
          </Button>
        </div>
      </form>
    </div>
  )
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

function getWeekOrdinal(date: Date): string {
  const weekOfMonth = Math.ceil(date.getDate() / 7)
  const ordinals = ['1st', '2nd', '3rd', '4th', '5th']
  return ordinals[weekOfMonth - 1] || `${weekOfMonth}th`
}
