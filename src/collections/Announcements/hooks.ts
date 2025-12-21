import type { CollectionBeforeChangeHook } from 'payload'
import { translateToFrench, translateLexicalJSON } from '@/utilities/translate'

/**
 * Auto-translate English content to French for Announcements
 */
export const autoTranslate: CollectionBeforeChangeHook = async ({ data, operation }) => {
  if (operation !== 'create' && operation !== 'update') {
    return data
  }

  try {
    // Translate title
    if (data.title?.en && !data.title?.fr) {
      console.log('Translating announcement title to French...')
      data.title.fr = await translateToFrench(data.title.en)
    }

    // Translate content
    if (data.content?.en && !data.content?.fr) {
      console.log('Translating announcement content to French...')
      data.content.fr = await translateLexicalJSON(data.content.en)
    }
  } catch (error) {
    console.error('Error during auto-translation:', error)
  }

  return data
}
