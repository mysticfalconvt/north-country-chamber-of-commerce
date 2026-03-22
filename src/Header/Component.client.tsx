'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

import type { Header } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'
import { MobileNav } from './MobileNav'
import { Container } from '@/design-system/Container'

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  const pathname = usePathname()

  // Don't render the main header on portal pages (they have their own header)
  if (pathname?.startsWith('/portal')) {
    return null
  }

  return (
    <header
      className="sticky top-0 z-50 w-full border-b bg-header backdrop-blur overflow-visible"
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
