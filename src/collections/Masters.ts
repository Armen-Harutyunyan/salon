import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { publicRead } from '@/access/publicRead'

export const Masters: CollectionConfig = {
  slug: 'masters',
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: publicRead,
    update: isAdmin,
  },
  admin: {
    useAsTitle: 'name',
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
  ],
}
