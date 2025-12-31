import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Custom logout endpoint that redirects to home page instead of login page
 */
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()

  // Clear the Payload auth cookie
  cookieStore.delete('payload-token')

  // Redirect to home page
  return NextResponse.redirect(new URL('/', req.url))
}

export async function GET(req: NextRequest) {
  // Also handle GET requests for logout links
  return POST(req)
}
