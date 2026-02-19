'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, CheckCircle, AlertCircle } from 'lucide-react'
import { useDocumentInfo } from '@payloadcms/ui'

export const SendNewsletterButton = () => {
  const { id } = useDocumentInfo()
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [subscriberCount, setSubscriberCount] = useState(0)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [publishStatus, setPublishStatus] = useState('')

  const newsId = id

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch news item to check if email already sent and if published
        const newsRes = await fetch(`/api/news/${newsId}`)
        const newsData = await newsRes.json()
        setEmailSent(newsData.emailSent || false)
        setPublishStatus(newsData._status || 'draft')

        // Fetch upcoming events count
        const now = new Date()
        const futureDate = new Date(now)
        futureDate.setDate(futureDate.getDate() + 45)

        const eventsRes = await fetch(
          `/api/events?where[and][0][date][greater_than_equal]=${now.toISOString()}&where[and][1][date][less_than_equal]=${futureDate.toISOString()}&where[and][2][eventStatus][equals]=published&limit=5`,
        )
        const eventsData = await eventsRes.json()
        setUpcomingEvents(eventsData.docs || [])

        // Fetch subscriber count
        const subscribersRes = await fetch(
          `/api/mailing-list?where[subscribed][equals]=true&limit=0`,
        )
        const subscribersData = await subscribersRes.json()
        setSubscriberCount(subscribersData.totalDocs || 0)
      } catch (err) {
        console.error('Failed to fetch data:', err)
      }
    }

    if (newsId) {
      fetchData()
    }
  }, [newsId])

  const handleSend = async () => {
    setSending(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/send-newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newsId: newsId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send newsletter')
      }

      setSuccess(true)
      setEmailSent(true)
      setShowConfirmation(false)

      // Refresh the page after 2 seconds to show updated state
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSending(false)
    }
  }

  if (!newsId) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500">Save the news item first to send as newsletter</p>
      </div>
    )
  }

  if (publishStatus !== 'published') {
    return (
      <div className="p-4">
        <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            This news item must be published before it can be sent as a newsletter
          </p>
        </div>
      </div>
    )
  }

  if (emailSent) {
    return (
      <div className="p-4">
        <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-800 dark:text-green-200">
            This news item has already been sent as a newsletter
          </p>
        </div>
      </div>
    )
  }

  if (showConfirmation) {
    return (
      <div className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Confirm Newsletter Send</h3>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Recipients:</strong> {subscriberCount} subscribers
            </p>
            {upcomingEvents.length > 0 && (
              <div>
                <strong>Included Events ({upcomingEvents.length}):</strong>
                <ul className="list-disc list-inside ml-2 mt-1">
                  {upcomingEvents.map((event) => (
                    <li key={event.id} className="text-xs text-gray-600 dark:text-gray-400">
                      {event.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
            <p className="text-sm text-green-800 dark:text-green-200">
              Newsletter sent successfully!
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleSend} disabled={sending || success} className="flex-1" size="sm">
            {sending ? 'Sending...' : 'Confirm Send'}
          </Button>
          <Button
            onClick={() => setShowConfirmation(false)}
            disabled={sending}
            variant="outline"
            size="sm"
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="space-y-3">
        <div className="text-sm space-y-1">
          <p>
            <strong>Subscribers:</strong> {subscriberCount}
          </p>
          {upcomingEvents.length > 0 && (
            <p>
              <strong>Upcoming Events:</strong> {upcomingEvents.length} will be included
            </p>
          )}
        </div>

        <Button
          onClick={() => setShowConfirmation(true)}
          className="w-full"
          size="sm"
          disabled={subscriberCount === 0}
        >
          <Mail className="h-4 w-4 mr-2" />
          Send as Newsletter
        </Button>

        {subscriberCount === 0 && <p className="text-xs text-gray-500">No active subscribers</p>}
      </div>
    </div>
  )
}
