import type { GlobalBeforeChangeHook } from 'payload'
import { translateToFrench } from '@/utilities/translate'

/**
 * Auto-translate English content to French for Footer
 * Translates nav item link labels and copyright
 */
export const autoTranslate: GlobalBeforeChangeHook = async ({ data }) => {
  try {
    // Translate nav item link labels
    if (data.navItems && Array.isArray(data.navItems)) {
      for (const navItem of data.navItems) {
        if (navItem.link?.label?.en && !navItem.link?.label?.fr) {
          console.log(`[autoTranslate] Translating footer nav label: ${navItem.link.label.en}`)
          navItem.link.label.fr = await translateToFrench(navItem.link.label.en)
        }
      }
    }

    // Translate copyright
    if (data.copyright?.en && !data.copyright?.fr) {
      console.log(`[autoTranslate] Translating footer copyright`)
      data.copyright.fr = await translateToFrench(data.copyright.en)
    }
  } catch (error) {
    console.error('[autoTranslate] Error during footer translation:', error)
    // Don't block the save if translation fails
  }

  return data
}
