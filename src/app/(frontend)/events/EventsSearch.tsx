'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect, useCallback, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'

interface EventsSearchProps {
  showPast: boolean
  locale?: 'en' | 'fr'
  initialQuery?: string
}

export default function EventsSearch({
  showPast,
  locale = 'en',
  initialQuery = '',
}: EventsSearchProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [searchQuery, setSearchQuery] = useState(initialQuery)

  const translations = {
    en: {
      searchPlaceholder: 'Search events...',
      showPast: 'Show Past Events',
      hidePast: 'Hide Past Events',
      clearSearch: 'Clear search',
    },
    fr: {
      searchPlaceholder: 'Rechercher des événements...',
      showPast: 'Afficher les événements passés',
      hidePast: 'Masquer les événements passés',
      clearSearch: 'Effacer la recherche',
    },
  }

  const t = translations[locale]

  const updateURL = useCallback(
    (query: string, past: boolean) => {
      const params = new URLSearchParams()
      if (query.trim()) params.set('q', query.trim())
      if (past) params.set('showPast', 'true')
      const queryString = params.toString()
      startTransition(() => {
        router.push(`${pathname}${queryString ? `?${queryString}` : ''}`)
      })
    },
    [router, pathname],
  )

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== initialQuery) {
        updateURL(searchQuery, showPast)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, showPast, initialQuery, updateURL])

  const togglePastEvents = () => {
    updateURL(searchQuery, !showPast)
  }

  const clearSearch = () => {
    setSearchQuery('')
    updateURL('', showPast)
  }

  const hasActiveFilters = searchQuery || showPast

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex-1 min-w-[200px] relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={t.clearSearch}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Button
        variant={showPast ? 'default' : 'outline'}
        size="sm"
        onClick={togglePastEvents}
        disabled={isPending}
      >
        {showPast ? t.hidePast : t.showPast}
      </Button>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearchQuery('')
            updateURL('', false)
          }}
          className="gap-1"
          disabled={isPending}
        >
          <X className="h-4 w-4" />
          {locale === 'fr' ? 'Effacer' : 'Clear'}
        </Button>
      )}
    </div>
  )
}
