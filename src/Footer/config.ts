import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateFooter } from './hooks/revalidateFooter'
import { autoTranslate } from './hooks/autoTranslate'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Navigation',
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
                  'Add navigation links for the footer. Common links include Business Directory, Events, News, and Contact.',
                components: {
                  RowLabel: '@/Footer/RowLabel#RowLabel',
                },
              },
            },
          ],
        },
        {
          label: 'Contact',
          fields: [
            {
              name: 'contactInfo',
              type: 'group',
              fields: [
                {
                  name: 'address',
                  type: 'textarea',
                  admin: {
                    description: 'Physical address',
                  },
                },
                {
                  name: 'phone',
                  type: 'text',
                },
                {
                  name: 'email',
                  type: 'email',
                },
              ],
            },
          ],
        },
        {
          label: 'Social Media',
          fields: [
            {
              name: 'socialLinks',
              type: 'array',
              fields: [
                {
                  name: 'platform',
                  type: 'select',
                  required: true,
                  options: [
                    { label: 'Facebook', value: 'facebook' },
                    { label: 'Instagram', value: 'instagram' },
                    { label: 'Twitter/X', value: 'twitter' },
                    { label: 'LinkedIn', value: 'linkedin' },
                    { label: 'YouTube', value: 'youtube' },
                  ],
                },
                {
                  name: 'url',
                  type: 'text',
                  required: true,
                },
              ],
            },
          ],
        },
        {
          label: 'Copyright',
          fields: [
            {
              name: 'copyright',
              type: 'text',
              localized: true,
              defaultValue: '© 2025 North Country Chamber of Commerce. All rights reserved.',
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [autoTranslate],
    afterChange: [revalidateFooter],
  },
}
