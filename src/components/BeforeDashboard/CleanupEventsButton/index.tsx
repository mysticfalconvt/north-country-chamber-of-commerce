import React from 'react'
import Link from 'next/link'
import './index.scss'

const baseClass = 'cleanup-events-button'

export const CleanupEventsButton: React.FC = () => {
  return (
    <span className={baseClass}>
      <Link className={`${baseClass}__link`} href="/admin-tools/cleanup-events" prefetch={false}>
        Clean Up Empty Events
      </Link>
    </span>
  )
}
