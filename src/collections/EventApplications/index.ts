import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { chamberStaffOrAdmin } from '../../access/chamberStaffOrAdmin'
import { isAdminOrOwner } from '../../access/isAdminOrOwner'

export const EventApplications: CollectionConfig = {
  slug: 'event-applications',
  labels: {
    singular: 'Event Application',
    plural: 'Event Applications',
  },
  access: {
    create: authenticated,
    delete: chamberStaffOrAdmin,
    read: isAdminOrOwner,
    update: chamberStaffOrAdmin,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        // Auto-populate submission date on create
        if (operation === 'create' && !data.submittedDate) {
          data.submittedDate = new Date().toISOString()
        }
        return data
      },
    ],
  },
  admin: {
    defaultColumns: ['applicantName', 'event', 'category', 'status', 'submittedDate'],
    useAsTitle: 'applicantName',
  },
  fields: [
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'signature-events',
      required: true,
      admin: {
        description: 'Which signature event is this application for?',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'applicantName',
          type: 'text',
          required: true,
          admin: {
            description: 'Individual or business name',
          },
        },
        {
          name: 'applicantEmail',
          type: 'email',
          required: true,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'applicantPhone',
          type: 'text',
          required: true,
        },
        {
          name: 'business',
          type: 'relationship',
          relationTo: 'businesses',
          admin: {
            description: 'Link to member business (if applicable)',
          },
        },
      ],
    },
    {
      name: 'category',
      type: 'text',
      admin: {
        description: 'Entry category (e.g., "Hot Rod", "Chili", "Vendor")',
      },
    },
    {
      name: 'details',
      type: 'richText',
      required: true,
      admin: {
        description: 'Application details/questions',
      },
    },
    {
      name: 'attachments',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: {
        description: 'Supporting files (images, documents, etc.)',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'pending',
          options: [
            { label: 'Pending Review', value: 'pending' },
            { label: 'Approved', value: 'approved' },
            { label: 'Rejected', value: 'rejected' },
            { label: 'Waitlist', value: 'waitlist' },
          ],
          admin: {
            description: 'Application status',
          },
        },
        {
          name: 'submittedDate',
          type: 'date',
          admin: {
            description: 'Auto-populated on submission',
            readOnly: true,
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
      ],
    },
    {
      name: 'notes',
      type: 'richText',
      admin: {
        description: 'Internal chamber notes (not visible to applicant)',
        position: 'sidebar',
      },
    },
    {
      name: 'submittedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'User who submitted this application',
        position: 'sidebar',
      },
    },
  ],
}
