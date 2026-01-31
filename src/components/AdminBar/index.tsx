'use client'

import type { PayloadAdminBarProps, PayloadMeUser } from '@payloadcms/admin-bar'
import type { User } from '@/payload-types'

import { cn } from '@/utilities/ui'
import { useSelectedLayoutSegments, usePathname } from 'next/navigation'
import { PayloadAdminBar } from '@payloadcms/admin-bar'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import './index.scss'

import { getClientSideURL } from '@/utilities/getURL'

const baseClass = 'admin-bar'

const collectionLabels = {
  pages: {
    plural: 'Pages',
    singular: 'Page',
  },
  posts: {
    plural: 'Posts',
    singular: 'Post',
  },
  projects: {
    plural: 'Projects',
    singular: 'Project',
  },
}

const Title: React.FC = () => <span>Dashboard</span>

export const AdminBar: React.FC<{
  adminBarProps?: PayloadAdminBarProps
}> = (props) => {
  const { adminBarProps } = props || {}
  const segments = useSelectedLayoutSegments()
  const pathname = usePathname()
  const [show, setShow] = useState(false)
  const collection = (
    collectionLabels[segments?.[1] as keyof typeof collectionLabels] ? segments[1] : 'pages'
  ) as keyof typeof collectionLabels
  const router = useRouter()

  const [user, setUser] = useState<(PayloadMeUser & Partial<User>) | null>(null)

  const onAuthChange = React.useCallback((user: PayloadMeUser) => {
    setShow(Boolean(user?.id))
    setUser(user as PayloadMeUser & Partial<User>)
  }, [])

  // For business members on portal pages, hide entirely (portal has its own header)
  if (show && user?.role === 'business_member' && pathname?.startsWith('/portal')) {
    return null
  }

  // For business members on non-portal pages, show a custom portal bar
  if (show && user?.role === 'business_member') {
    return (
      <div className={cn(baseClass, 'py-2 bg-blue-600 text-white relative z-[60]')}>
        <div className="container">
          <div className="flex items-center justify-between">
            <Link href="/portal" className="hover:underline font-medium">
              Member Portal
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm">{user.email}</span>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/api/logout" className="hover:underline text-sm">
                Logout
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(baseClass, 'py-2 bg-black text-white', {
        block: show,
        hidden: !show,
      })}
    >
      <div className="container">
        <PayloadAdminBar
          {...adminBarProps}
          className="py-2 text-white"
          classNames={{
            controls: 'font-medium text-white',
            logo: 'text-white',
            user: 'text-white',
          }}
          cmsURL={getClientSideURL()}
          collectionSlug={collection}
          collectionLabels={{
            plural: collectionLabels[collection]?.plural || 'Pages',
            singular: collectionLabels[collection]?.singular || 'Page',
          }}
          logo={<Title />}
          onAuthChange={onAuthChange}
          onPreviewExit={() => {
            fetch('/next/exit-preview').then(() => {
              router.push('/')
              router.refresh()
            })
          }}
          style={{
            backgroundColor: 'transparent',
            padding: 0,
            position: 'relative',
            zIndex: 'unset',
          }}
        />
      </div>
    </div>
  )
}
