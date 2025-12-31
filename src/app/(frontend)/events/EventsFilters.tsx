'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Filter, X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { addLocaleToPathname } from '@/utilities/getLocale'

const categories = [
  { value: 'all', labelEn: 'All Categories', labelFr: 'Toutes les catégories' },
  { value: 'chamber', labelEn: 'Chamber Event', labelFr: 'Événement de la chambre' },
  { value: 'community', labelEn: 'Community Event', labelFr: 'Événement communautaire' },
  { value: 'networking', labelEn: 'Networking', labelFr: 'Réseautage' },
  { value: 'workshop', labelEn: 'Workshop', labelFr: 'Atelier' },
  { value: 'festival', labelEn: 'Festival', labelFr: 'Festival' },
  { value: 'fundraiser', labelEn: 'Fundraiser', labelFr: 'Collecte de fonds' },
  { value: 'social', labelEn: 'Social', labelFr: 'Social' },
]

export default function EventsFilters({
  selectedCategory,
  showPast,
  locale = 'en',
}: {
  selectedCategory?: string
  showPast: boolean
  locale?: 'en' | 'fr'
}) {
  const router = useRouter()
  const pathname = usePathname()

  const translations = {
    en: {
      filterBy: 'Filter by',
      showPast: 'Show Past Events',
      hidePast: 'Hide Past Events',
      clearFilters: 'Clear Filters',
    },
    fr: {
      filterBy: 'Filtrer par',
      showPast: 'Afficher les événements passés',
      hidePast: 'Masquer les événements passés',
      clearFilters: 'Effacer les filtres',
    },
  }

  const t = translations[locale]

  const updateFilters = (newCategory?: string, newShowPast?: boolean) => {
    const params = new URLSearchParams()

    const category = newCategory !== undefined ? newCategory : selectedCategory
    const past = newShowPast !== undefined ? newShowPast : showPast

    if (category && category !== 'all') {
      params.set('category', category)
    }
    if (past) {
      params.set('showPast', 'true')
    }

    const queryString = params.toString()
    router.push(`${pathname}${queryString ? `?${queryString}` : ''}`)
  }

  const clearFilters = () => {
    router.push(pathname)
  }

  const hasActiveFilters = selectedCategory || showPast

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">{t.filterBy}:</span>
      </div>

      <Select
        value={selectedCategory || 'all'}
        onValueChange={(value) => updateFilters(value === 'all' ? undefined : value, undefined)}
      >
        <SelectTrigger className="w-[200px] bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat.value} value={cat.value}>
              {locale === 'fr' ? cat.labelFr : cat.labelEn}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant={showPast ? 'default' : 'outline'}
        size="sm"
        onClick={() => updateFilters(undefined, !showPast)}
      >
        {showPast ? t.hidePast : t.showPast}
      </Button>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
          <X className="h-4 w-4" />
          {t.clearFilters}
        </Button>
      )}
    </div>
  )
}
