import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { weekdays } from '@/constants/booking'

export const WorkingHours: CollectionConfig = {
  slug: 'working-hours',
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  admin: {
    useAsTitle: 'weekday',
  },
  fields: [
    {
      name: 'master',
      type: 'relationship',
      relationTo: 'masters',
      required: true,
    },
    {
      name: 'weekday',
      type: 'select',
      options: weekdays,
      required: true,
    },
    {
      name: 'startTime',
      type: 'text',
      required: true,
      admin: {
        description: 'Format HH:MM, for example 09:00',
      },
    },
    {
      name: 'endTime',
      type: 'text',
      required: true,
      admin: {
        description: 'Format HH:MM, for example 18:30',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      required: true,
    },
  ],
}
