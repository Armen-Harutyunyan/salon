import { DateTime } from 'luxon'
import type { Payload, Where } from 'payload'
import { getSlotIntervalMinutes } from '@/lib/env'
import { relationsToIds, relationToId } from '@/lib/relations'
import type { Booking, Master, ScheduleException, Service, WorkingHour } from '@/payload-types'

import {
  combineDateAndTime,
  formatTimeLabel,
  getDayBounds,
  getWeekdayValue,
  isValidDateInput,
} from './time'
import type { SlotItem } from './types'

type TimeInterval = {
  end: DateTime
  start: DateTime
}

type SlotInput = {
  date: string
  masterId: string
  payload: Payload
  serviceId: string
}

function intervalsOverlap(left: TimeInterval, right: TimeInterval) {
  return left.start < right.end && right.start < left.end
}

function buildInterval(date: string, startTime: string, endTime: string) {
  const start = combineDateAndTime(date, startTime)
  const end = combineDateAndTime(date, endTime)

  if (end <= start) {
    return null
  }

  return { end, start }
}

async function getService(payload: Payload, serviceId: string) {
  const service = (await payload.findByID({
    collection: 'services',
    depth: 0,
    id: serviceId,
    overrideAccess: true,
  })) as Service

  if (!service?.isActive) {
    throw new Error('Service is not available')
  }

  return service
}

async function getMaster(payload: Payload, masterId: string) {
  const master = (await payload.findByID({
    collection: 'masters',
    depth: 0,
    id: masterId,
    overrideAccess: true,
  })) as Master

  if (!master?.isActive) {
    throw new Error('Master is not available')
  }

  return master
}

async function getWorkingHours(payload: Payload, masterId: string, weekday: string) {
  const result = await payload.find({
    collection: 'working-hours',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    where: {
      and: [
        {
          master: {
            equals: masterId,
          },
        },
        {
          weekday: {
            equals: weekday,
          },
        },
        {
          isActive: {
            equals: true,
          },
        },
      ],
    },
  })

  return result.docs as WorkingHour[]
}

async function getExceptions(payload: Payload, masterId: string, date: string) {
  const { endISO, startISO } = getDayBounds(date)

  const result = await payload.find({
    collection: 'schedule-exceptions',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    where: {
      and: [
        {
          master: {
            equals: masterId,
          },
        },
        {
          date: {
            greater_than_equal: startISO,
          },
        },
        {
          date: {
            less_than: endISO,
          },
        },
      ],
    },
  })

  return result.docs as ScheduleException[]
}

async function getBookings(payload: Payload, masterId: string, date: string) {
  const { endISO, startISO } = getDayBounds(date)

  const where: Where = {
    and: [
      {
        master: {
          equals: masterId,
        },
      },
      {
        startsAt: {
          less_than: endISO,
        },
      },
      {
        endsAt: {
          greater_than: startISO,
        },
      },
      {
        status: {
          not_equals: 'cancelled',
        },
      },
    ],
  }

  const result = await payload.find({
    collection: 'bookings',
    depth: 1,
    limit: 200,
    overrideAccess: true,
    where,
  })

  return result.docs as Booking[]
}

function bookingToInterval(booking: Booking): TimeInterval {
  return {
    end: DateTime.fromISO(booking.endsAt),
    start: DateTime.fromISO(booking.startsAt),
  }
}

function exceptionToInterval(exception: ScheduleException, date: string): TimeInterval | null {
  if (exception.type === 'day-off') {
    return {
      end: combineDateAndTime(date, '23:59').plus({ minutes: 1 }),
      start: combineDateAndTime(date, '00:00'),
    }
  }

  if (!(exception.startTime && exception.endTime)) {
    return null
  }

  return buildInterval(date, exception.startTime, exception.endTime)
}

function hoursToIntervals(workingHours: WorkingHour[], date: string) {
  return workingHours
    .map((item) => buildInterval(date, item.startTime, item.endTime))
    .filter((item): item is TimeInterval => Boolean(item))
}

function ensureMasterCanProvideService(master: Master, serviceId: string) {
  const allowedServiceIds = relationsToIds(master.services)

  if (!allowedServiceIds.includes(serviceId)) {
    throw new Error('Selected master does not provide this service')
  }
}

function slotToResponse(slot: TimeInterval): SlotItem {
  const start = slot.start.toUTC().toISO()
  const end = slot.end.toUTC().toISO()

  if (!(start && end)) {
    throw new Error('Failed to serialize slot interval')
  }

  return {
    end,
    endLabel: formatTimeLabel(end),
    label: `${formatTimeLabel(start)} - ${formatTimeLabel(end)}`,
    start,
    startLabel: formatTimeLabel(start),
  }
}

function getBusyIntervals(exceptions: ScheduleException[], bookings: Booking[], date: string) {
  const exceptionIntervals = exceptions
    .map((item) => exceptionToInterval(item, date))
    .filter((item): item is TimeInterval => Boolean(item))

  const bookingIntervals = bookings.map((item) => bookingToInterval(item))

  return [...exceptionIntervals, ...bookingIntervals]
}

