import React from 'react'
import { Container } from '@/design-system/Container'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { Card } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default async function BusinessesPage() {
  const payload = await getPayload({ config })

  const businesses = await payload.find({
    collection: 'businesses',
    where: {
      membershipStatus: {
        equals: 'active',
      },
    },
    limit: 100,
    sort: '-featured',
    depth: 1,
  })

  return (
    <Container className="py-12 md:py-16">
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Member Businesses</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Discover local businesses in Vermont&apos;s Northeast Kingdom. Our members are the heart
            of the community.
          </p>
        </div>

        {businesses.docs.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.docs.map((business) => (
              <Link
                key={business.id}
                href={`/businesses/${business.slug}`}
                className="group"
              >
                <Card className="h-full p-6 transition-all hover:shadow-lg">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                        {business.name}
                      </h3>
                      {business.category && Array.isArray(business.category) && business.category.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {business.category.map((cat) => (
                            <span
                              key={typeof cat === 'string' || typeof cat === 'number' ? cat : cat.id}
                              className="text-xs bg-muted px-2 py-1 rounded"
                            >
                              {typeof cat === 'string' || typeof cat === 'number' ? cat : cat.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {business.address && (
                      <p className="text-sm text-muted-foreground">{business.address}</p>
                    )}
                    {business.phone && (
                      <p className="text-sm text-muted-foreground">{business.phone}</p>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-muted-foreground">No businesses found.</p>
          </div>
        )}
      </div>
    </Container>
  )
}

export function generateMetadata() {
  return {
    title: 'Member Businesses | North Country Chamber of Commerce',
    description:
      "Browse local businesses in Vermont's Northeast Kingdom. Supporting the economic vitality of Newport and surrounding areas.",
  }
}
