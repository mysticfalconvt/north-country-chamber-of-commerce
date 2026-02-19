import React from 'react'
import { Container } from '@/design-system/Container'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { formatDateTime } from '@/utilities/formatDateTime'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import RichText from '@/components/RichText'
import { Button } from '@/components/ui/button'
import { getOptimizedImageUrl } from '@/utilities/getMediaUrl'
import type { Media } from '@/payload-types'
import { headers } from 'next/headers'
import { getLocaleFromPathname, addLocaleToPathname } from '@/utilities/getLocale'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function NewsDetailPage(props: PageProps) {
  const params = await props.params
  const { slug } = params

  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const locale = getLocaleFromPathname(pathname)

  const payload = await getPayload({ config })

  const newsItems = await payload.find({
    collection: 'news',
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
    depth: 2,
    locale,
  })

  const newsItem = newsItems.docs[0]

  if (!newsItem || newsItem._status !== 'published') {
    notFound()
  }

  const image = newsItem.image as Media | null
  const imageUrl = getOptimizedImageUrl(image, 'large')

  // Get author name if available
  const authorName =
    newsItem.author && typeof newsItem.author === 'object' && 'name' in newsItem.author
      ? newsItem.author.name
      : null

  const translations = {
    en: {
      featured: 'Featured',
      backToAllNews: 'Back to all news',
      by: 'By',
    },
    fr: {
      featured: 'En vedette',
      backToAllNews: 'Retour aux nouvelles',
      by: 'Par',
    },
  }

  const t = translations[locale]

  return (
    <Container className="py-12 md:py-16">
      <div className="max-w-4xl mx-auto">
        <Link
          href={addLocaleToPathname('/news', locale)}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          ← {t.backToAllNews}
        </Link>

        <article className="space-y-8">
          {/* Header */}
          <div className="space-y-4">
            {newsItem.featured && (
              <span className="inline-block text-sm font-medium text-primary">★ {t.featured}</span>
            )}
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{newsItem.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground">
              {newsItem.publishDate && (
                <p className="text-lg">{formatDateTime(newsItem.publishDate)}</p>
              )}
              {authorName && (
                <p className="text-lg">
                  {t.by} {authorName}
                </p>
              )}
            </div>
          </div>

          {/* Featured Image */}
          {imageUrl && (
            <div className="relative h-[400px] w-full overflow-hidden rounded-lg">
              <Image
                src={imageUrl}
                alt={image?.alt || newsItem.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Content */}
          {newsItem.content && (
            <div className="prose dark:prose-invert max-w-none">
              <RichText data={newsItem.content} enableGutter={false} />
            </div>
          )}

          {/* Back Button */}
          <div className="pt-8 border-t">
            <Link href={addLocaleToPathname('/news', locale)}>
              <Button variant="outline">← {t.backToAllNews}</Button>
            </Link>
          </div>
        </article>
      </div>
    </Container>
  )
}

export async function generateMetadata(props: PageProps) {
  const params = await props.params
  const { slug } = params

  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const locale = getLocaleFromPathname(pathname)

  const payload = await getPayload({ config })

  const newsItems = await payload.find({
    collection: 'news',
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
    locale,
  })

  const newsItem = newsItems.docs[0]

  if (!newsItem) {
    return {
      title: 'News Not Found',
    }
  }

  return {
    title: `${newsItem.title} | North Country Chamber of Commerce`,
    description: newsItem.content
      ? `${JSON.stringify(newsItem.content).substring(0, 160)}...`
      : undefined,
  }
}
