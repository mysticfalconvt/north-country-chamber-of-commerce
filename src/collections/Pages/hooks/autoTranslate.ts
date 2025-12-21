import type { CollectionBeforeChangeHook, CollectionAfterChangeHook } from 'payload'
import { translateToFrench, translateLexicalJSON } from '@/utilities/translate'

/**
 * Auto-translate English content to French for Pages
 * Handles title in beforeChange (simple localized field)
 * Layout translation is handled in afterChange to avoid interfering with Payload's localization
 */
export const autoTranslate: CollectionBeforeChangeHook = async ({ data, operation }) => {
  if (operation !== 'create' && operation !== 'update') {
    return data
  }

  try {
    // Translate title (simple localized field - safe to do in beforeChange)
    if (data.title?.en && !data.title?.fr) {
      console.log('[autoTranslate] Translating page title to French...')
      data.title.fr = await translateToFrench(data.title.en)
    }
  } catch (error) {
    console.error('[autoTranslate] Error during title translation:', error)
    // Don't throw - allow the save to continue even if translation fails
  }

  return data
}

/**
 * Auto-translate layout blocks after save
 * This avoids interfering with Payload's localization handling during save
 */
export const autoTranslateLayout: CollectionAfterChangeHook = async ({ doc, req, operation, context }) => {
  // Skip if this is already a translation update to prevent loops
  if (context.skipTranslation) {
    return doc
  }

  if (operation !== 'create' && operation !== 'update') {
    return doc
  }

  // Only translate when editing in English locale
  if (req.locale !== 'en') {
    return doc
  }

  try {
    // Try to get layout from the doc first (it should have the just-saved layout)
    let englishLayout = doc.layout
    
    console.log('[autoTranslateLayout] Checking doc.layout:', {
      hasLayout: !!englishLayout,
      isArray: Array.isArray(englishLayout),
      length: Array.isArray(englishLayout) ? englishLayout.length : 0,
      docId: doc.id,
      locale: req.locale,
      isDraft: doc._status === 'draft',
      layoutValue: englishLayout ? JSON.stringify(englishLayout).substring(0, 200) : 'null',
    })
    
    // If layout is not in doc, fetch it explicitly
    if (!englishLayout || !Array.isArray(englishLayout) || englishLayout.length === 0) {
      console.log('[autoTranslateLayout] Layout not in doc, fetching from database...')
      
      try {
        const englishDoc = await req.payload.findByID({
          collection: 'pages',
          id: doc.id,
          locale: 'en',
          depth: 0,
          draft: doc._status === 'draft' ? true : undefined,
          req,
        })
        
        englishLayout = englishDoc.layout
        
        console.log('[autoTranslateLayout] Fetched layout:', {
          hasLayout: !!englishLayout,
          isArray: Array.isArray(englishLayout),
          length: Array.isArray(englishLayout) ? englishLayout.length : 0,
        })
        
        if (!englishLayout || !Array.isArray(englishLayout) || englishLayout.length === 0) {
          console.log('[autoTranslateLayout] No English layout found in database, skipping translation')
          return doc
        }
      } catch (fetchError) {
        console.error('[autoTranslateLayout] Error fetching English doc:', fetchError)
        return doc
      }
    }

    // Check if French translation already exists
    try {
      const frenchDoc = await req.payload.findByID({
        collection: 'pages',
        id: doc.id,
        locale: 'fr',
        depth: 0,
        draft: doc._status === 'draft' ? true : undefined,
        req,
      })
      
      if (frenchDoc.layout && Array.isArray(frenchDoc.layout) && frenchDoc.layout.length > 0) {
        console.log('[autoTranslateLayout] French layout already exists, skipping translation')
        return doc
      }
    } catch {
      // French locale might not exist yet, which is fine
    }

    // Translate and save
    await translateAndSaveLayout(englishLayout, doc.id, doc._status === 'draft', req)
  } catch (error) {
    console.error('[autoTranslateLayout] Error during layout translation:', error)
    // Don't throw - allow the save to continue even if translation fails
  }

  return doc
}

/**
 * Helper function to translate layout and save to French locale
 */
async function translateAndSaveLayout(
  englishLayout: any[],
  docId: string | number,
  isDraft: boolean,
  req: any,
): Promise<void> {
  console.log(`[autoTranslateLayout] Translating ${englishLayout.length} layout blocks to French...`)
  
  // Translate the blocks
  const translatedBlocks = await translateBlocks(englishLayout)

  // Update the French locale using Local API
  await req.payload.update({
    collection: 'pages',
    id: docId,
    data: {
      layout: translatedBlocks,
    },
    locale: 'fr',
    draft: isDraft, // Preserve draft status
    context: { skipTranslation: true }, // Prevent infinite loop
    req,
  })

  console.log('[autoTranslateLayout] French translation saved successfully')
}

