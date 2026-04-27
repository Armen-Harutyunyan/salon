import { DateTime } from 'luxon'
import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { bookingSources, bookingStatuses } from '@/constants/booking'
import { generateBookingReferenceCode } from '@/lib/booking/reference'
import { ensureValidIsoDateRange } from '@/lib/booking/validation'
import { releaseBookingLocks, syncBookingLocksForBooking } from '@/lib/booking-locks'
import type { Booking } from '@/payload-types'

export const Bookings: CollectionConfig = {
  slug: 'bookings',
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  admin: {
    useAsTitle: 'clientName',
  },
  hooks: {
    afterChange: [
      async ({ context, doc, req }) => {
        if (context?.skipBookingLockSync) {
          return doc
        }

        await syncBookingLocksForBooking(req.payload, doc as unknown as Booking)
        return doc
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        await releaseBookingLocks(req.payload, String(doc.id))
        return doc
      },
    ],
    beforeValidate: [
      ({ data, operation }) => {
        if (!data) {
          return data
        }

        if (operation === 'create' && !data.referenceCode) {
          data.referenceCode = generateBookingReferenceCode()
        }

        if (typeof data.startsAt === 'string' && typeof data.endsAt === 'string') {
          ensureValidIsoDateRange(data.startsAt, data.endsAt)
        }

        if (data.status === 'completed' || data.status === 'no-show') {
          const startsAt =
            typeof data.startsAt === 'string'
              ? DateTime.fromISO(data.startsAt)
              : DateTime.invalid('')

          if (startsAt.isValid && startsAt > DateTime.now()) {
            throw new Error(
              'Completed կամ No Show կարգավիճակները կարելի է դնել միայն սկսված այցերի համար',
            )
          }
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'clientName',
      type: 'text',
      required: true,
    },
    {
      name: 'clientPhone',
      type: 'text',
    },
    {
      name: 'referenceCode',
      type: 'text',
      admin: {
        readOnly: true,
      },
      required: true,
    },
    {
      name: 'source',
      type: 'select',
      options: bookingSources,
      defaultValue: 'telegram',
      required: true,
      index: true,
    },
    {
      name: 'telegramUserId',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'master',
      type: 'relationship',
      relationTo: 'masters',
      required: true,
    },
    {
      name: 'service',
      type: 'relationship',
      relationTo: 'services',
      required: true,
    },
    {
      name: 'startsAt',
      type: 'date',
      required: true,
      index: true,
    },
    {
      name: 'endsAt',
      type: 'date',
      required: true,
      index: true,
    },
    {
      name: 'durationMinutes',
      type: 'number',
      required: true,
      min: 5,
    },
    {
      name: 'priceSnapshot',
      type: 'number',
      min: 0,
    },
    {
      name: 'status',
      type: 'select',
      options: bookingStatuses,
      defaultValue: 'pending',
      required: true,
      index: true,
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'reminderSentAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
  ],
}
