import type { CollectionBeforeChangeHook } from 'payload'
import { translateLexicalJSON } from '@/utilities/translate'

/**
 * Auto-translate English content to French for Businesses
 */
export const autoTranslate: CollectionBeforeChangeHook = async ({ data, operation }) => {
  if (operation !== 'create' && operation !== 'update') {
    return data
  }

  try {
    // Translate description (Lexical rich text) if English exists and French doesn't
    if (data.description?.en && !data.description?.fr) {
      console.log(`Translating business description to French for: ${data.name}`)
      data.description.fr = await translateLexicalJSON(data.description.en)
    }
  } catch (error) {
    console.error('Error during auto-translation:', error)
  }

  return data
}