/**
 * Recursively translate blocks from English to French
 * Since layout is localized, each locale gets its own blocks array
 * Within each locale's blocks, richText (which is also localized) should be direct Lexical JSON
 * for that locale, not wrapped in { en, fr }
 */
async function translateBlocks(blocks: any[]): Promise<any[]> {
  return Promise.all(
    blocks.map(async (block) => {
      const translatedBlock = { ...block }

      console.log(`[autoTranslate] Block type: ${block.blockType}`)

      // Translate based on block type
      switch (block.blockType) {
        case 'content':
          // Content blocks have columns, and each column has richText (which is localized)
          if (block.columns && Array.isArray(block.columns)) {
            console.log(`[autoTranslate] Found ${block.columns.length} columns`)
            translatedBlock.columns = await Promise.all(
              block.columns.map(async (column: any, idx: number) => {
                const translatedColumn = { ...column }
                console.log(`[autoTranslate] Column ${idx}: richText structure:`, {
                  hasRichText: !!column.richText,
                  hasEn: !!column.richText?.en,
                  hasFr: !!column.richText?.fr,
                  hasRoot: !!column.richText?.root,
                })
                
                // richText is localized, but when layout is also localized,
                // richText within each locale's blocks is direct Lexical JSON for that locale
                // So in French blocks, richText should be the translated Lexical JSON directly
                if (column.richText) {
                  let englishRichText: any = null
                  
                  // Extract English content
                  if (column.richText.root || column.richText.type) {
                    // Direct Lexical JSON - this is the English content
                    englishRichText = column.richText
                  } else if (column.richText.en) {
                    // Already in localized format (shouldn't happen when layout is localized, but handle it)
                    englishRichText = column.richText.en
                  }
                  
                  if (englishRichText) {
                    console.log(`[autoTranslate] Translating column ${idx} richText...`)
                    // Translate to French - result is direct Lexical JSON for French locale
                    translatedColumn.richText = await translateLexicalJSON(englishRichText)
                  } else {
                    console.log(`[autoTranslate] Column ${idx} skipped - no English content to translate`)
                  }
                }
                return translatedColumn
              })
            )
          } else {
            console.log('[autoTranslate] No columns found in content block')
          }
          break

        case 'cta':
          // CTA blocks have richText and links
          if (block.richText) {
            let englishRichText: any = null
            if (block.richText.root || block.richText.type) {
              englishRichText = block.richText
            } else if (block.richText.en) {
              englishRichText = block.richText.en
            }
            
            if (englishRichText) {
              // Translate to French - direct Lexical JSON for French locale
              translatedBlock.richText = await translateLexicalJSON(englishRichText)
            }
          }
          
          // Translate link labels (links is an array of link objects)
          // link.label is localized, but within French blocks it should be direct string
          if (block.links && Array.isArray(block.links)) {
            translatedBlock.links = await Promise.all(
              block.links.map(async (link: any) => {
                const translatedLink = { ...link }
                if (link.link?.label) {
                  let englishLabel: string | null = null
                  if (typeof link.link.label === 'string') {
                    englishLabel = link.link.label
                  } else if (link.link.label.en) {
                    englishLabel = link.link.label.en
                  }
                  
                  if (englishLabel) {
                    // Translate to French - direct string for French locale
                    translatedLink.link = {
                      ...link.link,
                      label: await translateToFrench(englishLabel),
                    }
                  }
                }
                return translatedLink
              })
            )
          }
          break

        case 'mediaBlock':
          // MediaBlock doesn't have translatable text fields
          break

        case 'archive':
          // Archive blocks have introContent (richText, localized)
          if (block.introContent) {
            let englishIntroContent: any = null
            if (block.introContent.root || block.introContent.type) {
              englishIntroContent = block.introContent
            } else if (block.introContent.en) {
              englishIntroContent = block.introContent.en
            }
            
            if (englishIntroContent) {
              // Translate to French - direct Lexical JSON for French locale
              translatedBlock.introContent = await translateLexicalJSON(englishIntroContent)
            }
          }
          break

        case 'formBlock':
          // FormBlock has introContent (richText, localized)
          if (block.introContent) {
            let englishIntroContent: any = null
            if (block.introContent.root || block.introContent.type) {
              englishIntroContent = block.introContent
            } else if (block.introContent.en) {
              englishIntroContent = block.introContent.en
            }
            
            if (englishIntroContent) {
              // Translate to French - direct Lexical JSON for French locale
              translatedBlock.introContent = await translateLexicalJSON(englishIntroContent)
            }
          }
          break

        default:
          // For unknown block types, just copy as-is
          console.log(`[autoTranslate] Unknown block type: ${block.blockType}, copying as-is`)
          break
      }

      return translatedBlock
    }),
  )
}
