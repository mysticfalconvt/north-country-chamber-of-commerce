import React from 'react'
import { Container } from '@/design-system/Container'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { formatDateTime } from '@/utilities/formatDateTime'
import Image from 'next/image'
import { getOptimizedImageUrl } from '@/utilities/getMediaUrl'
import { headers } from 'next/headers'
import { getLocaleFromPathname, addLocaleToPathname } from '@/utilities/getLocale'
import type { Media } from '@/payload-types'

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function NewsPage(props: PageProps) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const locale = getLocaleFromPathname(pathname)

  const searchParams = await props.searchParams
  const page = Number(searchParams.page) || 1
  const limit = 10

  const payload = await getPayload({ config })

  const newsItems = await payload.find({
    collection: 'news',
    where: {
      _status: {
        equals: 'published',
      },
    },
    limit,
    page,
    sort: '-publishDate',
    depth: 1,
    locale,
  })

  // Extract plain text excerpt from rich text content
  const getExcerpt = (content: any): string => {
    if (!content || !content.root || !content.root.children) return ''

    const extractText = (node: any): string => {
      if (node.type === 'text') return node.text || ''
      if (node.children && Array.isArray(node.children)) {
        return node.children.map(extractText).join(' ')
      }
      return ''
    }

    const text = content.root.children.map(extractText).join(' ')
    return text.length > 150 ? text.substring(0, 150) + '...' : text
  }

  const translations = {
    en: {
      title: 'News & Announcements',
      description:
        'Stay up to date with the latest news, updates, and announcements from the North Country Chamber of Commerce.',
      featured: 'Featured',
      readMore: 'Read more →',
      previous: 'Previous',
      next: 'Next',
      page: 'Page',
      of: 'of',
      noNews: 'No news yet. Check back soon!',
    },
    fr: {
      title: 'Nouvelles et annonces',
      description:
        'Restez à jour avec les dernières nouvelles, mises à jour et annonces de la Chambre de commerce du North Country.',
      featured: 'En vedette',
      readMore: 'Lire la suite →',
      previous: 'Précédent',
      next: 'Suivant',
      page: 'Page',
      of: 'sur',
      noNews: 'Aucune nouvelle pour le moment. Revenez bientôt!',
    },
  }

  const t = translations[locale]

  return (
    <Container className="py-12 md:py-16">
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{t.title}</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">{t.description}</p>
        </div>

        {newsItems.docs.length > 0 ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {newsItems.docs.map((newsItem) => {
                const image = newsItem.image as Media | null
                const imageUrl = getOptimizedImageUrl(image, 'medium')

                return (
                  <Link
                    key={newsItem.id}
                    href={addLocaleToPathname(`/news/${newsItem.slug}`, locale)}
                    className="group"
                  >
                    <Card className="h-full overflow-hidden transition-all hover:shadow-lg">
                      {imageUrl && (
                        <div className="relative h-48 w-full overflow-hidden bg-muted">
                          <Image
                            src={imageUrl}
                            alt={image?.alt || newsItem.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="p-6 space-y-3">
                        {newsItem.featured && (
                          <span className="inline-block text-xs font-medium text-primary">
                            ★ {t.featured}
                          </span>
                        )}
                        <h2 className="text-xl font-semibold group-hover:text-primary transition-colors line-clamp-2">
                          {newsItem.title}
                        </h2>
                        {newsItem.publishDate && (
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(newsItem.publishDate, locale)}
                          </p>
                        )}
                        {newsItem.content && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {getExcerpt(newsItem.content)}
                          </p>
                        )}
                        <span className="inline-flex items-center text-sm font-medium text-primary group-hover:underline">
                          {t.readMore}
                        </span>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>

            {/* Pagination */}
            {newsItems.totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-4">
                {page > 1 && (
                  <Link
                    href={addLocaleToPathname(`/news?page=${page - 1}`, locale)}
                    className="px-4 py-2 rounded-lg border bg-card hover:bg-muted transition-colors"
                  >
                    {t.previous}
                  </Link>
                )}
                <span className="px-4 py-2 rounded-lg border bg-muted">
                  {t.page} {page} {t.of} {newsItems.totalPages}
                </span>
                {page < newsItems.totalPages && (
                  <Link
                    href={addLocaleToPathname(`/news?page=${page + 1}`, locale)}
                    className="px-4 py-2 rounded-lg border bg-card hover:bg-muted transition-colors"
                  >
                    {t.next}
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-muted-foreground">{t.noNews}</p>
          </div>
        )}
      </div>
    </Container>
  )
}

export async function generateMetadata() {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const locale = getLocaleFromPathname(pathname)

  const metadata = {
    en: {
      title: 'News & Announcements | North Country Chamber of Commerce',
      description:
        "Read the latest news and announcements from the North Country Chamber of Commerce in Vermont's Northeast Kingdom.",
    },
    fr: {
      title: 'Nouvelles et annonces | Chambre de commerce du North Country',
      description:
        'Lisez les dernières nouvelles et annonces de la Chambre de commerce du North Country dans le Northeast Kingdom du Vermont.',
    },
  }

  return metadata[locale]
}
