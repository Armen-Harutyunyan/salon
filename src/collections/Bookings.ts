import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { bookingSources, bookingStatuses } from '@/constants/booking'

export const Bookings: CollectionConfig = {
  slug: 'bookings',
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  admin: {
    useAsTitle: 'clientName',
  },
  fields: [
    {
      name: 'clientName',
      type: 'text',
      required: true,
    },
    {
      name: 'clientPhone',
      type: 'text',
    },
    {
      name: 'source',
      type: 'select',
      options: bookingSources,
      defaultValue: 'telegram',
      required: true,
      index: true,
    },
    {
      name: 'telegramUserId',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'master',
      type: 'relationship',
      relationTo: 'masters',
      required: true,
    },
    {
      name: 'service',
      type: 'relationship',
      relationTo: 'services',
      required: true,
    },
    {
      name: 'startsAt',
      type: 'date',
      required: true,
      index: true,
    },
    {
      name: 'endsAt',
      type: 'date',
      required: true,
      index: true,
    },
    {
      name: 'durationMinutes',
      type: 'number',
      required: true,
      min: 5,
    },
    {
      name: 'priceSnapshot',
      type: 'number',
      min: 0,
    },
    {
      name: 'status',
      type: 'select',
      options: bookingStatuses,
      defaultValue: 'pending',
      required: true,
      index: true,
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
