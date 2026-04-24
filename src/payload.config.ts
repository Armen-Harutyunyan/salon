import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Bookings } from './collections/Bookings'
import { Masters } from './collections/Masters'
import { Media } from './collections/Media'
import { ScheduleExceptions } from './collections/ScheduleExceptions'
import { Services } from './collections/Services'
import { Users } from './collections/Users'
import { WorkingHours } from './collections/WorkingHours'
import { getDatabaseUrl } from './lib/env'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const blobToken = process.env.BLOB_READ_WRITE_TOKEN

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Services, Masters, WorkingHours, ScheduleExceptions, Bookings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: getDatabaseUrl(),
  }),
  sharp,
  plugins: [
    vercelBlobStorage({
      clientUploads: true,
      collections: {
        media: true,
      },
      enabled: Boolean(blobToken),
      token: blobToken || '',
    }),
  ],
})
