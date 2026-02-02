'use client'

import React from 'react'
import { LogOutIcon, useTranslation } from '@payloadcms/ui'

const baseClass = 'nav'

/**
 * Custom logout button that redirects to the site home page instead of the admin login page.
 * Links to /api/logout which clears the auth cookie and redirects to /.
 */
const LogoutButton: React.FC<{ tabIndex?: number }> = ({ tabIndex = 0 }) => {
  const { t } = useTranslation()

  return (
    <a
      aria-label={t('authentication:logOut')}
      className={`${baseClass}__log-out`}
      href="/api/logout"
      tabIndex={tabIndex}
      title={t('authentication:logOut')}
    >
      <LogOutIcon />
    </a>
  )
}

export default LogoutButton
