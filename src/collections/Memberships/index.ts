import type { CollectionConfig } from 'payload'

import { chamberStaffOrAdmin } from '../../access/chamberStaffOrAdmin'
import { isAdminOrOwner } from '../../access/isAdminOrOwner'
import { adminPanelAccess } from '../../access/adminPanelAccess'

export const Memberships: CollectionConfig = {
  slug: 'memberships',
  access: {
    admin: adminPanelAccess,
    create: chamberStaffOrAdmin, // Only staff can create memberships (or Stripe webhook)
    delete: ({ req: { user } }) => user?.role === 'admin', // Only admin can delete
    read: isAdminOrOwner, // Members can see their own memberships
    update: chamberStaffOrAdmin, // Staff can update (renewals, status changes)
  },
  admin: {
    defaultColumns: ['business', 'tier', 'paymentStatus', 'startDate', 'endDate'],
    useAsTitle: 'business',
    description: 'Track membership payments and renewal status',
  },
  fields: [
    {
      name: 'business',
      type: 'relationship',
      relationTo: 'businesses',
      required: true,
      hasMany: false,
      admin: {
        description: 'The business this membership belongs to',
      },
    },
    {
      name: 'tier',
      type: 'text',
      required: true,
      admin: {
        description: 'Membership tier slug (from MembershipTiers global)',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'amount',
          type: 'number',
          required: true,
          admin: {
            description: 'Annual membership dues amount (in dollars)',
          },
        },
        {
          name: 'paymentStatus',
          type: 'select',
          required: true,
          defaultValue: 'pending',
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Paid', value: 'paid' },
            { label: 'Overdue', value: 'overdue' },
            { label: 'Cancelled', value: 'cancelled' },
            { label: 'Refunded', value: 'refunded' },
          ],
          admin: {
            description: 'Current payment status',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          required: true,
          admin: {
            description: 'Membership period start date',
            date: {
              pickerAppearance: 'dayOnly',
            },
          },
        },
        {
          name: 'endDate',
          type: 'date',
          required: true,
          admin: {
            description: 'Membership expiration date',
            date: {
              pickerAppearance: 'dayOnly',
            },
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'autoRenew',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Automatic renewal via Stripe subscription',
          },
        },
        {
          name: 'paymentMethod',
          type: 'select',
          required: true,
          defaultValue: 'stripe',
          options: [
            { label: 'Stripe (Credit Card)', value: 'stripe' },
            { label: 'Check', value: 'check' },
            { label: 'Cash', value: 'cash' },
            { label: 'Complimentary', value: 'comp' },
          ],
          admin: {
            description: 'How this membership was paid',
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Stripe Integration',
      admin: {
        description: 'Stripe-related data (auto-populated by payment webhooks)',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'stripeCustomerId',
          type: 'text',
          admin: {
            description: 'Stripe Customer ID (cus_xxxxx)',
            readOnly: true,
          },
        },
        {
          name: 'stripeSubscriptionId',
          type: 'text',
          admin: {
            description: 'Stripe Subscription ID (sub_xxxxx) for recurring payments',
            readOnly: true,
          },
        },
        {
          name: 'stripeInvoiceId',
          type: 'text',
          admin: {
            description: 'Stripe Invoice ID (in_xxxxx)',
            readOnly: true,
          },
        },
        {
          name: 'invoiceUrl',
          type: 'text',
          admin: {
            description: 'Link to Stripe invoice/receipt',
            readOnly: true,
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Check Payment Details',
      admin: {
        description: 'Check payment tracking information',
        initCollapsed: true,
        condition: (data) => data.paymentMethod === 'check',
      },
      fields: [
        {
          name: 'checkNumber',
          type: 'text',
          admin: {
            description: 'Check number for reference',
          },
        },
        {
          name: 'checkDate',
          type: 'date',
          admin: {
            description: 'Date check was received',
            date: {
              pickerAppearance: 'dayOnly',
            },
          },
        },
      ],
    },
    {
      name: 'notes',
      type: 'richText',
      admin: {
        description: 'Internal notes (not visible to member)',
      },
    },
  ],
  // Disable the afterChange hook that was causing database deadlocks
  // TODO: Business membership fields should be updated via a scheduled job or manual sync
  // hooks: {
  //   afterChange: [...],
  // },
  timestamps: true,
}
