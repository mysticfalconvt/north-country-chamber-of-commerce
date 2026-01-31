import type { GlobalBeforeChangeHook } from 'payload'
import { translateToFrench } from '@/utilities/translate'

/**
 * Auto-translate English content to French for Header
 * Translates nav item link labels
 */
export const autoTranslate: GlobalBeforeChangeHook = async ({ data }) => {
  try {
    // Translate nav item link labels
    if (data.navItems && Array.isArray(data.navItems)) {
      for (const navItem of data.navItems) {
        if (navItem.link?.label?.en && !navItem.link?.label?.fr) {
          console.log(`[autoTranslate] Translating header nav label: ${navItem.link.label.en}`)
          navItem.link.label.fr = await translateToFrench(navItem.link.label.en)
        }
      }
    }
  } catch (error) {
    console.error('[autoTranslate] Error during header translation:', error)
    // Don't block the save if translation fails
  }

  return data
}
