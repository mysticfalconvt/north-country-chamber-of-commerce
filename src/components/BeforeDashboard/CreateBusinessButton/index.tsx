import React from 'react'
import Link from 'next/link'
import './index.scss'

const baseClass = 'create-business-button'

export const CreateBusinessButton: React.FC = () => {
  return (
    <span className={baseClass}>
      <Link className={`${baseClass}__link`} href="/admin-tools/create-business" prefetch={false}>
        Create Business On Behalf of New Member
      </Link>
    </span>
  )
}
