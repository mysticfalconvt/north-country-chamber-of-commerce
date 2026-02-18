import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * Custom logout endpoint that redirects to home page instead of login page
 */
export async function POST(_req: NextRequest) {
  const cookieStore = await cookies()

  // Clear the Payload auth cookie
  cookieStore.delete('payload-token')

  // Use public site URL so redirect works behind proxies/Docker (req.url can be 0.0.0.0)
  const baseUrl = getServerSideURL()
  return NextResponse.redirect(new URL('/', baseUrl))
}

export async function GET(req: NextRequest) {
  // Also handle GET requests for logout links
  return POST(req)
}
