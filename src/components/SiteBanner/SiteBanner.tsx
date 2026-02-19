'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/utilities/ui'
import RichText from '@/components/RichText'
import { X } from 'lucide-react'

interface BannerData {
  id: string
  message: any
  style: 'info' | 'warning' | 'error' | 'success'
  startDate: string
  endDate: string
  enabled: boolean
  dismissible: boolean
}

export function SiteBanner() {
  const [banners, setBanners] = useState<BannerData[]>([])
  const [dismissedBanners, setDismissedBanners] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    // Load dismissed banners from localStorage
    const dismissed = localStorage.getItem('dismissedBanners')
    if (dismissed) {
      try {
        setDismissedBanners(JSON.parse(dismissed))
      } catch (e) {
        console.error('Failed to parse dismissed banners:', e)
      }
    }

    // Fetch banners
    const fetchBanners = async () => {
      try {
        const response = await fetch('/api/globals/banners')
        const data = await response.json()

        if (data.activeBanners && Array.isArray(data.activeBanners)) {
          const now = new Date()

          // Filter active banners
          const active = data.activeBanners.filter((banner: any, index: number) => {
            if (!banner.enabled) return false

            const startDate = new Date(banner.startDate)
            const endDate = new Date(banner.endDate)

            // Check date range
            if (now < startDate || now > endDate) return false

            return true
          })

          // Map to include unique IDs
          const bannersWithIds = active.map((banner: any, index: number) => ({
            ...banner,
            id: `${banner.startDate}-${index}`, // Create unique ID from date and index
          }))

          setBanners(bannersWithIds)
        }
      } catch (error) {
        console.error('Failed to fetch banners:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBanners()
  }, [])

  const dismissBanner = (bannerId: string) => {
    const newDismissed = [...dismissedBanners, bannerId]
    setDismissedBanners(newDismissed)
    localStorage.setItem('dismissedBanners', JSON.stringify(newDismissed))
  }

  // Filter out dismissed banners
  const visibleBanners = banners.filter((banner) => !dismissedBanners.includes(banner.id))

  // Don't render on portal pages (they have their own layout)
  // This check must be after all hooks to follow React rules
  if (pathname?.startsWith('/portal') || loading || visibleBanners.length === 0) {
    return null
  }

  return (
    <div className="w-full space-y-2">
      {visibleBanners.map((banner, index) => (
        <div
          key={banner.id}
          className={cn('animate-in slide-in-from-top duration-300', 'border-b last:border-b-0')}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div
            className={cn('py-3 px-6 flex items-center justify-between gap-4', {
              'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800':
                banner.style === 'info',
              'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800':
                banner.style === 'error',
              'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800':
                banner.style === 'success',
              'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800':
                banner.style === 'warning',
            })}
          >
            <div className="flex-1 text-sm text-center">
              <RichText data={banner.message} enableGutter={false} enableProse={false} />
            </div>

            {banner.dismissible && (
              <button
                onClick={() => dismissBanner(banner.id)}
                className="shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
