import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { isAdmin } from '../../access/isAdmin'
import { isAdminOrSelf } from '../../access/isAdminOrSelf'
import { adminPanelAccess } from '../../access/adminPanelAccess'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: adminPanelAccess,
    create: isAdmin,
    delete: isAdmin,
    read: isAdminOrSelf,
    update: isAdminOrSelf,
  },
  admin: {
    defaultColumns: ['name', 'email', 'role', 'business'],
    useAsTitle: 'name',
    description: 'User accounts for admin panel access and business member logins',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'business_member',
      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'Chamber Staff',
          value: 'chamber_staff',
        },
        {
          label: 'Business Member',
          value: 'business_member',
        },
      ],
      access: {
        create: ({ req: { user } }) => user?.role === 'admin',
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
    {
      name: 'business',
      type: 'relationship',
      relationTo: 'businesses',
      admin: {
        condition: (data) => data.role === 'business_member',
      },
      access: {
        create: ({ req: { user } }) => user?.role === 'admin',
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
  ],
  timestamps: true,
}
