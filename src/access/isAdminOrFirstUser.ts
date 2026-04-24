import type { Access } from 'payload'

export const isAdminOrFirstUser: Access = async ({ req }) => {
  if (req.user) {
    return true
  }

  const existingUsers = await req.payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
  })

  return existingUsers.totalDocs === 0
}
