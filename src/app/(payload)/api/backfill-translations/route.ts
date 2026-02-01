import { getPayload } from 'payload'
import config from '@payload-config'
import { APIError } from 'payload'
import {
  translateToFrench,
  translateLexicalJSON,
  isTranslationAvailable,
} from '@/utilities/translate'
import { headers } from 'next/headers'

// Configure for long-running requests
export const maxDuration = 300 // 5 minutes
export const dynamic = 'force-dynamic'

/**
 * Helper to check if a localized field in French exists
 */
async function checkFrenchField(
  payload: any,
  collection: string,
  id: string | number,
  fieldName: string,
  force: boolean,
): Promise<boolean> {
  if (force) return false // Force mode: always translate

  try {
    const frenchDoc = await payload.findByID({
      collection,
      id,
      locale: 'fr',
      depth: 0,
    })
    const fieldValue = (frenchDoc as any)[fieldName]
    if (!fieldValue) return false
    // If it's a string, it exists
    if (typeof fieldValue === 'string') return true
    // If it's an object with fr property, check if fr exists
    if (typeof fieldValue === 'object' && 'fr' in fieldValue) return !!fieldValue.fr
    // If it's an array, check if it has content
    if (Array.isArray(fieldValue)) return fieldValue.length > 0
    return !!fieldValue
  } catch (_e) {
    return false // French version doesn't exist
  }
}

/**
 * Helper to remove id fields from an object recursively
 */
function removeIds(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((item) => removeIds(item))
  }
  if (obj && typeof obj === 'object') {
    const { id: _id, ...rest } = obj
    const cleaned: any = {}
    for (const [key, value] of Object.entries(rest)) {
      cleaned[key] = removeIds(value)
    }
    return cleaned
  }
  return obj
}

/**
 * Translate a single page's layout blocks
 * When fetching with locale 'en', localized fields are returned as direct values (not { en, fr })
 * When updating with locale 'fr', we pass direct values for French
 * Note: We remove 'id' fields as Payload doesn't allow updating them
 */
async function translatePageLayout(englishLayout: any[]): Promise<any[]> {
  const translated = await Promise.all(
    englishLayout.map(async (block) => {
      const translatedBlock = { ...block }

      switch (block.blockType) {
        case 'content':
          if (block.columns && Array.isArray(block.columns)) {
            translatedBlock.columns = await Promise.all(
              block.columns.map(async (column: any) => {
                const translatedColumn = { ...column }
                if (column.richText) {
                  // richText is localized - when fetched with locale 'en', it's direct Lexical JSON
                  // Translate it to French Lexical JSON
                  translatedColumn.richText = await translateLexicalJSON(column.richText)
                }
                return translatedColumn
              }),
            )
          }
          break

        case 'cta':
          if (block.richText) {
            translatedBlock.richText = await translateLexicalJSON(block.richText)
          }

          if (block.links && Array.isArray(block.links)) {
            translatedBlock.links = await Promise.all(
              block.links.map(async (linkItem: any) => {
                // IMPORTANT: Preserve the original link structure including ID
                // Only translate the label field - keep everything else intact
                const translatedLink = {
                  ...linkItem, // Keep id and all other fields
                  link: {
                    ...linkItem.link, // Keep all link fields
                  },
                }
                if (linkItem.link?.label) {
                  // label is localized - when fetched with locale 'en', it's a direct string
                  // Translate it to French string
                  translatedLink.link.label = await translateToFrench(linkItem.link.label)
                }
                return translatedLink
              }),
            )
          }
          break

        case 'archive':
          if (block.introContent) {
            translatedBlock.introContent = await translateLexicalJSON(block.introContent)
          }
          break

        case 'formBlock':
          if (block.introContent) {
            translatedBlock.introContent = await translateLexicalJSON(block.introContent)
          }
          break

        default:
          // Unknown block type, copy as-is
          break
      }

      return translatedBlock
    }),
  )

  // Layout is a localized field - each locale has its own blocks array
  // We must remove IDs so Payload generates new unique IDs for the French locale
  // (IDs from English layout can't be reused as they'd be duplicates)
  return removeIds(translated)
}

