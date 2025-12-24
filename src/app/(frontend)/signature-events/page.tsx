import React from 'react'
import { Container } from '@/design-system/Container'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { headers } from 'next/headers'
import { getLocaleFromPathname, addLocaleToPathname } from '@/utilities/getLocale'
import Image from 'next/image'
import { getMediaUrl } from '@/utilities/getMediaUrl'

export default async function SignatureEventsPage() {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const locale = getLocaleFromPathname(pathname)

  const payload = await getPayload({ config })

  const events = await payload.find({
    collection: 'signature-events',
    where: {
      eventStatus: {
        in: ['upcoming', 'active'],
      },
    },
    limit: 100,
    sort: '-year',
    depth: 1,
    locale,
  })

  const translations = {
    en: {
      title: 'Signature Events',
      description:
        'Join us for our annual signature events that bring together the community and showcase the best of the Northeast Kingdom.',
      noEvents: 'No upcoming signature events at this time.',
      viewDetails: 'View Details',
      applicationsOpen: 'Applications Open',
      year: 'Year',
    },
    fr: {
      title: 'Événements signature',
      description:
        'Rejoignez-nous pour nos événements signature annuels qui rassemblent la communauté et mettent en valeur le meilleur du Northeast Kingdom.',
      noEvents: 'Aucun événement signature à venir pour le moment.',
      viewDetails: 'Voir les détails',
      applicationsOpen: 'Inscriptions ouvertes',
      year: 'Année',
    },
  }

  const t = translations[locale]

  return (
    <Container className="py-12 md:py-16">
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{t.title}</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">{t.description}</p>
        </div>

        {events.docs.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2">
            {events.docs.map((event) => (
              <Link
                key={event.id}
                href={addLocaleToPathname(`/signature-events/${event.slug}`, locale)}
                className="group"
              >
                <Card className="h-full overflow-hidden transition-all hover:shadow-lg">
                  {event.logo && typeof event.logo !== 'string' && typeof event.logo !== 'number' && (
                    <div className="relative w-full h-48 bg-muted">
                      <Image
                        src={getMediaUrl(event.logo.url)}
                        alt={event.logo.alt || event.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-semibold group-hover:text-primary transition-colors">
                        {event.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t.year}: {event.year}
                      </p>
                    </div>

                    {event.applicationOpen && (
                      <div className="inline-block">
                        <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                          {t.applicationsOpen}
                        </span>
                      </div>
                    )}

                    <p className="text-primary group-hover:underline">{t.viewDetails} →</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-muted-foreground">{t.noEvents}</p>
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
      title: 'Signature Events | North Country Chamber of Commerce',
      description:
        'Discover our annual signature events including Hot Rod ChiliFest and AquaFest in the Northeast Kingdom.',
    },
    fr: {
      title: 'Événements signature | Chambre de commerce du North Country',
      description:
        'Découvrez nos événements signature annuels, y compris le Hot Rod ChiliFest et AquaFest dans le Northeast Kingdom.',
    },
  }

  return metadata[locale]
}
