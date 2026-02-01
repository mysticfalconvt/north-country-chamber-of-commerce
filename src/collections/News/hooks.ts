import type { CollectionAfterChangeHook } from 'payload'
import { translateToFrench, translateLexicalJSON } from '@/utilities/translate'

/**
 * Auto-translate English content to French for News
 * Uses afterChange hook to avoid interfering with Payload's localization handling
 */
export const autoTranslate: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
  context,
}) => {
  // Skip if this is already a translation update to prevent loops
  if (context?.skipTranslation) {
    return doc
  }

  if (operation !== 'create' && operation !== 'update') {
    return doc
  }

  // Only translate when content is published, not on drafts/autosave
  if (doc._status && doc._status !== 'published') {
    return doc
  }

  // Only translate when editing in English locale
  if (req.locale !== 'en') {
    return doc
  }

  try {
    // Check if French translation already exists
    const frenchDoc = await req.payload.findByID({
      collection: 'news',
      id: doc.id,
      locale: 'fr',
      depth: 0,
    })

    const updateData: Record<string, any> = {}
    let needsUpdate = false

    // Get English title for logging
    const newsTitle = typeof doc.title === 'string' ? doc.title : 'Untitled News'

    // Check and translate title
    if (doc.title) {
      const frenchTitle = typeof frenchDoc.title === 'string' ? frenchDoc.title : null
      if (!frenchTitle) {
        console.log(`[autoTranslate] Translating news "${newsTitle}" title to French...`)
        updateData.title = await translateToFrench(doc.title)
        needsUpdate = true
      }
    }

    // Check and translate content
    if (doc.content) {
      const hasFrenchContent = frenchDoc.content?.root?.children?.length > 0
      if (!hasFrenchContent) {
        console.log(`[autoTranslate] Translating news "${newsTitle}" content to French...`)
        updateData.content = await translateLexicalJSON(doc.content)
        needsUpdate = true
      }
    }

    if (needsUpdate) {
      await req.payload.update({
        collection: 'news',
        id: doc.id,
        data: updateData,
        locale: 'fr',
        context: { skipTranslation: true },
      })
      console.log(`[autoTranslate] French translation saved for news "${newsTitle}"`)
    }
  } catch (error) {
    console.error('[autoTranslate] Error during news translation:', error)
    // Don't throw - allow the save to continue even if translation fails
  }

  return doc
}
