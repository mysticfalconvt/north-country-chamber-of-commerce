import type { News, ArchiveBlock as ArchiveBlockProps } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import RichText from '@/components/RichText'

import { CollectionArchive } from '@/components/CollectionArchive'

export const ArchiveBlock: React.FC<
  ArchiveBlockProps & {
    id?: string
  }
> = async (props) => {
  const { id, introContent, limit: limitFromProps, populateBy, selectedDocs } = props

  const limit = limitFromProps || 3

  let newsItems: News[] = []

  if (populateBy === 'collection') {
    const payload = await getPayload({ config: configPromise })

    const fetchedNews = await payload.find({
      collection: 'news',
      depth: 1,
      limit,
      where: {
        _status: {
          equals: 'published',
        },
      },
      sort: '-publishDate',
    })

    newsItems = fetchedNews.docs
  } else {
    if (selectedDocs?.length) {
      const filteredSelectedNews = selectedDocs.map((item) => {
        if (typeof item.value === 'object') return item.value
      }) as News[]

      newsItems = filteredSelectedNews
    }
  }

  return (
    <div className="my-16" id={`block-${id}`}>
      {introContent && (
        <div className="container mb-16">
          <RichText className="ms-0 max-w-[48rem]" data={introContent} enableGutter={false} />
        </div>
      )}
      <CollectionArchive posts={newsItems} />
    </div>
  )
}
