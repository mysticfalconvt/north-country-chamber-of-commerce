import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateHeader } from './hooks/revalidateHeader'
import { ensureCoreLinks } from './hooks/ensureCoreLinks'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
        }),
      ],
      admin: {
        initCollapsed: true,
        description:
          'Core navigation links (Home, Businesses, Events, etc.) are automatically added and cannot be removed. You can add additional custom links here.',
        components: {
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
    },
  ],
  hooks: {
    beforeChange: [ensureCoreLinks],
    afterChange: [revalidateHeader],
  },
}
