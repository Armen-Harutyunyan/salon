import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { publicRead } from '@/access/publicRead'
import {
  buildWeeklyScheduleField,
  hasConfiguredWeeklySchedule,
  hydrateMasterWeeklySchedule,
  validateWeeklySchedule,
} from '@/lib/booking/weekly-schedule'
import type { Master } from '@/payload-types'

export const Masters: CollectionConfig = {
  slug: 'masters',
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: publicRead,
    update: isAdmin,
  },
  admin: {
    components: {
      views: {
        list: {
          actions: ['./components/admin/MastersCalendarLink#MastersCalendarLink'],
        },
      },
    },
    useAsTitle: 'name',
  },
  hooks: {
    afterRead: [
      async ({ doc, req }) => {
        const master = doc as Master

        if (!(master?.id && !hasConfiguredWeeklySchedule(master.weeklySchedule))) {
          return doc
        }

        return hydrateMasterWeeklySchedule(req.payload, master)
      },
    ],
    beforeValidate: [
      ({ data }) => {
        if (data?.weeklySchedule) {
          validateWeeklySchedule(data.weeklySchedule)
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      required: true,
    },
    {
      name: 'specialty',
      type: 'text',
    },
    {
      name: 'telegramUserId',
      type: 'text',
      unique: true,
      admin: {
        description: 'Telegram user ID of the master for staff bot access',
      },
    },
    {
      name: 'bio',
      type: 'textarea',
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'services',
      type: 'relationship',
      hasMany: true,
      relationTo: 'services',
      required: true,
    },
    buildWeeklyScheduleField(),
  ],
}
