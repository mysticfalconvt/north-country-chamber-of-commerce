import type { GlobalConfig } from 'payload'

export const MembershipTiers: GlobalConfig = {
  slug: 'membershipTiers',
  label: 'Membership Tiers',
  access: {
    read: () => true, // Public can see tiers
    update: ({ req: { user } }) => {
      // Only admin and chamber_staff can edit tiers
      return user?.role === 'admin' || user?.role === 'chamber_staff'
    },
  },
  fields: [
    {
      name: 'tiers',
      type: 'array',
      label: 'Membership Tiers',
      required: true,
      minRows: 1,
      admin: {
        description: 'Define available membership levels and their benefits',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            description: 'Display name (e.g., "Basic", "Premium", "Featured")',
          },
        },
        {
          name: 'slug',
          type: 'text',
          required: true,
          unique: true,
          admin: {
            description:
              'Internal identifier (e.g., "basic", "premium", "featured"). Must match Business membershipTier values.',
          },
        },
        {
          name: 'description',
          type: 'richText',
          localized: true,
          admin: {
            description: 'Full description of benefits and features',
          },
        },
        {
          name: 'annualPrice',
          type: 'number',
          required: true,
          admin: {
            description: 'Annual membership price in dollars (e.g., 100 for $100)',
          },
        },
        {
          name: 'active',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Available for new sign-ups',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'displayBadge',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Show tier badge in business directory (for silver, gold, platinum)',
              },
            },
            {
              name: 'sortOrder',
              type: 'number',
              required: true,
              defaultValue: 99,
              admin: {
                description: 'Sort order for directory (1=highest/platinum, 2=gold, 3=silver, 4=bronze)',
              },
            },
          ],
        },
      ],
    },
  ],
  admin: {
    description: 'Configure membership levels, pricing, and benefits',
  },
}
