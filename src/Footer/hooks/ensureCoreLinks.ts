import type { GlobalBeforeChangeHook } from 'payload'

// Core quick link definitions that should always be present in footer
const CORE_LINK_DEFS = [
  {
    url: '/businesses',
    labels: { en: 'Business Directory', fr: 'Répertoire des entreprises' },
  },
  {
    url: '/events',
    labels: { en: 'Events', fr: 'Événements' },
  },
  {
    url: '/signature-events',
    labels: { en: 'Annual Events', fr: 'Événements annuels' },
  },
  {
    url: '/news',
    labels: { en: 'News', fr: 'Actualités' },
  },
  {
    url: '/contact',
    labels: { en: 'Contact Us', fr: 'Nous contacter' },
  },
]

export const ensureCoreLinks: GlobalBeforeChangeHook = async ({ data, req }) => {
  const navItems = data.navItems || []
  const locale = req.locale || 'en'

  // Get URLs of existing links to avoid duplicates
  const existingUrls = new Set(
    navItems
      .filter((item: any) => item?.link?.type === 'custom' && item?.link?.url)
      .map((item: any) => item.link.url),
  )

  // Find core links that are missing
  const missingCoreLinkDefs = CORE_LINK_DEFS.filter(
    (coreLinkDef) => !existingUrls.has(coreLinkDef.url),
  )

  // If there are missing core links, prepend them to the data
  if (missingCoreLinkDefs.length > 0) {
    req.payload.logger.info(
      `Adding ${missingCoreLinkDefs.length} missing core navigation links to footer`,
    )

    // Create link objects with proper localized structure
    const missingCoreLinks = missingCoreLinkDefs.map((def) => ({
      link: {
        type: 'custom',
        url: def.url,
        // Set label based on current locale
        label: locale === 'en' ? def.labels.en : def.labels.fr,
        newTab: false,
      },
    }))

    data.navItems = [...missingCoreLinks, ...navItems]
  }

  return data
}
