'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Header } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'
import { MobileNav } from './MobileNav'
import { Container } from '@/design-system/Container'

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  // Don't render the main header on portal pages (they have their own header)
  if (pathname?.startsWith('/portal')) {
    return null
  }

  return (
    <header
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-visible"
      {...(theme ? { 'data-theme': theme } : {})}
    >
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Logo
              loading="eager"
              priority="high"
              className="h-20 md:h-28 w-auto mt-2 md:mt-3 -mb-8 md:-mb-[3.25rem] z-50 relative [filter:drop-shadow(0_3px_4px_rgba(0,0,0,0.4))_drop-shadow(0_3px_6px_rgba(255,255,255,0.3))]"
            />
          </Link>
          <div className="flex items-center gap-4">
            <HeaderNav data={data} />
            <MobileNav data={data} />
          </div>
        </div>
      </Container>
    </header>
  )
}
