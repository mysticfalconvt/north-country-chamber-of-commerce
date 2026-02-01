import type { GlobalAfterChangeHook } from 'payload'
import { translateToFrench } from '@/utilities/translate'

/**
 * Auto-translate English content to French for Footer
 * Uses afterChange hook to avoid interfering with Payload's localization handling
 */
export const autoTranslate: GlobalAfterChangeHook = async ({ doc, req, context }) => {
  // Skip if this is already a translation update to prevent loops
  if (context?.skipTranslation) {
    return doc
  }

  // Only translate when editing in English locale
  if (req.locale !== 'en') {
    return doc
  }

  try {
    // Check if French translation already exists
    const frenchDoc = await req.payload.findGlobal({
      slug: 'footer',
      locale: 'fr',
      depth: 0,
    })

    const updateData: Record<string, any> = {}
    let needsUpdate = false

    // Translate nav items
    if (doc.navItems && Array.isArray(doc.navItems) && doc.navItems.length > 0) {
      const translatedNavItems = await Promise.all(
        doc.navItems.map(async (navItem: any, index: number) => {
          const frenchNavItem = frenchDoc.navItems?.[index]
          // IMPORTANT: Preserve the original item structure including ID
          // Only translate the label field
          const translatedItem = {
            ...navItem,
            link: {
              ...navItem.link,
            },
          }

          // Check if French label exists
          const englishLabel = typeof navItem.link?.label === 'string' ? navItem.link.label : null
          const frenchLabel = typeof frenchNavItem?.link?.label === 'string' ? frenchNavItem.link.label : null

          if (englishLabel && !frenchLabel) {
            console.log(`[autoTranslate] Translating footer nav label: ${englishLabel}`)
            translatedItem.link.label = await translateToFrench(englishLabel)
            needsUpdate = true
          }

          return translatedItem
        })
      )

      if (needsUpdate) {
        updateData.navItems = translatedNavItems
      }
    }

    // Translate copyright
    if (doc.copyright) {
      const englishCopyright = typeof doc.copyright === 'string' ? doc.copyright : null
      const frenchCopyright = typeof frenchDoc.copyright === 'string' ? frenchDoc.copyright : null

      if (englishCopyright && !frenchCopyright) {
        console.log('[autoTranslate] Translating footer copyright')
        updateData.copyright = await translateToFrench(englishCopyright)
        needsUpdate = true
      }
    }

    if (needsUpdate) {
      await req.payload.updateGlobal({
        slug: 'footer',
        data: updateData,
        locale: 'fr',
        context: { skipTranslation: true },
      })
      console.log('[autoTranslate] French translation saved for footer')
    }
  } catch (error) {
    console.error('[autoTranslate] Error during footer translation:', error)
    // Don't throw - allow the save to continue even if translation fails
  }

  return doc
}
