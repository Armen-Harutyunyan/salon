import { DateTime } from 'luxon'
import type { Payload, RequiredDataFromCollectionSlug, Where } from 'payload'
import {
  confirmBookingWindowReservation,
  releaseBookingLocks,
  releaseBookingWindowReservation,
  reserveBookingWindow,
  shouldBookingBlockSchedule,
} from '@/lib/booking-locks'
import { getSlotIntervalMinutes } from '@/lib/env'
import { validatePhone } from '@/lib/phone'
import { relationsToIds, relationToId } from '@/lib/relations'
import type { Booking, Master, ScheduleException, Service } from '@/payload-types'
import { generateBookingReferenceCode } from './reference'
import {
  combineDateAndTime,
  formatTimeLabel,
  getDayBounds,
  getWeekdayValue,
  isValidDateInput,
} from './time'
import type { SlotItem } from './types'
import { ensureValidDateInput, ensureValidTimeRange } from './validation'
import {
  getMasterWorkingInterval,
  hydrateMasterWeeklySchedule,
  type WeekdayValue,
} from './weekly-schedule'

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
    throw new Error('Ծառայությունը հասանելի չէ')
  }

  return service
}

async function getMaster(payload: Payload, masterId: string) {
  const rawMaster = (await payload.findByID({
    collection: 'masters',
    depth: 0,
    id: masterId,
    overrideAccess: true,
  })) as Master

  const master = await hydrateMasterWeeklySchedule(payload, rawMaster)

  if (!master?.isActive) {
    throw new Error('Մասնագետը հասանելի չէ')
  }

  return master
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

async function getBlockingBookings(payload: Payload, masterId: string, date: string) {
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
          in: ['pending', 'confirmed'],
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

async function getMasterDayBookings(payload: Payload, masterId: string, date: string) {
  const { endISO, startISO } = getDayBounds(date)

  const result = await payload.find({
    collection: 'bookings',
    depth: 1,
    limit: 200,
    overrideAccess: true,
    sort: 'startsAt',
    where: {
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
      ],
    },
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

function hoursToIntervals(master: Pick<Master, 'weeklySchedule'>, date: string, weekday: string) {
  const schedule = getMasterWorkingInterval(master, weekday as WeekdayValue)

  if (!schedule) {
    return []
  }

  const interval = buildInterval(date, schedule.startTime, schedule.endTime)

  return interval ? [interval] : []
}

function ensureMasterCanProvideService(master: Master, serviceId: string) {
  const allowedServiceIds = relationsToIds(master.services)

  if (!allowedServiceIds.includes(serviceId)) {
    throw new Error('Ընտրված մասնագետը չի մատուցում այս ծառայությունը')
  }
}

function slotToResponse(slot: TimeInterval): SlotItem {
  const start = slot.start.toUTC().toISO()
  const end = slot.end.toUTC().toISO()

  if (!(start && end)) {
    throw new Error('Չհաջողվեց ձևավորել ժամի միջակայքը')
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
    throw new Error('Ամսաթիվը անվավեր է')
  }

  const [master, service] = await Promise.all([
    getMaster(payload, masterId),
    getService(payload, serviceId),
  ])

  ensureMasterCanProvideService(master, serviceId)

  const weekday = getWeekdayValue(date)

  const [exceptions, bookings] = await Promise.all([
    getExceptions(payload, masterId, date),
    getBlockingBookings(payload, masterId, date),
  ])

  const baseIntervals = hoursToIntervals(master, date, weekday)
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
  const bookings = await getMasterDayBookings(payload, masterId, date)

  return bookings.sort((left, right) => left.startsAt.localeCompare(right.startsAt))
}

export async function getTelegramUserUpcomingBookings(payload: Payload, telegramUserId: string) {
  const nowISO = DateTime.utc().toISO()

  const result = await payload.find({
    collection: 'bookings',
    depth: 1,
    limit: 50,
    overrideAccess: true,
    sort: 'startsAt',
    where: {
      and: [
        {
          telegramUserId: {
            equals: telegramUserId,
          },
        },
        ...(nowISO
          ? [
              {
                endsAt: {
                  greater_than_equal: nowISO,
                },
              },
            ]
          : []),
      ],
    },
  })

  return result.docs as Booking[]
}

export async function getBookingById(payload: Payload, bookingId: string) {
  return (await payload.findByID({
    collection: 'bookings',
    depth: 1,
    id: bookingId,
    overrideAccess: true,
  })) as Booking
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

  ensureValidDateInput(date)
  const normalizedPhone = validatePhone(clientPhone)

  const slots = await getAvailableSlots({
    date,
    masterId,
    payload,
    serviceId,
  })

  const matchedSlot = slots.find((item) => item.start === slotStart)

  if (!matchedSlot) {
    throw new Error('Ընտրված ժամը այլևս հասանելի չէ')
  }

  const service = await getService(payload, serviceId)
  const reservationId = await reserveBookingWindow({
    endISO: matchedSlot.end,
    masterId,
    payload,
    startISO: matchedSlot.start,
  })
  const bookingData: RequiredDataFromCollectionSlug<'bookings'> = {
    clientName: clientName.trim(),
    clientPhone: normalizedPhone || undefined,
    durationMinutes: service.durationMinutes,
    endsAt: matchedSlot.end,
    master: masterId,
    notes: notes?.trim(),
    priceSnapshot: service.price,
    referenceCode: generateBookingReferenceCode(),
    service: serviceId,
    source,
    startsAt: matchedSlot.start,
    status: status || (source === 'telegram' ? 'pending' : 'confirmed'),
    telegramUserId,
  }

  try {
    const createdBooking = (await payload.create({
      collection: 'bookings',
      context: {
        skipBookingLockSync: true,
      },
      data: bookingData,
      depth: 1,
      overrideAccess: true,
    })) as Booking

    await confirmBookingWindowReservation({
      bookingId: createdBooking.id,
      payload,
      reservationId,
    })

    return createdBooking
  } catch (error) {
    await releaseBookingWindowReservation(payload, reservationId)
    throw error
  }
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
  ensureValidDateInput(args.date)
  ensureValidTimeRange(args.startTime, args.endTime, 'Արգելափակման ժամային միջակայքը անվավեր է')

  const exceptionDate = combineDateAndTime(args.date, '00:00').toUTC().toISO()

  if (!exceptionDate) {
    throw new Error('Չհաջողվեց ձևավորել արգելափակված ժամահատվածի ամսաթիվը')
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

export async function updateBookingStatus(args: {
  bookingId: string
  payload: Payload
  status: Booking['status']
}) {
  const { bookingId, payload, status } = args
  const currentBooking = await getBookingById(payload, bookingId)

  if (currentBooking.status === status) {
    return currentBooking
  }

  const updatedBooking = (await payload.update({
    collection: 'bookings',
    context: {
      skipBookingLockSync: true,
    },
    data: {
      status,
    },
    depth: 1,
    id: bookingId,
    overrideAccess: true,
  })) as Booking

  if (!shouldBookingBlockSchedule(status)) {
    await releaseBookingLocks(payload, bookingId)
  }

  return updatedBooking
}

export function bookingToPublicItem(booking: Booking) {
  const masterName =
    typeof booking.master === 'object' && booking.master
      ? booking.master.name ||
        ((booking.master as unknown as { fullName?: string | null }).fullName ?? '') ||
        'Մասնագետ'
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
    referenceCode: booking.referenceCode || null,
    serviceTitle,
    source: booking.source,
    startsAt: booking.startsAt,
    status: booking.status,
  }
}
