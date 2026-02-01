'use client'
import { cn } from '@/utilities/ui'
import useClickableCard from '@/utilities/useClickableCard'
import Link from 'next/link'
import React from 'react'

import type { News } from '@/payload-types'

import { Media } from '@/components/Media'

export type CardNewsData = Pick<News, 'slug' | 'title' | 'image' | 'publishDate' | 'featured'>

export const Card: React.FC<{
  alignItems?: 'center'
  className?: string
  doc?: CardNewsData
  relationTo?: 'news'
  title?: string
}> = (props) => {
  const { card, link } = useClickableCard({})
  const { className, doc, relationTo = 'news', title: titleFromProps } = props

  const { slug, image, title, publishDate, featured } = doc || {}
  const titleToUse = titleFromProps || title
  const href = `/${relationTo}/${slug}`

  return (
    <article
      className={cn(
        'border border-border rounded-lg overflow-hidden bg-card hover:cursor-pointer',
        className,
      )}
      ref={card.ref}
    >
      <div className="relative w-full aspect-video">
        {!image && <div className="flex items-center justify-center h-full bg-muted text-muted-foreground">No image</div>}
        {image && typeof image !== 'string' && <Media resource={image} size="33vw" />}
      </div>
      <div className="p-4">
        {featured && (
          <span className="inline-block text-xs font-medium text-primary mb-2">★ Featured</span>
        )}
        {titleToUse && (
          <div className="prose">
            <h3>
              <Link className="not-prose" href={href} ref={link.ref}>
                {titleToUse}
              </Link>
            </h3>
          </div>
        )}
        {publishDate && (
          <p className="text-sm text-muted-foreground mt-2">
            {new Date(publishDate).toLocaleDateString()}
          </p>
        )}
      </div>
    </article>
  )
}
