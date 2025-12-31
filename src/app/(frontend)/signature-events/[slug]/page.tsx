import React from 'react'
import { Container } from '@/design-system/Container'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getLocaleFromPathname } from '@/utilities/getLocale'
import { serializeLexical } from '@/utilities/serializeLexical'
import Image from 'next/image'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { EventApplicationForm } from '@/components/EventApplicationForm'
import { Calendar, Mail } from 'lucide-react'

interface SignatureEventPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function SignatureEventPage({ params }: SignatureEventPageProps) {
  const { slug } = await params
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const locale = getLocaleFromPathname(pathname)

  const payload = await getPayload({ config })

  const events = await payload.find({
    collection: 'signature-events',
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const translations = {
    en: {
      year: 'Year',
      schedule: 'Schedule',
      vendors: 'Vendors',
      rules: 'Rules & Regulations',
      howToApply: 'How to Apply',
      applicationDeadline: 'Application Deadline',
      contact: 'Contact',
      gallery: 'Photo Gallery',
      applicationsOpen: 'Applications are now open!',
      applicationsClosed: 'Applications are currently closed.',
    },
    fr: {
      year: 'Année',
      schedule: 'Horaire',
      vendors: 'Vendeurs',
      rules: 'Règles et règlements',
      howToApply: 'Comment postuler',
      applicationDeadline: 'Date limite de candidature',
      contact: 'Contact',
      gallery: 'Galerie de photos',
      applicationsOpen: 'Les inscriptions sont maintenant ouvertes !',
      applicationsClosed: 'Les inscriptions sont actuellement fermées.',
    },
  }

  const t = translations[locale]

  return (
    <Container className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{event.name}</h1>
            <div className="text-lg font-semibold text-muted-foreground">
              {t.year} {event.year}
            </div>
          </div>

          {event.applicationOpen && (
            <div className="p-4 bg-primary/10 border-primary border rounded-lg">
              <p className="text-primary font-semibold">{t.applicationsOpen}</p>
            </div>
          )}
        </div>

        {/* Logo */}
        {event.logo && typeof event.logo !== 'string' && typeof event.logo !== 'number' && (
          <div className="relative w-full h-96 rounded-lg overflow-hidden">
            <Image
              src={getMediaUrl(event.logo.url)}
              alt={event.logo.alt || event.name}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Description */}
        <Card className="p-6">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {serializeLexical(event.description)}
          </div>
        </Card>

        {/* Schedule */}
        {event.schedule && (
          <div>
            <h2 className="text-3xl font-bold mb-6">{t.schedule}</h2>
            <Card className="p-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {serializeLexical(event.schedule)}
              </div>
            </Card>
          </div>
        )}

        {/* Gallery */}
        {event.gallery && Array.isArray(event.gallery) && event.gallery.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold mb-6">{t.gallery}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {event.gallery.map((item, index) => {
                const image =
                  typeof item.image !== 'string' && typeof item.image !== 'number'
                    ? item.image
                    : null
                if (!image) return null

                return (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                    <Image
                      src={getMediaUrl(image.url)}
                      alt={image.alt || `Gallery image ${index + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Vendors */}
        {event.vendors && (
          <div>
            <h2 className="text-3xl font-bold mb-6">{t.vendors}</h2>
            <Card className="p-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {serializeLexical(event.vendors)}
              </div>
            </Card>
          </div>
        )}

        {/* Rules */}
        {event.rules && (
          <div>
            <h2 className="text-3xl font-bold mb-6">{t.rules}</h2>
            <Card className="p-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {serializeLexical(event.rules)}
              </div>
            </Card>
          </div>
        )}

        {/* Application Section */}
        {event.applicationOpen && (
          <div id="apply" className="scroll-mt-8">
            <h2 className="text-3xl font-bold mb-6">{t.howToApply}</h2>

            {/* Application Instructions */}
            {event.applicationForm && (
              <Card className="p-6 mb-6">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {serializeLexical(event.applicationForm)}
                </div>
              </Card>
            )}

            {/* Application Deadline & Contact */}
            <div className="grid gap-6 md:grid-cols-2 mb-6">
              {event.applicationDeadline && (
                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-6 w-6 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t.applicationDeadline}</p>
                      <p className="font-semibold">{formatDate(event.applicationDeadline)}</p>
                    </div>
                  </div>
                </Card>
              )}

              {event.contactEmail && (
                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <Mail className="h-6 w-6 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t.contact}</p>
                      <a
                        href={`mailto:${event.contactEmail}`}
                        className="font-semibold hover:underline"
                      >
                        {event.contactEmail}
                      </a>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Application Form */}
            <EventApplicationForm
              eventId={String(event.id)}
              eventName={event.name}
              locale={locale}
            />
          </div>
        )}

        {!event.applicationOpen && (
          <div className="p-8 bg-muted rounded-lg text-center">
            <p className="text-muted-foreground">{t.applicationsClosed}</p>
          </div>
        )}
      </div>
    </Container>
  )
}

export async function generateMetadata({ params }: SignatureEventPageProps): Promise<Metadata> {
  const { slug } = await params
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const locale = getLocaleFromPathname(pathname)

  const payload = await getPayload({ config })

  const events = await payload.find({
    collection: 'signature-events',
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
    title: `${event.name} ${event.year} | North Country Chamber of Commerce`,
    description: `Join us for ${event.name} ${event.year} in the Northeast Kingdom.`,
  }
}
