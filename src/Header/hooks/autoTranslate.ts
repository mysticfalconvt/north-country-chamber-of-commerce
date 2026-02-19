import type { GlobalAfterChangeHook } from 'payload'
import { translateToFrench } from '@/utilities/translate'

const HOOK_TIMEOUT_MS = 15000 // 15 second max for entire hook

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

  // Wrap the entire translation logic in a timeout to prevent hangs
  const translationPromise = (async () => {
    try {
      // Check if French translation already exists
      const frenchDoc = await req.payload.findGlobal({
        slug: 'header',
        locale: 'fr',
        depth: 0,
      })

      if (!doc.navItems || !Array.isArray(doc.navItems) || doc.navItems.length === 0) {
        return
      }

      // Check if any nav items need translation
      let needsTranslation = false
      const translatedNavItems = await Promise.all(
        doc.navItems.map(async (navItem: any, index: number) => {
          // Skip incomplete nav items (e.g., newly added items without link data)
          if (!navItem?.link) {
            console.log(`[autoTranslate] Skipping nav item ${index}: no link data`)
            return navItem
          }

          const frenchNavItem = frenchDoc.navItems?.[index]
          // IMPORTANT: Preserve the original item structure including ID
          // Only translate the label field
          const translatedItem = {
            ...navItem,
            link: {
              ...navItem.link,
            },
          }

          // Check if French label exists - require non-empty English label
          const englishLabel =
            typeof navItem.link?.label === 'string' && navItem.link.label.trim()
              ? navItem.link.label
              : null
          const frenchLabel =
            typeof frenchNavItem?.link?.label === 'string' && frenchNavItem.link.label.trim()
              ? frenchNavItem.link.label
              : null

          if (englishLabel && !frenchLabel) {
            console.log(`[autoTranslate] Translating header nav label: ${englishLabel}`)
            translatedItem.link.label = await translateToFrench(englishLabel)
            needsTranslation = true
          }

          return translatedItem
        }),
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
  })()

  // Race the translation against a timeout
  const timeoutPromise = new Promise<void>((resolve) => {
    setTimeout(() => {
      console.warn('[autoTranslate] Header translation timed out after', HOOK_TIMEOUT_MS, 'ms')
      resolve()
    }, HOOK_TIMEOUT_MS)
  })

  await Promise.race([translationPromise, timeoutPromise])

  return doc
}
