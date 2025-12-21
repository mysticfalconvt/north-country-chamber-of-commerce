import type { CollectionConfig } from 'payload'

import { chamberStaffOrAdmin } from '../../access/chamberStaffOrAdmin'
import { isAdminOrOwner } from '../../access/isAdminOrOwner'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { slugField } from 'payload'

export const Businesses: CollectionConfig = {
  slug: 'businesses',
  access: {
    create: chamberStaffOrAdmin,
    delete: chamberStaffOrAdmin,
    read: authenticatedOrPublished,
    update: isAdminOrOwner,
  },
  hooks: {},
  admin: {
    defaultColumns: ['name', 'category', 'membershipStatus', 'memberSince'],
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Business name (not localized)',
      },
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
      localized: true,
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'address',
          type: 'text',
        },
        {
          name: 'phone',
          type: 'text',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'email',
          type: 'email',
        },
        {
          name: 'website',
          type: 'text',
          admin: {
            description: 'Full URL including https://',
          },
        },
      ],
    },
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
    {
      type: 'row',
      fields: [
        {
          name: 'memberSince',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'monthOnly',
            },
          },
        },
        {
          name: 'featured',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Show on homepage',
          },
        },
      ],
    },
    {
      name: 'membershipStatus',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Membership status',
      },
    },
    slugField(),
  ],
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
    },
  },
}
