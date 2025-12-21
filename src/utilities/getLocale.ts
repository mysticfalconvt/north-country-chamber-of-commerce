import { headers } from 'next/headers'

export type Locale = 'en' | 'fr'

/**
 * Extract locale from the current request
 * Checks URL pathname for /fr prefix
 */
export async function getLocale(): Promise<Locale> {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''

  if (pathname.startsWith('/fr')) {
    return 'fr'
  }

  return 'en'
}

/**
 * Get locale from pathname string
 */
export function getLocaleFromPathname(pathname: string): Locale {
  if (pathname.startsWith('/fr')) {
    return 'fr'
  }
  return 'en'
}

/**
 * Remove locale prefix from pathname
 */
export function removeLocaleFromPathname(pathname: string): string {
  return pathname.replace(/^\/fr/, '') || '/'
}

/**
 * Add locale prefix to pathname
 */
export function addLocaleToPathname(pathname: string, locale: Locale): string {
  if (locale === 'fr') {
    return `/fr${pathname}`
  }
  return pathname
}

/**
 * Toggle between locales for a given pathname
 */
export function toggleLocale(pathname: string): string {
  const currentLocale = getLocaleFromPathname(pathname)
  const cleanPathname = removeLocaleFromPathname(pathname)

  if (currentLocale === 'en') {
    return `/fr${cleanPathname}`
  }
  return cleanPathname
}
