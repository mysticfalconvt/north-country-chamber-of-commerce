import React from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { Container } from '@/design-system/Container'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Check } from 'lucide-react'
import type { MembershipTier } from '@/payload-types'
import { serializeLexical } from '@/utilities/serializeLexical'

export default async function JoinPage() {
  const payload = await getPayload({ config })

  const membershipTiersData = (await payload.findGlobal({
    slug: 'membershipTiers',
  })) as MembershipTier

  const tiers = membershipTiersData?.tiers || []
  const activeTiers = tiers.filter((tier) => tier.active)

  return (
    <div className="min-h-screen py-16">
      <Container>
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Join the North Country Chamber</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Become a member and gain access to exclusive benefits, networking opportunities, and
            resources to help your business thrive in Vermont&apos;s Northeast Kingdom.
          </p>
        </div>

        {/* Membership Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {activeTiers.map((tier: any, index: number) => {
            const isFeatured = tier.slug === 'featured'

            return (
              <div
                key={tier.slug}
                className={`relative rounded-lg border-2 p-8 flex flex-col ${
                  isFeatured
                    ? 'border-primary shadow-lg scale-105'
                    : 'border-border hover:border-primary/50'
                } transition-all`}
              >
                {isFeatured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${tier.annualPrice}</span>
                    <span className="text-muted-foreground">/year</span>
                  </div>
                </div>

                {/* Description */}
                {tier.description && (
                  <div className="mb-6 text-sm text-muted-foreground prose prose-sm max-w-none">
                    {serializeLexical(tier.description)}
                  </div>
                )}

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-grow">
                  {tier.features?.map((feature: any, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature.feature}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild className="w-full" variant={isFeatured ? 'default' : 'outline'}>
                  <Link href={`/join/apply?tier=${tier.slug}`}>Get Started</Link>
                </Button>
              </div>
            )
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Why Join?</h2>
          <p className="text-muted-foreground mb-6">
            The North Country Chamber of Commerce is dedicated to supporting local businesses
            through advocacy, networking, and promotion. Our members benefit from increased
            visibility, valuable connections, and a strong voice in the community.
          </p>
          <p className="text-sm text-muted-foreground">
            Have questions?{' '}
            <Link href="/contact" className="underline hover:text-foreground">
              Contact us
            </Link>{' '}
            to learn more.
          </p>
        </div>
      </Container>
    </div>
  )
}