/**
 * Stream progress updates to the client
 */
function sendProgress(controller: ReadableStreamDefaultController, message: string) {
  const data = JSON.stringify({ type: 'progress', message })
  controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`))
}

export async function POST(req: Request) {
  try {
    const payload = await getPayload({ config })
    const url = new URL(req.url)
    const force = url.searchParams.get('force') === 'true'

    // Check authentication
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Check if translation service is available
    if (!(await isTranslationAvailable())) {
      throw new APIError('Translation service is not available', 503)
    }

    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('[backfill-translations] Starting translation backfill, force:', force)
          sendProgress(controller, '🚀 Starting translation backfill...')
          sendProgress(
            controller,
            force
              ? '⚠️ Force mode enabled - will overwrite existing translations'
              : '📝 Normal mode - will skip existing translations',
          )

          const stats = {
            pages: { total: 0, translated: 0, skipped: 0 },
            events: { total: 0, translated: 0, skipped: 0 },
            news: { total: 0, translated: 0, skipped: 0 },
            businesses: { total: 0, translated: 0, skipped: 0 },
            header: { translated: false },
            footer: { translated: false },
          }

          // Translate Pages
          sendProgress(controller, '📄 Processing Pages...')
          const pages = await payload.find({
            collection: 'pages',
            limit: 1000,
            locale: 'en',
            depth: 0,
          })

          stats.pages.total = pages.totalDocs

          for (const page of pages.docs) {
            // Check if French version exists (only if not forcing)
            if (!force) {
              try {
                const frenchPage = await payload.findByID({
                  collection: 'pages',
                  id: page.id,
                  locale: 'fr',
                  depth: 0,
                })

                // Check if French title exists
                // When fetching with locale 'fr', title is a string, not a localized object
                const hasFrenchTitle = frenchPage.title && typeof frenchPage.title === 'string'

                // Check if French layout exists
                const hasFrenchLayout =
                  frenchPage.layout &&
                  Array.isArray(frenchPage.layout) &&
                  frenchPage.layout.length > 0

                if (hasFrenchTitle && hasFrenchLayout) {
                  stats.pages.skipped++
                  continue // Skip this page
                }
              } catch (_error) {
                // French page might not exist yet, continue with translation
              }
            }

            let needsUpdate = false
            const updateData: any = {}

            // Get page title - when fetched with locale 'en', title is a string
            const pageTitle =
              typeof page.title === 'string' ? page.title : (page.title as { en?: string })?.en
            if (pageTitle) {
              // Check if we need to translate title
              if (force) {
                sendProgress(controller, `  Translating page "${pageTitle}" title...`)
                updateData.title = await translateToFrench(pageTitle)
                needsUpdate = true
              } else {
                // Check if French title exists
                try {
                  const frenchPage = await payload.findByID({
                    collection: 'pages',
                    id: page.id,
                    locale: 'fr',
                    depth: 0,
                  })
                  // When fetching with locale 'fr', title is a string
                  const frenchTitle =
                    typeof frenchPage.title === 'string'
                      ? frenchPage.title
                      : (frenchPage.title as { fr?: string })?.fr
                  if (!frenchTitle) {
                    sendProgress(controller, `  Translating page "${pageTitle}" title...`)
                    updateData.title = await translateToFrench(pageTitle)
                    needsUpdate = true
                  }
                } catch (_error) {
                  // No French version, translate it
                  sendProgress(controller, `  Translating page "${pageTitle}" title...`)
                  updateData.title = await translateToFrench(pageTitle)
                  needsUpdate = true
                }
              }
            }

            // Check and translate hero
            // Hero has localized fields: richText and links[].link.label
            // When updating with locale 'fr', we need to provide the full structure
            if (page.hero) {
              let heroNeedsUpdate = false
              const heroUpdate: any = {
                type: page.hero.type, // Keep non-localized fields
                media: page.hero.media, // Keep media reference
              }

              // Check if hero richText needs translation
              if (page.hero.richText) {
                const needsRichText =
                  force ||
                  !(await checkFrenchField(payload, 'pages', page.id, 'hero.richText', force))
                if (needsRichText) {
                  sendProgress(
                    controller,
                    `  Translating page "${pageTitle || page.id}" hero richText...`,
                  )
                  heroUpdate.richText = await translateLexicalJSON(page.hero.richText)
                  heroNeedsUpdate = true
                } else {
                  // Keep existing richText if not translating
                  heroUpdate.richText = page.hero.richText
                }
              }

              // Check if hero links need translation
              if (page.hero.links && Array.isArray(page.hero.links) && page.hero.links.length > 0) {
                // Check if French links exist
                let needsLinks = force
                if (!force) {
                  try {
                    const frenchPage = await payload.findByID({
                      collection: 'pages',
                      id: page.id,
                      locale: 'fr',
                      depth: 0,
                    })
                    const hasFrenchLinks =
                      frenchPage.hero?.links &&
                      Array.isArray(frenchPage.hero.links) &&
                      frenchPage.hero.links.length > 0 &&
                      frenchPage.hero.links.every((link: any) => {
                        const label =
                          typeof link.link?.label === 'string'
                            ? link.link.label
                            : (link.link?.label as { fr?: string })?.fr
                        return !!label
                      })
                    needsLinks = !hasFrenchLinks
                  } catch (_error) {
                    needsLinks = true
                  }
                }

                if (needsLinks) {
                  sendProgress(
                    controller,
                    `  Translating page "${pageTitle || page.id}" hero links (${page.hero.links.length} links)...`,
                  )
                  heroUpdate.links = await Promise.all(
                    page.hero.links.map(async (linkItem: any, index: number) => {
                      console.log(
                        `[backfill-translations] Original link ${index + 1}:`,
                        JSON.stringify(linkItem, null, 2),
                      )

                      // IMPORTANT: Preserve the original link structure including ID
                      // Only translate the label field - keep everything else intact
                      const translatedLink: any = {
                        ...linkItem, // Keep id and all other fields
                        link: {
                          ...linkItem.link, // Keep all link fields including non-localized ones
                        },
                      }

                      // Translate the label (localized field, required)
                      // When fetching with locale 'en', label is a string
                      const label =
                        typeof linkItem.link?.label === 'string'
                          ? linkItem.link.label
                          : (linkItem.link?.label as { en?: string })?.en

                      console.log(
                        `[backfill-translations] Link ${index + 1} original label:`,
                        label,
                      )

                      if (label) {
                        const translatedLabel = await translateToFrench(label)
                        translatedLink.link.label = translatedLabel
                        console.log(
                          `[backfill-translations] Link ${index + 1} translated label:`,
                          translatedLabel,
                        )
                      } else {
                        // If no label found, use empty string (shouldn't happen but be safe)
                        console.warn(`[backfill-translations] Link ${index + 1} has no label!`)
                        translatedLink.link.label = ''
                      }

                      console.log(
                        `[backfill-translations] Link ${index + 1} final structure:`,
                        JSON.stringify(translatedLink, null, 2),
                      )

                      return translatedLink
                    }),
                  )
                  console.log(
                    `[backfill-translations] All translated links:`,
                    JSON.stringify(heroUpdate.links, null, 2),
                  )
                  heroNeedsUpdate = true
                } else {
                  // Keep existing links if not translating
                  heroUpdate.links = page.hero.links
                }
              }

              if (
                heroNeedsUpdate ||
                (page.hero.richText && !heroUpdate.richText) ||
                (page.hero.links && !heroUpdate.links)
              ) {
                // IMPORTANT: Do NOT use removeIds() on hero!
                // hero.links is NOT localized (shared array) - we need to preserve IDs
                // so Payload updates existing links instead of creating new ones.
                // Only the label field within links is localized.
                updateData.hero = heroUpdate
                needsUpdate = true
              }
            }

            // Check layout
            if (page.layout && Array.isArray(page.layout) && page.layout.length > 0) {
              // Check if French layout exists (only if not forcing)
              if (!force) {
                try {
                  const frenchPage = await payload.findByID({
                    collection: 'pages',
                    id: page.id,
                    locale: 'fr',
                    depth: 0,
                  })

                  const hasFrenchLayout =
                    frenchPage.layout &&
                    Array.isArray(frenchPage.layout) &&
                    frenchPage.layout.length > 0

                  if (hasFrenchLayout && !needsUpdate) {
                    stats.pages.skipped++
                    continue // Skip this page if we don't need to update title either
                  }
                } catch (_error) {
                  // French page might not exist yet, continue with translation
                }
              }

              sendProgress(
                controller,
                `  Translating page "${pageTitle || page.id}" layout (${page.layout.length} blocks)...`,
              )
              updateData.layout = await translatePageLayout(page.layout)
              needsUpdate = true
            }

            if (needsUpdate) {
              console.log(
                `[backfill-translations] Updating page ${page.id} with data:`,
                JSON.stringify(updateData, null, 2),
              )
              try {
                await payload.update({
                  collection: 'pages',
                  id: page.id,
                  data: updateData,
                  locale: 'fr',
                  context: { skipTranslation: true },
                })
                stats.pages.translated++
                sendProgress(controller, `  ✓ Translated page "${pageTitle || page.id}"`)
              } catch (error: any) {
                console.error(`[backfill-translations] Error updating page ${page.id}:`, error)
                console.error(
                  `[backfill-translations] Error details:`,
                  JSON.stringify(error, null, 2),
                )
                if (error.data) {
                  console.error(
                    `[backfill-translations] Validation errors:`,
                    JSON.stringify(error.data, null, 2),
                  )
                }
                throw error
              }
            } else {
              stats.pages.skipped++
            }
          }

          // Translate Events
          sendProgress(controller, '📅 Processing Events...')
          const events = await payload.find({
            collection: 'events',
            limit: 1000,
            locale: 'en',
            depth: 0,
          })

          stats.events.total = events.totalDocs

          for (const event of events.docs) {
            // When fetching with locale 'en', title is a string
            const eventTitle =
              typeof event.title === 'string' ? event.title : (event.title as { en?: string })?.en
            let needsUpdate = false
            const updateData: any = {}

            if (
              eventTitle &&
              !(await checkFrenchField(payload, 'events', event.id, 'title', force))
            ) {
              sendProgress(controller, `  Translating event "${eventTitle}" title...`)
              updateData.title = await translateToFrench(eventTitle)
              needsUpdate = true
            }

            if (
              event.description &&
              !(await checkFrenchField(payload, 'events', event.id, 'description', force))
            ) {
              sendProgress(
                controller,
                `  Translating event "${eventTitle || event.id}" description...`,
              )
              updateData.description = await translateLexicalJSON(event.description)
              needsUpdate = true
            }

            if (needsUpdate) {
              await payload.update({
                collection: 'events',
                id: event.id,
                data: updateData,
                locale: 'fr',
                context: { skipTranslation: true },
              })
              stats.events.translated++
              sendProgress(controller, `  ✓ Translated event "${eventTitle || event.id}"`)
            } else {
              stats.events.skipped++
            }
          }

          // Translate News
          sendProgress(controller, '📢 Processing News...')
          const newsItems = await payload.find({
            collection: 'news',
            limit: 1000,
            locale: 'en',
            depth: 0,
          })

          stats.news.total = newsItems.totalDocs

          for (const newsItem of newsItems.docs) {
            // When fetching with locale 'en', title is a string
            const newsTitle =
              typeof newsItem.title === 'string'
                ? newsItem.title
                : (newsItem.title as { en?: string })?.en
            let needsUpdate = false
            const updateData: any = {}

            if (
              newsTitle &&
              !(await checkFrenchField(payload, 'news', newsItem.id, 'title', force))
            ) {
              sendProgress(controller, `  Translating news item "${newsTitle}" title...`)
              updateData.title = await translateToFrench(newsTitle)
              needsUpdate = true
            }

            if (
              newsItem.content &&
              !(await checkFrenchField(payload, 'news', newsItem.id, 'content', force))
            ) {
              sendProgress(
                controller,
                `  Translating news item "${newsTitle || newsItem.id}" content...`,
              )
              updateData.content = await translateLexicalJSON(newsItem.content)
              needsUpdate = true
            }

            if (needsUpdate) {
              await payload.update({
                collection: 'news',
                id: newsItem.id,
                data: updateData,
                locale: 'fr',
                context: { skipTranslation: true },
              })
              stats.news.translated++
              sendProgress(
                controller,
                `  ✓ Translated news item "${newsTitle || newsItem.id}"`,
              )
            } else {
              stats.news.skipped++
            }
          }

          // Translate Businesses
          sendProgress(controller, '🏢 Processing Businesses...')
          const businesses = await payload.find({
            collection: 'businesses',
            limit: 1000,
            locale: 'en',
            depth: 0,
          })

          stats.businesses.total = businesses.totalDocs

          for (const business of businesses.docs) {
            let needsUpdate = false
            const updateData: any = {}

            if (
              business.description &&
              !(await checkFrenchField(payload, 'businesses', business.id, 'description', force))
            ) {
              sendProgress(
                controller,
                `  Translating business "${business.name || business.id}" description...`,
              )
              updateData.description = await translateLexicalJSON(business.description)
              needsUpdate = true
            }

            if (needsUpdate) {
              await payload.update({
                collection: 'businesses',
                id: business.id,
                data: updateData,
                locale: 'fr',
                context: { skipTranslation: true },
              })
              stats.businesses.translated++
              sendProgress(controller, `  ✓ Translated business "${business.name || business.id}"`)
            } else {
              stats.businesses.skipped++
            }
          }

          // Translate Header
          sendProgress(controller, '🔗 Processing Header...')
          try {
            const header = await payload.findGlobal({
              slug: 'header',
              locale: 'en',
              depth: 0,
            })

            if (header.navItems && Array.isArray(header.navItems) && header.navItems.length > 0) {
              // Check if French translations exist
              let needsTranslation = force
              if (!force) {
                try {
                  const frenchHeader = await payload.findGlobal({
                    slug: 'header',
                    locale: 'fr',
                    depth: 0,
                  })
                  // Check if any French labels are missing
                  needsTranslation = frenchHeader.navItems?.some((item: any) => {
                    const label = typeof item.link?.label === 'string' ? item.link.label : null
                    return !label
                  }) ?? true
                } catch {
                  needsTranslation = true
                }
              }

              if (needsTranslation) {
                sendProgress(controller, `  Translating ${header.navItems.length} header nav items...`)
                const translatedNavItems = await Promise.all(
                  header.navItems.map(async (item: any) => {
                    // IMPORTANT: Preserve the original item structure including ID
                    // Only translate the label field
                    const translatedItem = {
                      ...item,
                      link: {
                        ...item.link,
                      },
                    }
                    if (item.link?.label) {
                      const label = typeof item.link.label === 'string' ? item.link.label : item.link.label?.en
                      if (label) {
                        translatedItem.link.label = await translateToFrench(label)
                      }
                    }
                    return translatedItem
                  }),
                )

                await payload.updateGlobal({
                  slug: 'header',
                  data: { navItems: translatedNavItems },
                  locale: 'fr',
                })
                stats.header.translated = true
                sendProgress(controller, '  ✓ Translated header nav items')
              } else {
                sendProgress(controller, '  Skipped - French translations already exist')
              }
            }
          } catch (error) {
            console.error('[backfill-translations] Error translating header:', error)
            sendProgress(controller, '  ⚠️ Error translating header')
          }

          // Translate Footer
          sendProgress(controller, '🔗 Processing Footer...')
          try {
            const footer = await payload.findGlobal({
              slug: 'footer',
              locale: 'en',
              depth: 0,
            })

            let footerNeedsUpdate = false
            const footerUpdateData: any = {}

            // Check and translate navItems
            if (footer.navItems && Array.isArray(footer.navItems) && footer.navItems.length > 0) {
              let needsNavTranslation = force
              if (!force) {
                try {
                  const frenchFooter = await payload.findGlobal({
                    slug: 'footer',
                    locale: 'fr',
                    depth: 0,
                  })
                  needsNavTranslation = frenchFooter.navItems?.some((item: any) => {
                    const label = typeof item.link?.label === 'string' ? item.link.label : null
                    return !label
                  }) ?? true
                } catch {
                  needsNavTranslation = true
                }
              }

              if (needsNavTranslation) {
                sendProgress(controller, `  Translating ${footer.navItems.length} footer nav items...`)
                footerUpdateData.navItems = await Promise.all(
                  footer.navItems.map(async (item: any) => {
                    // IMPORTANT: Preserve the original item structure including ID
                    // Only translate the label field
                    const translatedItem = {
                      ...item,
                      link: {
                        ...item.link,
                      },
                    }
                    if (item.link?.label) {
                      const label = typeof item.link.label === 'string' ? item.link.label : item.link.label?.en
                      if (label) {
                        translatedItem.link.label = await translateToFrench(label)
                      }
                    }
                    return translatedItem
                  }),
                )
                footerNeedsUpdate = true
              }
            }

            // Check and translate copyright
            if (footer.copyright) {
              let needsCopyrightTranslation = force
              if (!force) {
                try {
                  const frenchFooter = await payload.findGlobal({
                    slug: 'footer',
                    locale: 'fr',
                    depth: 0,
                  })
                  const frenchCopyright = typeof frenchFooter.copyright === 'string' ? frenchFooter.copyright : null
                  needsCopyrightTranslation = !frenchCopyright
                } catch {
                  needsCopyrightTranslation = true
                }
              }

              if (needsCopyrightTranslation) {
                const copyright = typeof footer.copyright === 'string' ? footer.copyright : (footer.copyright as { en?: string })?.en
                if (copyright) {
                  sendProgress(controller, '  Translating footer copyright...')
                  footerUpdateData.copyright = await translateToFrench(copyright)
                  footerNeedsUpdate = true
                }
              }
            }

            if (footerNeedsUpdate) {
              await payload.updateGlobal({
                slug: 'footer',
                data: footerUpdateData,
                locale: 'fr',
              })
              stats.footer.translated = true
              sendProgress(controller, '  ✓ Translated footer')
            } else {
              sendProgress(controller, '  Skipped - French translations already exist')
            }
          } catch (error) {
            console.error('[backfill-translations] Error translating footer:', error)
            sendProgress(controller, '  ⚠️ Error translating footer')
          }

          // Send completion message
          const summary = `
✅ Translation backfill complete!

Summary:
- Pages: ${stats.pages.translated} translated, ${stats.pages.skipped} skipped (${stats.pages.total} total)
- Events: ${stats.events.translated} translated, ${stats.events.skipped} skipped (${stats.events.total} total)
- News: ${stats.news.translated} translated, ${stats.news.skipped} skipped (${stats.news.total} total)
- Businesses: ${stats.businesses.translated} translated, ${stats.businesses.skipped} skipped (${stats.businesses.total} total)
- Header: ${stats.header.translated ? 'translated' : 'skipped'}
- Footer: ${stats.footer.translated ? 'translated' : 'skipped'}
          `.trim()

          const completeData = JSON.stringify({ type: 'complete', message: summary })
          controller.enqueue(new TextEncoder().encode(`data: ${completeData}\n\n`))
          console.log('[backfill-translations] Translation backfill complete')
          controller.close()
        } catch (error) {
          console.error('[backfill-translations] Error in stream:', error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
          const errorData = JSON.stringify({
            type: 'error',
            message: errorMessage,
          })
          controller.enqueue(new TextEncoder().encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Translation backfill error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: error instanceof APIError ? error.status : 500 },
    )
  }
}
