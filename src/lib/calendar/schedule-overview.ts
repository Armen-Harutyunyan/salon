import { DateTime } from 'luxon'
import type { Payload } from 'payload'

import { formatTimeLabel, getDateInSalonZone, isValidDateInput } from '@/lib/booking/time'
import {
  formatWeeklyScheduleLabel,
  getMasterWorkingInterval,
  getWeekdayLabel,
  hydrateMasterWeeklySchedule,
  type WeekdayValue,
  weekdayOrder,
} from '@/lib/booking/weekly-schedule'
import { getSalonTimezone } from '@/lib/env'
import { relationToId } from '@/lib/relations'
import type { Booking, Master, ScheduleException } from '@/payload-types'

export type ScheduleOverviewBooking = {
  clientName: string
  endLabel: string
  id: string
  serviceTitle: string
  source: string
  startLabel: string
  status: string
}

export type ScheduleOverviewException = {
  id: string
  label: string
  reason: string
  type: string
}

export type ScheduleOverviewDay = {
  date: string
  isToday: boolean
  label: string
  shortLabel: string
  weekday: WeekdayValue
}

export type ScheduleOverviewCell = {
  bookings: ScheduleOverviewBooking[]
  date: string
  exceptions: ScheduleOverviewException[]
  hasDayOff: boolean
  isWorkingDay: boolean
  weekday: WeekdayValue
  workingHoursLabel: null | string
}

export type ScheduleOverviewMasterRow = {
  days: ScheduleOverviewCell[]
  id: string
  name: string
  specialty: null | string
  weeklySummary: string
}

export type ScheduleOverviewData = {
  anchorDate: string
  exceptionCount: number
  masters: ScheduleOverviewMasterRow[]
  masterCount: number
  rangeLabel: string
  todayBookingsCount: number
  totalBookings: number
  weekDays: ScheduleOverviewDay[]
}

const statusLabelMap: Record<string, string> = {
  cancelled: 'Cancelled',
  completed: 'Completed',
  confirmed: 'Confirmed',
  'no-show': 'No Show',
  pending: 'Pending',
}

const exceptionTypeLabelMap: Record<string, string> = {
  blocked: 'Blocked',
  break: 'Break',
  'day-off': 'Day off',
}

function getWeekStart(date: string) {
  return getDateInSalonZone(date).startOf('week')
}

function buildWeekDays(anchorDate: string) {
  const weekStart = getWeekStart(anchorDate)
  const today = getDateInSalonZone().toISODate()

  return weekdayOrder.map((weekday, index) => {
    const date = weekStart.plus({ days: index }).toISODate() || ''

    return {
      date,
      isToday: date === today,
      label: weekStart.plus({ days: index }).toFormat('dd LLL'),
      shortLabel: getWeekdayLabel(weekday),
      weekday,
    }
  })
}

function getWeekRange(anchorDate: string) {
  const weekStart = getWeekStart(anchorDate)
  const weekEnd = weekStart.plus({ days: 7 })

  return {
    weekEnd,
    weekEndISO: weekEnd.toUTC().toISO(),
    weekStart,
    weekStartISO: weekStart.toUTC().toISO(),
  }
}

function toBookingCardItem(booking: Booking): ScheduleOverviewBooking {
  const serviceTitle =
    typeof booking.service === 'object' && booking.service ? booking.service.title : 'Service'

  return {
    clientName: booking.clientName,
    endLabel: formatTimeLabel(booking.endsAt),
    id: booking.id,
    serviceTitle,
    source: booking.source,
    startLabel: formatTimeLabel(booking.startsAt),
    status: statusLabelMap[booking.status] || booking.status,
  }
}

function toExceptionCardItem(exception: ScheduleException): ScheduleOverviewException {
  const timeLabel =
    exception.type === 'day-off' || !(exception.startTime && exception.endTime)
      ? exceptionTypeLabelMap[exception.type] || exception.type
      : `${exceptionTypeLabelMap[exception.type] || exception.type} ${exception.startTime}-${exception.endTime}`

  return {
    id: exception.id,
    label: timeLabel,
    reason: exception.reason,
    type: exception.type,
  }
}

function getBookingDate(booking: Booking) {
  return (
    DateTime.fromISO(booking.startsAt, { zone: 'utc' }).setZone(getSalonTimezone()).toISODate() ||
    ''
  )
}

