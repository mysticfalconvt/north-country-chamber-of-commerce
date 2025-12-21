import type { CollectionBeforeChangeHook } from 'payload'
import { translateToFrench, translateLexicalJSON } from '@/utilities/translate'

/**
 * Auto-translate English content to French for Posts
 * Handles title and content
 */
export const autoTranslate: CollectionBeforeChangeHook = async ({ data, operation }) => {
  if (operation !== 'create' && operation !== 'update') {
    return data
  }

  try {
    // Translate title
    if (data.title?.en && !data.title?.fr) {
      console.log('Translating post title to French...')
      data.title.fr = await translateToFrench(data.title.en)
    }

    // Translate content
    if (data.content?.en && !data.content?.fr) {
      console.log('Translating post content to French...')
      data.content.fr = await translateLexicalJSON(data.content.en)
    }
  } catch (error) {
    console.error('Error during auto-translation:', error)
  }

  return data
}

/**
 * Recursively translate blocks
 */
async function translateBlocks(blocks: any[]): Promise<any[]> {
  return Promise.all(
    blocks.map(async (block) => {
      const translatedBlock = { ...block }

      // Translate based on block type
      switch (block.blockType) {
        case 'content':
          if (block.content) {
            translatedBlock.content = await translateLexicalJSON(block.content)
          }
          break

        case 'cta':
          if (block.heading) {
            translatedBlock.heading = await translateToFrench(block.heading)
          }
          if (block.subheading) {
            translatedBlock.subheading = await translateToFrench(block.subheading)
          }
          if (block.buttonText) {
            translatedBlock.buttonText = await translateToFrench(block.buttonText)
          }
          break

        case 'mediaBlock':
          if (block.caption) {
            translatedBlock.caption = await translateToFrench(block.caption)
          }
          break

        case 'archive':
          if (block.introContent) {
            translatedBlock.introContent = await translateLexicalJSON(block.introContent)
          }
          break

        case 'formBlock':
          if (block.heading) {
            translatedBlock.heading = await translateToFrench(block.heading)
          }
          if (block.subheading) {
            translatedBlock.subheading = await translateToFrench(block.subheading)
          }
          break

        default:
          // For unknown block types, just copy as-is
          break
      }

      return translatedBlock
    }),
  )
}
