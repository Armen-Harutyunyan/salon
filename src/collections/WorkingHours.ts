import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { weekdays } from '@/constants/booking'
import { ensureValidTimeRange } from '@/lib/booking/validation'

export const WorkingHours: CollectionConfig = {
  slug: 'working-hours',
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  admin: {
    hidden: true,
    useAsTitle: 'weekday',
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.startTime && data?.endTime) {
          ensureValidTimeRange(data.startTime, data.endTime, 'Աշխատանքային ժամերը անվավեր են')
        }

        return data
      },
    ],
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
