import { DateTime } from 'luxon'
import type { Payload } from 'payload'

import { getBookingReminderLeadHours, getBookingReminderWindowMinutes } from '@/lib/env'
import type { Booking } from '@/payload-types'

import { buildClientKeyboard, formatBookingSummary, sendTelegramMessage } from '../telegram'

export function getBookingReminderWindow(args?: {
  leadHours?: number
  now?: DateTime
  windowMinutes?: number
}) {
  const now = args?.now || DateTime.utc()
  const leadHours = args?.leadHours || getBookingReminderLeadHours()
  const windowMinutes = args?.windowMinutes || getBookingReminderWindowMinutes()
  const windowStart = now.plus({ hours: leadHours })
  const windowEnd = windowStart.plus({ minutes: windowMinutes })

  return {
    windowEnd,
    windowEndISO: windowEnd.toISO(),
    windowStart,
    windowStartISO: windowStart.toISO(),
  }
}

export async function sendUpcomingBookingReminders(payload: Payload) {
  const { windowEndISO, windowStartISO } = getBookingReminderWindow()

  if (!(windowStartISO && windowEndISO)) {
    return {
      found: 0,
      sent: 0,
    }
  }

  const result = await payload.find({
    collection: 'bookings',
    depth: 1,
    limit: 100,
    overrideAccess: true,
    sort: 'startsAt',
    where: {
      and: [
        {
          status: {
            in: ['pending', 'confirmed'],
          },
        },
        {
          startsAt: {
            greater_than_equal: windowStartISO,
          },
        },
        {
          startsAt: {
            less_than: windowEndISO,
          },
        },
        {
          telegramUserId: {
            exists: true,
          },
        },
        {
          reminderSentAt: {
            exists: false,
          },
        },
      ],
    },
  })

  let sent = 0

  for (const booking of result.docs as Booking[]) {
    if (!booking.telegramUserId) {
      continue
    }

    const delivered = await sendTelegramMessage({
      chatId: booking.telegramUserId,
      replyMarkup: buildClientKeyboard(),
      text: `Հիշեցում այցի մասին\n${formatBookingSummary(booking)}`,
    })

    if (!delivered) {
      continue
    }

    await payload.update({
      collection: 'bookings',
      context: {
        skipBookingLockSync: true,
      },
      data: {
        reminderSentAt: new Date().toISOString(),
      },
      id: booking.id,
      overrideAccess: true,
    })

    sent += 1
  }

  return {
    found: result.docs.length,
    sent,
  }
}
