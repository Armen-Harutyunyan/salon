import { DateTime } from 'luxon'

import { getSalonTimezone } from '@/lib/env'

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/

export function isValidDateInput(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
}

export function isValidTimeInput(time: string) {
  return timePattern.test(time)
}

export function parseTimeToMinutes(time: string) {
  const match = time.match(timePattern)

  if (!match) {
    throw new Error(`Invalid time format: ${time}`)
  }

  const hours = Number(match[1])
  const minutes = Number(match[2])

  return hours * 60 + minutes
}

export function getDateInSalonZone(date?: string) {
  const zone = getSalonTimezone()

  if (date) {
    return DateTime.fromISO(date, { zone }).startOf('day')
  }

  return DateTime.now().setZone(zone).startOf('day')
}

export function combineDateAndTime(date: string, time: string) {
  if (!isValidDateInput(date)) {
    throw new Error(`Invalid date input: ${date}`)
  }

  if (!isValidTimeInput(time)) {
    throw new Error(`Invalid time input: ${time}`)
  }

  const zone = getSalonTimezone()

  return DateTime.fromISO(`${date}T${time}`, { zone })
}

export function getWeekdayValue(date: string) {
  const weekday = getDateInSalonZone(date).weekday

  if (weekday === 1) {
    return 'monday'
  }

  if (weekday === 2) {
    return 'tuesday'
  }

  if (weekday === 3) {
    return 'wednesday'
  }

  if (weekday === 4) {
    return 'thursday'
  }

  if (weekday === 5) {
    return 'friday'
  }

  if (weekday === 6) {
    return 'saturday'
  }

  return 'sunday'
}

export function getDayBounds(date: string) {
  const start = getDateInSalonZone(date)
  const end = start.plus({ days: 1 })

  return {
    end,
    endISO: end.toUTC().toISO(),
    start,
    startISO: start.toUTC().toISO(),
  }
}

export function formatTimeLabel(isoDate: string) {
  return DateTime.fromISO(isoDate, { zone: 'utc' }).setZone(getSalonTimezone()).toFormat('HH:mm')
}

export function formatDateTimeLabel(isoDate: string) {
  return DateTime.fromISO(isoDate, { zone: 'utc' })
    .setZone(getSalonTimezone())
    .toFormat('dd.LL HH:mm')
}

export function todayDateString() {
  return getDateInSalonZone().toISODate() || ''
}
