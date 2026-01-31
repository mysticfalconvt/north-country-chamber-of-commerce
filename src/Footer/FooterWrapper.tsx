'use client'

import { usePathname } from 'next/navigation'

export function FooterWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Don't render footer on portal pages (they have their own layout)
  if (pathname?.startsWith('/portal')) {
    return null
  }

  return <>{children}</>
}
