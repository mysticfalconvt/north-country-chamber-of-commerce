import type { GlobalBeforeChangeHook } from 'payload'

// Core navigation link definitions
const CORE_LINK_DEFS = [
  {
    url: '/',
    labels: { en: 'Home', fr: 'Accueil' },
  },
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
      `Adding ${missingCoreLinkDefs.length} missing core navigation links to header`,
    )

    // Create link objects with proper localized structure
    const missingCoreLinks = missingCoreLinkDefs.map((def) => ({
      link: {
        type: 'custom',
        url: def.url,
        // Set label based on current locale, but include both locales in the object
        label: locale === 'en' ? def.labels.en : def.labels.fr,
        newTab: false,
      },
    }))

    data.navItems = [...missingCoreLinks, ...navItems]
  }

  return data
}
