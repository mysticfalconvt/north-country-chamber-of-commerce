import React from 'react'
import { Container } from '@/design-system/Container'
import { getPayload } from 'payload'
import config from '@payload-config'
import { BusinessDirectory } from '@/components/BusinessDirectory'
import { headers } from 'next/headers'
import { getLocaleFromPathname } from '@/utilities/getLocale'

export default async function BusinessesPage() {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const locale = getLocaleFromPathname(pathname)

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
    locale,
  })

  const categories = await payload.find({
    collection: 'categories',
    limit: 100,
    sort: 'name',
    locale,
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

  const translations = {
    en: {
      title: 'Member Businesses',
      description:
        "Discover local businesses in Vermont's Northeast Kingdom. Our members are the heart of the community.",
      noBusinesses: 'No businesses found.',
    },
    fr: {
      title: 'Entreprises membres',
      description:
        'Découvrez les entreprises locales dans le Northeast Kingdom du Vermont. Nos membres sont le cœur de la communauté.',
      noBusinesses: 'Aucune entreprise trouvée.',
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

        {sortedBusinesses.length > 0 ? (
          <BusinessDirectory
            businesses={sortedBusinesses}
            categories={categories.docs}
            membershipTiers={membershipTiers.tiers || []}
            locale={locale}
          />
        ) : (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-muted-foreground">{t.noBusinesses}</p>
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
      title: 'Member Businesses | North Country Chamber of Commerce',
      description:
        "Browse local businesses in Vermont's Northeast Kingdom. Supporting the economic vitality of Newport and surrounding areas.",
    },
    fr: {
      title: 'Entreprises membres | Chambre de commerce du North Country',
      description:
        'Parcourez les entreprises locales dans le Northeast Kingdom du Vermont. Soutenir la vitalité économique de Newport et des environs.',
    },
  }

  return metadata[locale]
}
