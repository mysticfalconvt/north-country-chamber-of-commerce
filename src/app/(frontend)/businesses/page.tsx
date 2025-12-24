import React from 'react'
import { Container } from '@/design-system/Container'
import { getPayload } from 'payload'
import config from '@payload-config'
import { BusinessDirectory } from '@/components/BusinessDirectory'

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

  const categories = await payload.find({
    collection: 'categories',
    limit: 100,
    sort: 'name',
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
          <BusinessDirectory businesses={businesses.docs} categories={categories.docs} />
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
