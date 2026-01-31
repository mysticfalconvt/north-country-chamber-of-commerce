import type { CollectionBeforeChangeHook } from 'payload'
import { translateToFrench, translateLexicalJSON } from '@/utilities/translate'

/**
 * Auto-translate English content to French for News
 * Only translates if:
 * 1. English content exists
 * 2. French content is empty (to preserve manual edits)
 */
export const autoTranslate: CollectionBeforeChangeHook = async ({ data, operation }) => {
  if (operation !== 'create' && operation !== 'update') {
    return data
  }

  try {
    // Translate title if English exists and French doesn't
    if (data.title?.en && !data.title?.fr) {
      console.log('[autoTranslate] Translating news title to French...')
      data.title.fr = await translateToFrench(data.title.en)
    }

    // Translate content (Lexical rich text) if English exists and French doesn't
    if (data.content?.en && !data.content?.fr) {
      console.log('[autoTranslate] Translating news content to French...')
      data.content.fr = await translateLexicalJSON(data.content.en)
    }
  } catch (error) {
    console.error('[autoTranslate] Error during news translation:', error)
    // Don't block the save if translation fails
  }

  return data
}
