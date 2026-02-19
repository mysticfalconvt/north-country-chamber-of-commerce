'use client'

import { useCallback, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'

interface BenefitsSearchProps {
  locale: 'en' | 'fr'
  initialQuery?: string
}

export default function BenefitsSearch({ locale, initialQuery = '' }: BenefitsSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery)

  const translations = {
    en: {
      searchPlaceholder: 'Search benefits...',
      clearSearch: 'Clear search',
    },
    fr: {
      searchPlaceholder: 'Rechercher des avantages...',
      clearSearch: 'Effacer la recherche',
    },
  }

  const t = translations[locale]

  const updateURL = useCallback(
    (newQuery: string) => {
      const params = new URLSearchParams(searchParams.toString())

      if (newQuery) {
        params.set('q', newQuery)
      } else {
        params.delete('q')
      }

      const queryString = params.toString()
      router.push(queryString ? `?${queryString}` : '/benefits', { scroll: false })
    },
    [router, searchParams],
  )

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateURL(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, updateURL])

  const clearSearch = () => {
    setQuery('')
    router.push('/benefits', { scroll: false })
  }

  const hasSearch = query.length > 0

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Clear Search Button */}
      {hasSearch && (
        <button
          onClick={clearSearch}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
          {t.clearSearch}
        </button>
      )}
    </div>
  )
}
