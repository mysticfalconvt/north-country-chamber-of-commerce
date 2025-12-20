'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'

interface LanguageSwitcherProps {
  className?: string
  variant?: 'default' | 'mobile'
}

export function LanguageSwitcher({ className, variant = 'default' }: LanguageSwitcherProps) {
  const pathname = usePathname()

  // Determine current locale and target locale
  const isEnglish = !pathname.startsWith('/fr')
  const targetLabel = isEnglish ? 'FR' : 'EN'

  // Build the target path
  const targetPath = isEnglish
    ? `/fr${pathname === '/' ? '' : pathname}`
    : pathname.replace(/^\/fr/, '') || '/'

  if (variant === 'mobile') {
    return (
      <Link
        href={targetPath}
        className={cn(
          'flex items-center gap-2 px-4 py-3 text-base font-medium text-foreground hover:bg-accent/50 transition-colors rounded-md',
          className,
        )}
      >
        <Globe className="h-5 w-5" />
        <span>{targetLabel === 'FR' ? 'Français' : 'English'}</span>
      </Link>
    )
  }

  return (
    <Button variant="ghost" size="sm" asChild className={className}>
      <Link href={targetPath} className="flex items-center gap-1.5">
        <Globe className="h-4 w-4" />
        <span className="text-sm font-medium">{targetLabel}</span>
      </Link>
    </Button>
  )
}
