import { DateTime } from 'luxon'
import type { Payload } from 'payload'

import { getPendingBookingHoldMinutes } from '@/lib/env'
import type { Booking } from '@/payload-types'

import { updateBookingStatus } from './slot-engine'

export async function expireStalePendingBookings(payload: Payload) {
  const holdMinutes = getPendingBookingHoldMinutes()

  if (holdMinutes <= 0) {
    return 0
  }

  const thresholdISO = DateTime.utc().minus({ minutes: holdMinutes }).toISO()
  const nowISO = DateTime.utc().toISO()

  if (!(thresholdISO && nowISO)) {
    return 0
  }

  const result = await payload.find({
    collection: 'bookings',
    depth: 0,
    limit: 200,
    overrideAccess: true,
    where: {
      and: [
        {
          status: {
            equals: 'pending',
          },
        },
        {
          or: [
            {
              createdAt: {
                less_than_equal: thresholdISO,
              },
            },
            {
              startsAt: {
                less_than_equal: nowISO,
              },
            },
          ],
        },
      ],
    },
  })

  let expiredCount = 0

  for (const doc of result.docs as Booking[]) {
    await updateBookingStatus({
      bookingId: doc.id,
      payload,
      status: 'cancelled',
    })
    expiredCount += 1
  }

  return expiredCount
}
