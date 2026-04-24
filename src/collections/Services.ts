import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { publicRead } from '@/access/publicRead'

export const Services: CollectionConfig = {
  slug: 'services',
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: publicRead,
    update: isAdmin,
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'durationMinutes',
      type: 'number',
      required: true,
      min: 5,
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      required: true,
    },
  ],
}
