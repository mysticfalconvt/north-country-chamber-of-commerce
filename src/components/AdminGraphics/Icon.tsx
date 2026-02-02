import React from 'react'

/**
 * Custom icon for Payload admin (favicon / small branding).
 * Replaces the default Payload icon with North Country Chamber branding.
 */
const AdminIcon: React.FC = () => {
  return (
    /* eslint-disable @next/next/no-img-element */
    <img
      alt="North Country Chamber of Commerce"
      src="/north-country-chamber-logo.png"
      className="h-8 w-8 object-contain"
    />
  )
}

export default AdminIcon
