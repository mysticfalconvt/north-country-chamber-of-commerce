import type { CollectionAfterChangeHook } from 'payload'
import { translateToFrench, translateLexicalJSON } from '@/utilities/translate'

/**
 * Auto-translate English content to French for Events
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

  // Only translate when editing in English locale
  if (req.locale !== 'en') {
    return doc
  }

  try {
    // Check if French translation already exists
    const frenchDoc = await req.payload.findByID({
      collection: 'events',
      id: doc.id,
      locale: 'fr',
      depth: 0,
    })

    const updateData: Record<string, any> = {}
    let needsUpdate = false

    // Get English title for logging
    const eventTitle = typeof doc.title === 'string' ? doc.title : 'Untitled Event'

    // Check and translate title
    if (doc.title) {
      const frenchTitle = typeof frenchDoc.title === 'string' ? frenchDoc.title : null
      if (!frenchTitle) {
        console.log(`[autoTranslate] Translating event "${eventTitle}" title to French...`)
        updateData.title = await translateToFrench(doc.title)
        needsUpdate = true
      }
    }

    // Check and translate description
    if (doc.description) {
      const hasFrenchDescription = frenchDoc.description?.root?.children?.length > 0
      if (!hasFrenchDescription) {
        console.log(`[autoTranslate] Translating event "${eventTitle}" description to French...`)
        updateData.description = await translateLexicalJSON(doc.description)
        needsUpdate = true
      }
    }

    if (needsUpdate) {
      await req.payload.update({
        collection: 'events',
        id: doc.id,
        data: updateData,
        locale: 'fr',
        context: { skipTranslation: true },
      })
      console.log(`[autoTranslate] French translation saved for event "${eventTitle}"`)
    }
  } catch (error) {
    console.error('[autoTranslate] Error during event translation:', error)
    // Don't throw - allow the save to continue even if translation fails
  }

  return doc
}
