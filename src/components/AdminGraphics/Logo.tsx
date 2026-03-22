import Link from 'next/link'
import React from 'react'

/**
 * Custom logo for Payload admin (login page and sidebar).
 * Replaces the default Payload logo with North Country Chamber branding.
 */
const AdminLogo: React.FC = () => {
  return (
    /* eslint-disable @next/next/no-img-element */
    <Link href="/">
      <img
        alt="North Country Chamber of Commerce"
        src="/north-country-chamber-logo.png"
        className="h-10 w-auto object-contain"
      />
    </Link>
  )
}

export default AdminLogo
