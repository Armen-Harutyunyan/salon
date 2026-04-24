import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { isAdminOrFirstUser } from '@/access/isAdminOrFirstUser'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    create: isAdminOrFirstUser,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'fullName',
      type: 'text',
    },
  ],
}
