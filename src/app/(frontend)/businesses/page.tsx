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
      and: [
        {
          membershipStatus: {
            equals: 'active',
          },
        },
        {
          approvalStatus: {
            equals: 'approved',
          },
        },
      ],
    },
    limit: 100,
    depth: 1,
  })

  const categories = await payload.find({
    collection: 'categories',
    limit: 100,
    sort: 'name',
  })

  // Fetch membership tiers for badge display
  const membershipTiers = await payload.findGlobal({
    slug: 'membershipTiers',
  })

  // Sort businesses by tier (higher tiers first) then alphabetically
  const sortedBusinesses = [...businesses.docs].sort((a, b) => {
    const tierA = membershipTiers.tiers?.find((t: any) => t.slug === a.membershipTier) as any
    const tierB = membershipTiers.tiers?.find((t: any) => t.slug === b.membershipTier) as any

    const sortOrderA = (tierA?.sortOrder as number | undefined) || 999
    const sortOrderB = (tierB?.sortOrder as number | undefined) || 999

    // Sort by tier first (lower sortOrder = higher tier = comes first)
    if (sortOrderA !== sortOrderB) {
      return sortOrderA - sortOrderB
    }

    // Then sort alphabetically by name
    return a.name.localeCompare(b.name)
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

        {sortedBusinesses.length > 0 ? (
          <BusinessDirectory
            businesses={sortedBusinesses}
            categories={categories.docs}
            membershipTiers={membershipTiers.tiers || []}
          />
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
