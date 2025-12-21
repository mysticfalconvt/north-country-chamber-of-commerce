import type { CollectionBeforeChangeHook } from 'payload'
import { translateToFrench, translateLexicalJSON } from '@/utilities/translate'

/**
 * Auto-translate English content to French
 * Only translates if:
 * 1. English content exists
 * 2. French content is empty (to preserve manual edits)
 */
export const autoTranslate: CollectionBeforeChangeHook = async ({ data, operation }) => {
  // Only run on create or update operations
  if (operation !== 'create' && operation !== 'update') {
    return data
  }

  try {
    // Translate title if English exists and French doesn't
    if (data.title?.en && !data.title?.fr) {
      console.log('Translating event title to French...')
      data.title.fr = await translateToFrench(data.title.en)
    }

    // Translate description (Lexical rich text) if English exists and French doesn't
    if (data.description?.en && !data.description?.fr) {
      console.log('Translating event description to French...')
      data.description.fr = await translateLexicalJSON(data.description.en)
    }
  } catch (error) {
    console.error('Error during auto-translation:', error)
    // Don't block the save if translation fails
  }

  return data
}
