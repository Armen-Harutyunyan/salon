import { DateTime } from 'luxon'

import { isValidDateInput, isValidTimeInput, parseTimeToMinutes } from './time'

export function ensureValidDateInput(date: string, message = 'Ամսաթիվը անվավեր է') {
  if (!isValidDateInput(date)) {
    throw new Error(message)
  }
}

export function ensureValidTimeInput(time: string, message = 'Ժամը անվավեր է') {
  if (!isValidTimeInput(time)) {
    throw new Error(message)
  }
}

export function ensureValidTimeRange(
  startTime: string,
  endTime: string,
  message = 'Ժամային միջակայքը անվավեր է',
) {
  ensureValidTimeInput(startTime, message)
  ensureValidTimeInput(endTime, message)

  if (parseTimeToMinutes(endTime) <= parseTimeToMinutes(startTime)) {
    throw new Error(message)
  }
}

export function ensureValidIsoDateRange(
  startsAt: string,
  endsAt: string,
  message = 'Ամրագրման միջակայքը անվավեր է',
) {
  const start = DateTime.fromISO(startsAt)
  const end = DateTime.fromISO(endsAt)

  if (!(start.isValid && end.isValid && end > start)) {
    throw new Error(message)
  }
}
