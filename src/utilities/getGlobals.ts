import type { Config } from 'src/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import { headers } from 'next/headers'
import { getLocaleFromPathname, type Locale } from './getLocale'

type Global = keyof Config['globals']

async function getGlobal(slug: Global, depth = 0, locale?: Locale) {
  const payload = await getPayload({ config: configPromise })

  const global = await payload.findGlobal({
    slug,
    depth,
    locale,
  })

  return global
}

/**
 * Returns a unstable_cache function mapped with the cache tag for the slug
 */
export const getCachedGlobal =
  (slug: Global, depth = 0) =>
  async () => {
    const headersList = await headers()
    const pathname = headersList.get('x-pathname') || ''
    const locale = getLocaleFromPathname(pathname)

    return unstable_cache(async () => getGlobal(slug, depth, locale), [slug, locale], {
      tags: [`global_${slug}`],
    })()
  }