export async function getAvailableSlots(input: SlotInput): Promise<SlotItem[]> {
  const { date, masterId, payload, serviceId } = input

  if (!isValidDateInput(date)) {
    throw new Error('Invalid date')
  }

  const [master, service] = await Promise.all([
    getMaster(payload, masterId),
    getService(payload, serviceId),
  ])

  ensureMasterCanProvideService(master, serviceId)

  const weekday = getWeekdayValue(date)

  const [workingHours, exceptions, bookings] = await Promise.all([
    getWorkingHours(payload, masterId, weekday),
    getExceptions(payload, masterId, date),
    getBookings(payload, masterId, date),
  ])

  const baseIntervals = hoursToIntervals(workingHours, date)
  const busyIntervals = getBusyIntervals(exceptions, bookings, date)
  const slotDuration = service.durationMinutes
  const slotStep = getSlotIntervalMinutes()
  const slots: SlotItem[] = []

  for (const base of baseIntervals) {
    let cursor = base.start

    while (cursor.plus({ minutes: slotDuration }) <= base.end) {
      const candidate = {
        end: cursor.plus({ minutes: slotDuration }),
        start: cursor,
      }

      const isBusy = busyIntervals.some((busyInterval) => intervalsOverlap(candidate, busyInterval))

      if (!isBusy) {
        slots.push(slotToResponse(candidate))
      }

      cursor = cursor.plus({ minutes: slotStep })
    }
  }

  return slots
}

export async function getMasterByTelegramUserId(payload: Payload, telegramUserId: string) {
  const result = await payload.find({
    collection: 'masters',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      telegramUserId: {
        equals: telegramUserId,
      },
    },
  })

  return (result.docs[0] as Master | undefined) || null
}

export async function getMasterTodayBookings(payload: Payload, masterId: string, date: string) {
  const bookings = await getBookings(payload, masterId, date)

  return bookings.sort((left, right) => left.startsAt.localeCompare(right.startsAt))
}

export async function createBookingRecord(args: {
  clientName: string
  clientPhone?: string
  date: string
  masterId: string
  notes?: string
  payload: Payload
  slotStart: string
  source: 'phone' | 'staff-bot' | 'telegram' | 'walk-in'
  status?: 'confirmed' | 'pending'
  telegramUserId?: string
  serviceId: string
}) {
  const {
    clientName,
    clientPhone,
    date,
    masterId,
    notes,
    payload,
    serviceId,
    slotStart,
    source,
    status,
    telegramUserId,
  } = args

  const slots = await getAvailableSlots({
    date,
    masterId,
    payload,
    serviceId,
  })

  const matchedSlot = slots.find((item) => item.start === slotStart)

  if (!matchedSlot) {
    throw new Error('Selected slot is no longer available')
  }

  const service = await getService(payload, serviceId)

  const createdBooking = await payload.create({
    collection: 'bookings',
    data: {
      clientName,
      clientPhone,
      durationMinutes: service.durationMinutes,
      endsAt: matchedSlot.end,
      master: masterId,
      notes,
      priceSnapshot: service.price,
      service: serviceId,
      source,
      startsAt: matchedSlot.start,
      status: status || (source === 'telegram' ? 'pending' : 'confirmed'),
      telegramUserId,
    },
    depth: 1,
    overrideAccess: true,
  })

  return createdBooking as Booking
}

export async function createBlockedInterval(args: {
  date: string
  endTime: string
  masterId: string
  payload: Payload
  reason: string
  startTime: string
  type: 'blocked' | 'break'
}) {
  const exceptionDate = combineDateAndTime(args.date, '00:00').toUTC().toISO()

  if (!exceptionDate) {
    throw new Error('Failed to serialize blocked interval date')
  }

  const created = await args.payload.create({
    collection: 'schedule-exceptions',
    data: {
      date: exceptionDate,
      endTime: args.endTime,
      master: args.masterId,
      reason: args.reason,
      startTime: args.startTime,
      type: args.type,
    },
    overrideAccess: true,
  })

  return created as ScheduleException
}

export function bookingToPublicItem(booking: Booking) {
  const masterName =
    typeof booking.master === 'object' && booking.master
      ? booking.master.name ||
        ((booking.master as unknown as { fullName?: string | null }).fullName ?? '') ||
        'Мастер'
      : relationToId(booking.master) || ''
  const serviceTitle =
    typeof booking.service === 'object' && booking.service
      ? booking.service.title
      : relationToId(booking.service) || ''

  return {
    clientName: booking.clientName,
    durationMinutes: booking.durationMinutes,
    endsAt: booking.endsAt,
    id: booking.id,
    masterName,
    serviceTitle,
    source: booking.source,
    startsAt: booking.startsAt,
    status: booking.status,
  }
}