function normalizeAnchorDate(date?: string) {
  if (date && isValidDateInput(date)) {
    return date
  }

  return getDateInSalonZone().toISODate() || ''
}

export async function getScheduleOverview(payload: Payload, input?: { date?: string }) {
  const anchorDate = normalizeAnchorDate(input?.date)
  const weekDays = buildWeekDays(anchorDate)
  const { weekEndISO, weekStartISO } = getWeekRange(anchorDate)

  const [mastersResult, bookingsResult, exceptionsResult] = await Promise.all([
    payload.find({
      collection: 'masters',
      depth: 0,
      limit: 100,
      overrideAccess: true,
      sort: 'name',
      where: {
        isActive: {
          equals: true,
        },
      },
    }),
    payload.find({
      collection: 'bookings',
      depth: 1,
      limit: 300,
      overrideAccess: true,
      sort: 'startsAt',
      where: {
        and: [
          {
            startsAt: {
              less_than: weekEndISO,
            },
          },
          {
            endsAt: {
              greater_than: weekStartISO,
            },
          },
        ],
      },
    }),
    payload.find({
      collection: 'schedule-exceptions',
      depth: 0,
      limit: 300,
      overrideAccess: true,
      sort: 'date',
      where: {
        and: [
          {
            date: {
              greater_than_equal: weekStartISO,
            },
          },
          {
            date: {
              less_than: weekEndISO,
            },
          },
        ],
      },
    }),
  ])

  const masters = await Promise.all(
    (mastersResult.docs as Master[]).map((master) => hydrateMasterWeeklySchedule(payload, master)),
  )
  const bookings = bookingsResult.docs as Booking[]
  const exceptions = exceptionsResult.docs as ScheduleException[]

  const bookingsByCell = new Map<string, ScheduleOverviewBooking[]>()
  const exceptionsByCell = new Map<string, ScheduleOverviewException[]>()

  for (const booking of bookings) {
    const masterId = relationToId(booking.master)
    const date = getBookingDate(booking)

    if (!(masterId && date)) {
      continue
    }

    const key = `${masterId}:${date}`
    const existing = bookingsByCell.get(key) || []
    existing.push(toBookingCardItem(booking))
    bookingsByCell.set(key, existing)
  }

  for (const exception of exceptions) {
    const masterId = relationToId(exception.master)
    const date =
      DateTime.fromISO(exception.date, { zone: 'utc' }).setZone(getSalonTimezone()).toISODate() ||
      ''

    if (!(masterId && date)) {
      continue
    }

    const key = `${masterId}:${date}`
    const existing = exceptionsByCell.get(key) || []
    existing.push(toExceptionCardItem(exception))
    exceptionsByCell.set(key, existing)
  }

  const masterRows: ScheduleOverviewMasterRow[] = masters.map((master) => {
    const days = weekDays.map((day) => {
      const workingInterval = getMasterWorkingInterval(master, day.weekday)
      const key = `${master.id}:${day.date}`
      const cellExceptions = exceptionsByCell.get(key) || []

      return {
        bookings: bookingsByCell.get(key) || [],
        date: day.date,
        exceptions: cellExceptions,
        hasDayOff: cellExceptions.some((item) => item.type === 'day-off'),
        isWorkingDay: Boolean(workingInterval),
        weekday: day.weekday,
        workingHoursLabel: workingInterval
          ? `${workingInterval.startTime}-${workingInterval.endTime}`
          : null,
      }
    })

    return {
      days,
      id: master.id,
      name: master.name,
      specialty: master.specialty || null,
      weeklySummary: formatWeeklyScheduleLabel(master) || 'Schedule is not configured yet',
    }
  })

  const todayDate = getDateInSalonZone().toISODate() || ''
  const todayBookingsCount = bookings.filter(
    (booking) => getBookingDate(booking) === todayDate,
  ).length
  const weekStart = getWeekStart(anchorDate)

  return {
    anchorDate,
    exceptionCount: exceptions.length,
    masterCount: masterRows.length,
    masters: masterRows,
    rangeLabel: `${weekStart.toFormat('dd LLL')} - ${weekStart.plus({ days: 6 }).toFormat('dd LLL')}`,
    todayBookingsCount,
    totalBookings: bookings.length,
    weekDays,
  } satisfies ScheduleOverviewData
}
