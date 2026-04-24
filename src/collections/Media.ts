import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { publicRead } from '@/access/publicRead'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: publicRead,
    update: isAdmin,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    imageSizes: [
      {
        name: 'card',
        width: 640,
        height: 640,
      },
    ],
  },
}
