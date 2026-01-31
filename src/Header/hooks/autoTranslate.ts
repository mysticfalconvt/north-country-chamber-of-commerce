import type { GlobalAfterChangeHook } from 'payload'
import { translateToFrench } from '@/utilities/translate'

/**
 * Auto-translate English content to French for Header
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
      slug: 'header',
      locale: 'fr',
      depth: 0,
    })

    if (!doc.navItems || !Array.isArray(doc.navItems) || doc.navItems.length === 0) {
      return doc
    }

    // Check if any nav items need translation
    let needsTranslation = false
    const translatedNavItems = await Promise.all(
      doc.navItems.map(async (navItem: any, index: number) => {
        const frenchNavItem = frenchDoc.navItems?.[index]
        const translatedItem = { ...navItem }

        // Check if French label exists
        const englishLabel = typeof navItem.link?.label === 'string' ? navItem.link.label : null
        const frenchLabel = typeof frenchNavItem?.link?.label === 'string' ? frenchNavItem.link.label : null

        if (englishLabel && !frenchLabel) {
          console.log(`[autoTranslate] Translating header nav label: ${englishLabel}`)
          translatedItem.link = {
            ...navItem.link,
            label: await translateToFrench(englishLabel),
          }
          needsTranslation = true
        }

        return translatedItem
      })
    )

    if (needsTranslation) {
      await req.payload.updateGlobal({
        slug: 'header',
        data: { navItems: translatedNavItems },
        locale: 'fr',
        context: { skipTranslation: true },
      })
      console.log('[autoTranslate] French translation saved for header')
    }
  } catch (error) {
    console.error('[autoTranslate] Error during header translation:', error)
    // Don't throw - allow the save to continue even if translation fails
  }

  return doc
}
