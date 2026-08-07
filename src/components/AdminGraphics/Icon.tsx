import React from 'react'

import { getServerSideURL } from '@/utilities/getURL'

/**
 * Custom icon for Payload admin (favicon / small branding).
 * Replaces the default Payload icon with North Country Chamber branding.
 *
 * Payload also renders this component through Satori in its `/api/og` route,
 * which cannot resolve relative image paths, so the src must be absolute and
 * the sizing must be inline styles rather than classes.
 */
const AdminIcon: React.FC = () => {
  return (
    /* eslint-disable @next/next/no-img-element */
    <img
      alt="North Country Chamber of Commerce"
      src={`${getServerSideURL()}/north-country-chamber-logo.png`}
      className="h-8 w-8 object-contain"
      style={{ height: 32, width: 32, objectFit: 'contain' }}
    />
  )
}

export default AdminIcon
