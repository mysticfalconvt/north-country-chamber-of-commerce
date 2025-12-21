# Localization Guide

This application supports bilingual content in English and French.

## Overview

- **Default Language:** English (en)
- **Secondary Language:** French (fr)
- **Translation Method:** Auto-generated via self-hosted LLM with manual override capability

## How It Works

### 1. URL Structure

- English content: `https://yourdomain.com/page-name`
- French content: `https://yourdomain.com/fr/page-name`

The middleware automatically detects the user's preferred language and redirects if needed.

### 2. Content Creation

Chamber staff create content in **English only**. French translations are generated automatically when you save.

**Behavior:**
- ✅ New content: Auto-translates English → French on first save
- ✅ Edits to English: Does NOT overwrite existing French (preserves your manual edits)
- ✅ Manual French edits: Always preserved
- 🔄 To re-translate: Clear the French field, then save again

### 3. Localized vs Non-Localized Fields

**Localized (translated):**
- Page/event/business titles
- Descriptions and rich text content
- Meta descriptions
- Announcement content

**Non-Localized (same in both languages):**
- Dates and times
- Addresses, phone numbers, emails
- Prices, URLs
- Media files
- Business names (preserved as proper nouns)
- Place names (Newport, Northeast Kingdom, Vermont)

## Setting Up Translation Service

### Prerequisites

You need a self-hosted LLM with an OpenAI-compatible API. Recommended options:

- **Ollama** (easiest): https://ollama.ai
- **vLLM**: https://docs.vllm.ai
- **LocalAI**: https://localai.io

### Recommended Model

**Qwen 3 8B** - Good balance of quality and speed for translation tasks.

### Installation (Ollama Example)

1. Install Ollama on your server/computer
2. Pull the model:
   ```bash
   ollama pull qwen3:8b
   ```
3. Verify it's running:
   ```bash
   curl http://localhost:11434/v1/models
   ```

### Environment Variables

Add these to your `.env` file:

```env
TRANSLATION_API_URL=http://192.168.x.x:11434/v1
TRANSLATION_MODEL=qwen3:8b
TRANSLATION_API_KEY=not-needed
```

**Note:** Replace `192.168.x.x` with your LLM server's IP address.

## Adding Auto-Translation to Collections

The Events collection already has auto-translation enabled. To add it to other collections:

### Example: Announcements Collection

1. Create a hooks file: `src/collections/Announcements/hooks.ts`

```typescript
import type { CollectionBeforeChangeHook } from 'payload'
import { translateToFrench, translateLexicalJSON } from '@/utilities/translate'

export const autoTranslate: CollectionBeforeChangeHook = async ({ data, operation }) => {
  if (operation !== 'create' && operation !== 'update') {
    return data
  }

  try {
    // Translate title
    if (data.title?.en && !data.title?.fr) {
      data.title.fr = await translateToFrench(data.title.en)
    }

    // Translate rich text content
    if (data.content?.en && !data.content?.fr) {
      data.content.fr = await translateLexicalJSON(data.content.en)
    }
  } catch (error) {
    console.error('Error during auto-translation:', error)
  }

  return data
}
```

2. Import and use in collection config:

```typescript
import { autoTranslate } from './hooks'

export const Announcements: CollectionConfig = {
  // ...
  hooks: {
    beforeChange: [autoTranslate],
  },
  // ...
}
```

## Translation Utilities

### `translateToFrench(text: string)`

Translates plain text from English to Canadian French.

```typescript
import { translateToFrench } from '@/utilities/translate'

const frenchText = await translateToFrench('Welcome to the chamber')
// Result: "Bienvenue à la chambre"
```

### `translateLexicalJSON(lexicalJSON: any)`

Translates Lexical editor rich text content while preserving formatting.

```typescript
import { translateLexicalJSON } from '@/utilities/translate'

const frenchContent = await translateLexicalJSON(data.description.en)
```

### `isTranslationAvailable()`

Check if the translation service is reachable.

```typescript
import { isTranslationAvailable } from '@/utilities/translate'

const available = await isTranslationAvailable()
if (!available) {
  console.warn('Translation service unavailable')
}
```

## Troubleshooting

### Translation not working?

1. Check the translation service is running:
   ```bash
   curl http://your-llm-server:11434/v1/models
   ```

2. Check environment variables are set correctly

3. Look for errors in the console logs

### Poor translation quality?

1. Try a different model (e.g., `mistral:7b`, `llama3:8b`)
2. Adjust the temperature in `translate.ts` (lower = more consistent)
3. Manually edit the French content - it won't be overwritten

### Translation takes too long?

1. Use a smaller model (e.g., `qwen3:3b`)
2. Ensure the LLM server has adequate resources (CPU/GPU)
3. Consider running the LLM on the same machine as the app

## Manual Translation Workflow

If you prefer to translate manually:

1. Disable auto-translation by removing the hooks from collections
2. Chamber staff can still enter French content directly in the admin panel
3. Each field has an English and French tab - switch between them to edit

## Frontend Integration

The frontend automatically serves content in the correct language based on the URL:

```typescript
// In your page component
const locale = params.lang || 'en'

const page = await payload.findByID({
  collection: 'pages',
  id: pageId,
  locale, // This tells Payload which language to return
})

// Access localized fields
console.log(page.title) // Returns title in requested locale
```

## Testing

1. Create a test event in the admin panel (English only)
2. Check the French tab - it should auto-populate
3. Visit `/events/your-event` (English)
4. Visit `/fr/events/your-event` (French)
5. Edit the French content manually
6. Edit the English content again - French should remain unchanged

## Best Practices

- ✅ Write clear, simple English for better translation quality
- ✅ Review auto-translated French for key pages (homepage, about)
- ✅ Keep proper nouns in English (business names, place names)
- ✅ Test both language versions before major launches
- ❌ Don't rely on auto-translation for legal or critical content
- ❌ Don't clear French fields unless you want to re-translate

## Backfilling Translations for Existing Content

If you have existing content in English and want to add French translations, use the backfill script:

```bash
pnpm translate:backfill
```

This will:
1. Check that your translation service is available
2. Go through all collections (Events, Businesses, Announcements, etc.)
3. Find any content that has English but no French
4. Automatically translate and save the French versions
5. Show you a summary of what was translated

**Important:**
- Make sure your LLM server is running first
- This can take a while if you have lots of content
- The script will skip any content that already has French translations

## Collections with Auto-Translation

All of these collections now have auto-translation enabled:

- ✅ **Events** - title, description
- ✅ **Businesses** - description
- ✅ **Announcements** - title, content
- ✅ **Signature Events** - name, description, schedule, vendors, rules
- ✅ **Pages** - title, layout blocks
- ✅ **Posts** - title, content

## Future Enhancements

Possible improvements for later:

- Translation quality scoring
- Bulk re-translation tool
- Translation memory (cache common phrases)
- Support for additional languages (Spanish?)
- Professional translation integration (e.g., DeepL API)
