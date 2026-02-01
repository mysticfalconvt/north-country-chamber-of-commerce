import OpenAI from 'openai'

// Initialize OpenAI client with self-hosted LLM endpoint
const client = new OpenAI({
  baseURL: process.env.TRANSLATION_API_URL || 'http://localhost:11434/v1',
  apiKey: process.env.TRANSLATION_API_KEY || 'not-needed',
})

const model = process.env.TRANSLATION_MODEL || 'qwen3:8b'
const TRANSLATION_TIMEOUT_MS = 10000 // 10 second timeout

/**
 * Translate text from English to Canadian French
 * @param text - The English text to translate
 * @returns Translated French text
 */
export async function translateToFrench(text: string): Promise<string> {
  if (!text || text.trim() === '') {
    return text
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TRANSLATION_TIMEOUT_MS)

  try {
    console.log('[translateToFrench] Translating:', text.substring(0, 50))
    const response = await client.chat.completions.create(
      {
        model,
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following text from English to Canadian French.
Keep proper nouns unchanged (business names, "Newport", "Northeast Kingdom", "Vermont", person names, organization names).
Preserve any HTML tags, markdown formatting, or special characters exactly as they appear.
Return ONLY the translated text, no explanations or additional commentary.`,
          },
          { role: 'user', content: text },
        ],
        temperature: 0.3,
      },
      { signal: controller.signal },
    )
    clearTimeout(timeoutId)

    const result = response.choices[0]?.message?.content?.trim() || text
    console.log('[translateToFrench] Result:', result.substring(0, 50))

    if (result === text) {
      console.warn('[translateToFrench] WARNING: Translation returned same as input!')
      console.log('[translateToFrench] Full response:', JSON.stringify(response, null, 2))
    }

    return result
  } catch (error: unknown) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[translateToFrench] Translation timed out after', TRANSLATION_TIMEOUT_MS, 'ms')
    } else {
      console.error('Translation error:', error)
    }
    // Fallback: return original text if translation fails
    return text
  }
}

/**
 * Translate rich text content by splitting into chunks
 * This helps with more reliable translation of large content blocks
 * @param content - The English content to translate
 * @returns Translated French content
 */
export async function translateRichText(content: string): Promise<string> {
  if (!content || content.trim() === '') {
    return content
  }

  try {
    // Split on paragraph breaks and headings to maintain structure
    const chunks = content.split(/(\n\n|\n(?=#{1,6}\s))/)

    const translated = await Promise.all(
      chunks.map(async (chunk) => {
        // Preserve whitespace and empty chunks
        if (chunk.trim() === '' || /^[\n\s]+$/.test(chunk)) {
          return chunk
        }
        return translateToFrench(chunk)
      }),
    )

    return translated.join('')
  } catch (error) {
    console.error('Rich text translation error:', error)
    return content
  }
}

/**
 * Translate a Lexical editor JSON structure
 * Traverses the JSON and translates text nodes while preserving structure
 * @param lexicalJSON - The Lexical editor JSON structure
 * @returns Translated Lexical JSON structure
 */
export async function translateLexicalJSON(
  lexicalJSON: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (!lexicalJSON || typeof lexicalJSON !== 'object') {
    console.log('[translateLexicalJSON] Input is not an object:', typeof lexicalJSON)
    return lexicalJSON
  }

  console.log('[translateLexicalJSON] Starting translation of Lexical JSON')
  console.log(
    '[translateLexicalJSON] Input structure:',
    JSON.stringify(lexicalJSON).substring(0, 200),
  )

  // Deep clone to avoid mutating original
  const translated = JSON.parse(JSON.stringify(lexicalJSON))

  let textNodeCount = 0

  async function traverseAndTranslate(node: any, path = 'root'): Promise<void> {
    if (!node || typeof node !== 'object') {
      console.log(`[translateLexicalJSON] ${path}: Not an object, skipping`)
      return
    }

    console.log(
      `[translateLexicalJSON] ${path}: type=${node.type}, hasText=${!!node.text}, hasChildren=${!!node.children}`,
    )

    // If this is a text node with text content
    if (node.type === 'text' && typeof node.text === 'string') {
      console.log(`[translateLexicalJSON] ${path}: Found text node: "${node.text}"`)
      textNodeCount++
      node.text = await translateToFrench(node.text as string)
      console.log(`[translateLexicalJSON] ${path}: Translated to: "${node.text}"`)
    }

    // If this is a heading, paragraph, or other node with text
    if (node.children && Array.isArray(node.children)) {
      console.log(`[translateLexicalJSON] ${path}: Traversing ${node.children.length} children`)
      for (let i = 0; i < node.children.length; i++) {
        await traverseAndTranslate(node.children[i], `${path}.children[${i}]`)
      }
    }

    // Handle other nested structures
    if (node.fields) {
      console.log(`[translateLexicalJSON] ${path}: Traversing fields`)
      await traverseAndTranslate(node.fields, `${path}.fields`)
    }
  }

  // Start traversal at the root node, not the outer wrapper
  if (translated.root) {
    console.log('[translateLexicalJSON] Starting at root node')
    await traverseAndTranslate(translated.root, 'root')
  } else {
    console.log('[translateLexicalJSON] No root node found, starting at top level')
    await traverseAndTranslate(translated)
  }

  console.log(`[translateLexicalJSON] Translation complete. Found ${textNodeCount} text nodes`)
  return translated
}

/**
 * Recursively translate all text content in a data structure
 * This handles any nested structure including Lexical JSON, strings, arrays, and objects
 * @param data - Any data structure to translate
 * @returns Translated data structure
 */
export async function translateDataStructure(data: any): Promise<any> {
  if (!data) return data

  // Handle strings - translate them
  if (typeof data === 'string') {
    return translateToFrench(data)
  }

  // Handle arrays - translate each element
  if (Array.isArray(data)) {
    return Promise.all(data.map((item) => translateDataStructure(item)))
  }

  // Handle objects
  if (typeof data === 'object') {
    // Check if this is a Lexical text node - translate the text field
    if (data.type === 'text' && typeof data.text === 'string') {
      return {
        ...data,
        text: await translateToFrench(data.text),
      }
    }

    // For other objects, recursively translate all properties
    const translated: any = {}
    for (const [key, value] of Object.entries(data)) {
      // Skip certain fields that should never be translated
      if (
        key === 'id' ||
        key === 'blockType' ||
        key === 'type' ||
        key === 'format' ||
        key === 'indent' ||
        key === 'version' ||
        key === 'mode' ||
        key === 'style' ||
        key === 'relationTo' ||
        key === 'value'
      ) {
        translated[key] = value
      } else {
        translated[key] = await translateDataStructure(value)
      }
    }
    return translated
  }

  // For primitives (numbers, booleans, etc), return as-is
  return data
}

/**
 * Check if translation service is available
 * @returns true if translation service is reachable
 */
export async function isTranslationAvailable(): Promise<boolean> {
  // If no API URL is configured, service is not available
  if (!process.env.TRANSLATION_API_URL) {
    console.error('TRANSLATION_API_URL is not configured')
    return false
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TRANSLATION_TIMEOUT_MS)

  try {
    console.log('Checking translation service at:', process.env.TRANSLATION_API_URL)
    console.log('Using model:', model)

    const response = await client.chat.completions.create(
      {
        model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
        temperature: 0,
      },
      { signal: controller.signal },
    )
    clearTimeout(timeoutId)

    console.log('Translation service response:', JSON.stringify(response, null, 2))

    // Check if we have a valid response structure
    const hasChoices = response && response.choices && response.choices.length > 0
    const hasMessage = hasChoices && response.choices[0].message
    const hasContent = hasMessage && response.choices[0].message.content

    console.log('Response validation:', { hasChoices, hasMessage, hasContent })

    if (hasContent) {
      console.log('Translation service is available')
      return true
    }

    // If we got a response but no content, it might still be working
    // Some models/APIs return empty content for certain requests
    if (hasChoices) {
      console.log('Translation service responded but with no content - considering it available')
      return true
    }

    console.log('Translation service check failed: Invalid response structure')
    return false
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[isTranslationAvailable] Check timed out after', TRANSLATION_TIMEOUT_MS, 'ms')
    } else {
      console.error('Translation service check failed with error:', error)
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
    }
    return false
  }
}
