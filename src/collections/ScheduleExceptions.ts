import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { exceptionTypes } from '@/constants/booking'
import { ensureValidTimeRange } from '@/lib/booking/validation'

export const ScheduleExceptions: CollectionConfig = {
  slug: 'schedule-exceptions',
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  admin: {
    useAsTitle: 'reason',
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data?.type) {
          return data
        }

        if (data.type === 'day-off') {
          return data
        }

        if (!(data.startTime && data.endTime)) {
          throw new Error('Մասնակի օրվա բացառման համար պարտադիր են startTime և endTime դաշտերը')
        }

        ensureValidTimeRange(
          data.startTime,
          data.endTime,
          'Բացառության ժամային միջակայքը անվավեր է',
        )

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
      name: 'type',
      type: 'select',
      options: exceptionTypes,
      required: true,
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'startTime',
      type: 'text',
      admin: {
        description: 'Required for partial-day breaks or blocked intervals',
      },
    },
    {
      name: 'endTime',
      type: 'text',
      admin: {
        description: 'Required for partial-day breaks or blocked intervals',
      },
    },
    {
      name: 'reason',
      type: 'text',
      required: true,
    },
  ],
}
