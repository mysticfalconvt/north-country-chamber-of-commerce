import type { CollectionBeforeChangeHook } from 'payload'
import { translateToFrench, translateLexicalJSON } from '@/utilities/translate'

/**
 * Auto-translate English content to French for Signature Events
 */
export const autoTranslate: CollectionBeforeChangeHook = async ({ data, operation }) => {
  if (operation !== 'create' && operation !== 'update') {
    return data
  }

  try {
    // Translate name
    if (data.name?.en && !data.name?.fr) {
      console.log('Translating signature event name to French...')
      data.name.fr = await translateToFrench(data.name.en)
    }

    // Translate description
    if (data.description?.en && !data.description?.fr) {
      console.log('Translating signature event description to French...')
      data.description.fr = await translateLexicalJSON(data.description.en)
    }

    // Translate schedule
    if (data.schedule?.en && !data.schedule?.fr) {
      console.log('Translating signature event schedule to French...')
      data.schedule.fr = await translateLexicalJSON(data.schedule.en)
    }

    // Translate vendors
    if (data.vendors?.en && !data.vendors?.fr) {
      console.log('Translating signature event vendors to French...')
      data.vendors.fr = await translateLexicalJSON(data.vendors.en)
    }

    // Translate rules
    if (data.rules?.en && !data.rules?.fr) {
      console.log('Translating signature event rules to French...')
      data.rules.fr = await translateLexicalJSON(data.rules.en)
    }
  } catch (error) {
    console.error('Error during auto-translation:', error)
  }

  return data
}
