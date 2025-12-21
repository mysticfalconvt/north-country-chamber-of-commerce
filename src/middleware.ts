import { NextRequest, NextResponse } from 'next/server'

const locales = ['en', 'fr']
const defaultLocale = 'en'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip middleware for:
  // - API routes
  // - Payload admin routes
  // - Static files (_next, images, etc.)
  // - Favicon, robots.txt, etc.
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/next') ||
    pathname.includes('.') // files with extensions
  ) {
    return NextResponse.next()
  }

  // Check if pathname starts with /fr
  const isFrenchRoute = pathname.startsWith('/fr')

  // Extract the locale from the pathname
  const locale = isFrenchRoute ? 'fr' : 'en'

  // Create response
  const response = NextResponse.next()

  // Add locale and pathname to headers so we can access it in server components
  response.headers.set('x-locale', locale)
  response.headers.set('x-pathname', pathname)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - admin (Payload admin)
     * - _next (Next.js internals)
     * - Static files (with extensions)
     */
    '/((?!api|admin|_next|.*\\.).*)',
  ],
}
