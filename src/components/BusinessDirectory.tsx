'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { BusinessMap } from './BusinessMap'
import type { Business, Category } from '@/payload-types'
import { MapIcon, Grid3x3Icon, ListIcon, Award, Medal, Crown } from 'lucide-react'

type ViewMode = 'grid' | 'list' | 'map'

interface MembershipTier {
  name: string
  slug: string
  displayBadge?: boolean | null
  sortOrder?: number | null
  annualPrice?: number | null
}

interface BusinessDirectoryProps {
  businesses: Business[]
  categories: Category[]
  membershipTiers: MembershipTier[]
}

export function BusinessDirectory({ businesses, categories, membershipTiers }: BusinessDirectoryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Filter and sort businesses
  const filteredBusinesses = useMemo(() => {
    let filtered = [...businesses]

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((b) => {
        if (!b.category || !Array.isArray(b.category)) return false
        return b.category.some((cat) => {
          const catId = typeof cat === 'object' && cat !== null ? cat.id : cat
          return selectedCategories.includes(String(catId))
        })
      })
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          (b.description &&
            typeof b.description === 'object' &&
            JSON.stringify(b.description).toLowerCase().includes(query)),
      )
    }

    // Sort by tier (higher tiers first) then alphabetically by name
    filtered.sort((a, b) => {
      const tierA = membershipTiers.find((t) => t.slug === a.membershipTier)
      const tierB = membershipTiers.find((t) => t.slug === b.membershipTier)
      const sortOrderA = tierA?.sortOrder || 999
      const sortOrderB = tierB?.sortOrder || 999

      if (sortOrderA !== sortOrderB) {
        return sortOrderA - sortOrderB
      }
      return a.name.localeCompare(b.name)
    })

    return filtered
  }, [businesses, selectedCategories, searchQuery, membershipTiers])

  // Map locations
  const mapLocations = useMemo(() => {
    return filteredBusinesses
      .filter((b) => b.coordinates?.latitude && b.coordinates?.longitude)
      .map((b) => ({
        id: String(b.id),
        name: b.name,
        latitude: b.coordinates!.latitude!,
        longitude: b.coordinates!.longitude!,
        membershipTier: (b.membershipTier as 'basic' | 'featured' | 'premium') || 'basic',
        slug: b.slug!,
        phone: b.phone || undefined,
      }))
  }, [filteredBusinesses])

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  // Get tier badge display info
  const getTierBadge = (tierSlug: string | undefined) => {
    if (!tierSlug) return null

    const tier = membershipTiers.find((t) => t.slug === tierSlug)
    if (!tier || !tier.displayBadge) return null

    switch (tierSlug) {
      case 'platinum':
        return { icon: Crown, label: 'Platinum Member', color: 'text-slate-400' }
      case 'gold':
        return { icon: Award, label: 'Gold Member', color: 'text-yellow-500' }
      case 'silver':
        return { icon: Medal, label: 'Silver Member', color: 'text-slate-300' }
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="space-y-4">
        {/* Search */}
        <input
          type="text"
          placeholder="Search businesses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg bg-background text-foreground"
        />

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            aria-label="Grid view"
          >
            <Grid3x3Icon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            aria-label="List view"
          >
            <ListIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`p-2 rounded ${viewMode === 'map' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            aria-label="Map view"
          >
            <MapIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Category Filters */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => toggleCategory(String(category.id))}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategories.includes(String(category.id))
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          Showing {filteredBusinesses.length} of {businesses.length} businesses
        </p>
      </div>

      {/* Content */}
      {viewMode === 'map' ? (
        <div className="w-full h-[600px] rounded-lg overflow-hidden">
          <BusinessMap
            businesses={mapLocations}
            onBusinessClick={(id) => {
              const business = businesses.find((b) => String(b.id) === id)
              if (business?.slug) {
                window.location.href = `/businesses/${business.slug}`
              }
            }}
          />
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid' ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-4'
          }
        >
          {filteredBusinesses.map((business) => (
            <Link
              key={business.id}
              href={`/businesses/${business.slug}`}
              className={viewMode === 'grid' ? 'group' : 'group'}
            >
              <Card
                className={`h-full p-6 transition-all hover:shadow-lg ${viewMode === 'list' ? 'flex gap-4' : ''}`}
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      {business.logo && typeof business.logo === 'object' && business.logo.url && (
                        <img
                          src={business.logo.url}
                          alt=""
                          className="w-10 h-10 object-contain rounded flex-shrink-0"
                        />
                      )}
                      <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                        {business.name}
                      </h3>
                      {business.featured && (
                        <span className="text-amber-500 text-sm">★ Featured</span>
                      )}
                      {(() => {
                        const badge = getTierBadge(business.membershipTier ?? undefined)
                        if (!badge) return null
                        const Icon = badge.icon
                        return (
                          <span
                            className={`flex items-center gap-1 text-xs ${badge.color}`}
                            title={badge.label}
                          >
                            <Icon className="h-4 w-4" />
                            {badge.label.split(' ')[0]}
                          </span>
                        )
                      })()}
                    </div>
                    {business.category &&
                      Array.isArray(business.category) &&
                      business.category.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {business.category.map((cat) => (
                            <span
                              key={
                                typeof cat === 'string' || typeof cat === 'number' ? cat : cat.id
                              }
                              className="text-xs bg-muted px-2 py-1 rounded"
                            >
                              {typeof cat === 'string' || typeof cat === 'number' ? cat : cat.name}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>
                  {business.address && (
                    <p className="text-sm text-muted-foreground">
                      {business.address}
                      {business.city && `, ${business.city}`}
                      {business.state && `, ${business.state}`}
                    </p>
                  )}
                  {business.phone && (
                    <p className="text-sm text-muted-foreground">{business.phone}</p>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {filteredBusinesses.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">No businesses found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}
