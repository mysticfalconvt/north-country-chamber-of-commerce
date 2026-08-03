import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/utilities/auth'

// Deliberately throws so we can confirm server-side errors reach Bugsink via the
// onRequestError hook in src/instrumentation.ts. Admin-only.
export async function POST() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  throw new Error('Bugsink test: uncaught server-side exception')
}
