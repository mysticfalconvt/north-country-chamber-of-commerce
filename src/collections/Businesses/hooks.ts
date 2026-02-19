import type { CollectionAfterChangeHook } from 'payload'
import { translateLexicalJSON, translateToFrench } from '@/utilities/translate'

/**
 * Auto-translate English content to French for Businesses
 * Uses afterChange hook to avoid interfering with Payload's localization handling
 */
export const autoTranslate: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
  context,
}) => {
  // Skip if this is already a translation update to prevent loops
  if (context?.skipTranslation) {
    return doc
  }

  if (operation !== 'create' && operation !== 'update') {
    return doc
  }

  // Only translate when content is published, not on drafts/autosave
  if (doc._status && doc._status !== 'published') {
    return doc
  }

  // Only translate when editing in English locale
  if (req.locale !== 'en') {
    return doc
  }

  try {
    // Check if French translation already exists
    const frenchDoc = await req.payload.findByID({
      collection: 'businesses',
      id: doc.id,
      locale: 'fr',
      depth: 0,
    })

    const updateData: Record<string, any> = {}
    let needsUpdate = false

    // Check and translate description
    if (doc.description) {
      // Check if French description exists and has content
      const hasFrenchDescription = (frenchDoc.description?.root?.children?.length ?? 0) > 0

      if (!hasFrenchDescription) {
        console.log(`[autoTranslate] Translating business "${doc.name}" description to French...`)
        updateData.description = await translateLexicalJSON(doc.description)
        needsUpdate = true
      }
    }

    // Check and translate offer titles and descriptions in advertising slots
    if (doc.advertisingSlots && Array.isArray(doc.advertisingSlots)) {
      const translatedSlots = await Promise.all(
        doc.advertisingSlots.map(async (slot: any, index: number) => {
          const frenchSlot = frenchDoc.advertisingSlots?.[index]
          const translatedSlot = { ...slot }
          let slotNeedsUpdate = false

          // Translate offerTitle if it exists and French version doesn't
          if (slot.offerTitle && slot.type === 'offer') {
            const hasFrenchOfferTitle =
              frenchSlot?.offerTitle && typeof frenchSlot.offerTitle === 'string'
            if (!hasFrenchOfferTitle) {
              translatedSlot.offerTitle = await translateToFrench(slot.offerTitle)
              slotNeedsUpdate = true
            }
          }

          // Translate offerDescription if it exists and French version doesn't
          if (slot.offerDescription && slot.type === 'offer') {
            const hasFrenchOfferDesc =
              (frenchSlot?.offerDescription?.root?.children?.length ?? 0) > 0
            if (!hasFrenchOfferDesc) {
              translatedSlot.offerDescription = await translateLexicalJSON(slot.offerDescription)
              slotNeedsUpdate = true
            }
          }

          // Translate caption if it exists and French version doesn't
          if (slot.caption) {
            const hasFrenchCaption = frenchSlot?.caption && typeof frenchSlot.caption === 'string'
            if (!hasFrenchCaption) {
              translatedSlot.caption = await translateToFrench(slot.caption)
              slotNeedsUpdate = true
            }
          }

          if (slotNeedsUpdate) {
            needsUpdate = true
          }
          return translatedSlot
        }),
      )

      if (needsUpdate) {
        updateData.advertisingSlots = translatedSlots
      }
    }

    // Check and translate hours of operation
    if (doc.hoursOfOperation) {
      const hasFrenchHours = (frenchDoc.hoursOfOperation?.root?.children?.length ?? 0) > 0
      if (!hasFrenchHours) {
        console.log(`[autoTranslate] Translating business "${doc.name}" hours to French...`)
        updateData.hoursOfOperation = await translateLexicalJSON(doc.hoursOfOperation)
        needsUpdate = true
      }
    }

    if (needsUpdate) {
      await req.payload.update({
        collection: 'businesses',
        id: doc.id,
        data: updateData,
        locale: 'fr',
        context: { skipTranslation: true },
      })
      console.log(`[autoTranslate] French translation saved for business "${doc.name}"`)
    }
  } catch (error) {
    console.error('[autoTranslate] Error during business translation:', error)
    // Don't throw - allow the save to continue even if translation fails
  }

  return doc
}
