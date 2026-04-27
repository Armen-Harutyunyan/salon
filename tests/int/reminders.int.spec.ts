import { DateTime } from 'luxon'
import { describe, expect, it } from 'vitest'

import { getBookingReminderWindow } from '@/lib/booking/reminders'

describe('booking reminders', () => {
  it('builds a five-hour reminder window', () => {
    const now = DateTime.fromISO('2026-05-01T10:00:00Z')
    const result = getBookingReminderWindow({
      leadHours: 5,
      now,
      windowMinutes: 15,
    })

    expect(result.windowStart.toUTC().toISO()).toBe('2026-05-01T15:00:00.000Z')
    expect(result.windowEnd.toUTC().toISO()).toBe('2026-05-01T15:15:00.000Z')
  })
})
