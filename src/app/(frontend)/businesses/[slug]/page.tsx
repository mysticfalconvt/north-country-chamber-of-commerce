import React from 'react'
import { Container } from '@/design-system/Container'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { MapPinIcon, PhoneIcon, MailIcon, GlobeIcon, ClockIcon } from 'lucide-react'
import type { Metadata } from 'next'
import { BusinessMap } from '@/components/BusinessMap'
import { serializeLexical } from '@/utilities/serializeLexical'

interface BusinessPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function BusinessPage({ params }: BusinessPageProps) {
  const { slug } = await params
  const payload = await getPayload({ config })

  const businesses = await payload.find({
    collection: 'businesses',
    where: {
      slug: {
        equals: slug,
      },
    },
    depth: 2,
    limit: 1,
  })

  const business = businesses.docs[0]

  if (!business) {
    notFound()
  }

  return (
    <Container className="py-12 md:py-16">
      <div className="space-y-8">
        {/* Back link */}
        <Link href="/businesses" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to directory
        </Link>

        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start gap-6">
            {business.logo && typeof business.logo === 'object' && (
              <img
                src={business.logo.url || ''}
                alt={business.logo.alt || business.name}
                className="w-24 h-24 object-contain rounded-lg"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold tracking-tight">{business.name}</h1>
                {business.featured && <span className="text-amber-500 text-xl">★</span>}
              </div>
              {business.category &&
                Array.isArray(business.category) &&
                business.category.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {business.category.map((cat) => (
                      <span
                        key={typeof cat === 'string' || typeof cat === 'number' ? cat : cat.id}
                        className="text-sm bg-muted px-3 py-1 rounded-full"
                      >
                        {typeof cat === 'string' || typeof cat === 'number' ? cat : cat.name}
                      </span>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Cover Image */}
            {business.coverImage && typeof business.coverImage === 'object' && (
              <img
                src={business.coverImage.url || ''}
                alt={business.coverImage.alt || business.name}
                className="w-full h-64 object-cover rounded-lg"
              />
            )}

            {/* Description */}
            {business.description && (
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4">About</h2>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {serializeLexical(business.description)}
                </div>
              </Card>
            )}

            {/* Hours of Operation */}
            {business.hoursOfOperation && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ClockIcon className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-xl font-semibold">Hours of Operation</h2>
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {serializeLexical(business.hoursOfOperation)}
                </div>
              </Card>
            )}

            {/* Advertising Slots */}
            {business.advertisingSlots &&
              Array.isArray(business.advertisingSlots) &&
              business.advertisingSlots.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold">Gallery & Offers</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {business.advertisingSlots.map((slot, index) => (
                      <Card key={index} className="p-4">
                        {slot.type === 'image' && slot.media && typeof slot.media === 'object' && (
                          <img
                            src={slot.media.url || ''}
                            alt={slot.caption || ''}
                            className="w-full h-48 object-cover rounded-lg mb-2"
                          />
                        )}
                        {slot.type === 'offer' && (
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg">{slot.offerTitle}</h3>
                            {slot.offerDescription && (
                              <div className="prose prose-sm dark:prose-invert">
                                {serializeLexical(slot.offerDescription)}
                              </div>
                            )}
                          </div>
                        )}
                        {slot.caption && (
                          <p className="text-sm text-muted-foreground mt-2">{slot.caption}</p>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* Sidebar - Contact Info */}
          <div className="space-y-4">
            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-semibold">Contact Information</h2>

              {(business.address || business.city || business.state) && (
                <div className="flex gap-3">
                  <MapPinIcon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    {business.address && <p>{business.address}</p>}
                    {(business.city || business.state) && (
                      <p>
                        {business.city}
                        {business.state && `, ${business.state}`}
                        {business.zipCode && ` ${business.zipCode}`}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {business.phone && (
                <div className="flex gap-3">
                  <PhoneIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <a href={`tel:${business.phone}`} className="hover:text-primary">
                    {business.phone}
                  </a>
                </div>
              )}

              {business.email && (
                <div className="flex gap-3">
                  <MailIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <a href={`mailto:${business.email}`} className="hover:text-primary break-all">
                    {business.email}
                  </a>
                </div>
              )}

              {business.website && (
                <div className="flex gap-3">
                  <GlobeIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary break-all"
                  >
                    Visit Website →
                  </a>
                </div>
              )}

              {business.socialLinks &&
                Array.isArray(business.socialLinks) &&
                business.socialLinks.length > 0 && (
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-semibold mb-3">Follow Us</h3>
                    <div className="flex flex-wrap gap-2">
                      {business.socialLinks.map((link, index) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-muted rounded-md text-sm hover:bg-muted/80 capitalize"
                        >
                          {link.platform}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

              {business.membershipTier && business.membershipTier !== 'basic' && (
                <div className="pt-4 border-t">
                  <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium capitalize">
                    {business.membershipTier} Member
                  </span>
                </div>
              )}
            </Card>

            {/* Map if coordinates available */}
            {business.coordinates?.latitude && business.coordinates?.longitude && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-3">Location</h3>
                <div className="w-full h-64 rounded-lg overflow-hidden">
                  <BusinessMap
                    businesses={[
                      {
                        id: String(business.id),
                        name: business.name,
                        latitude: business.coordinates.latitude,
                        longitude: business.coordinates.longitude,
                        membershipTier:
                          (business.membershipTier as 'basic' | 'featured' | 'premium') || 'basic',
                        slug: business.slug!,
                        phone: business.phone || undefined,
                      },
                    ]}
                    minHeight="100%"
                  />
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${business.coordinates.latitude},${business.coordinates.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-3 text-sm text-primary hover:underline text-center"
                >
                  Get Directions →
                </a>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Container>
  )
}

export async function generateMetadata({ params }: BusinessPageProps): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config })

  const businesses = await payload.find({
    collection: 'businesses',
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
  })

  const business = businesses.docs[0]

  if (!business) {
    return {
      title: 'Business Not Found',
    }
  }

  return {
    title: `${business.name} | North Country Chamber of Commerce`,
    description: `Contact information and details for ${business.name} in Vermont's Northeast Kingdom.`,
  }
}
