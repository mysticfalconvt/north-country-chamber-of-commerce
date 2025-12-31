'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@payloadcms/ui'

/**
 * Redirects users after login based on their role:
 * - admin and chamber_staff -> /admin (default admin panel)
 * - business_member -> /portal (member portal)
 */
export default function AfterLogin() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      // Redirect business members to the portal
      if (user.role === 'business_member') {
        router.push('/portal')
      }
      // Admin and chamber_staff stay in /admin (default behavior)
    }
  }, [user, router])

  return null
}
