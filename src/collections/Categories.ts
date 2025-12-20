import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { chamberStaffOrAdmin } from '../access/chamberStaffOrAdmin'
import { slugField } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: chamberStaffOrAdmin,
    delete: chamberStaffOrAdmin,
    read: anyone,
    update: chamberStaffOrAdmin,
  },
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'icon',
      type: 'text',
      admin: {
        description: 'Lucide icon name (e.g., "store", "utensils", "home")',
      },
    },
    slugField(),
  ],
}
