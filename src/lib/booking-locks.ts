import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import type { Payload } from 'payload'

import { relationToId } from './relations'

const lockCollectionName = 'booking_locks'
const ensuredConnections = new WeakSet<object>()

type BookingLockable = {
  endsAt: string
  id: string
  master: null | string | { id?: string | null }
  startsAt: string
  status: string
}

function getLockCollection(payload: Payload) {
  const database = payload.db.connection.db

  if (!database) {
    throw new Error('Չհաջողվեց միանալ ամրագրումների պահեստին')
  }

  return database.collection(lockCollectionName)
}

async function ensureBookingLockIndexes(payload: Payload) {
  const connection = payload.db.connection

  if (ensuredConnections.has(connection)) {
    return
  }

  const collection = getLockCollection(payload)

  await collection.createIndex(
    {
      masterId: 1,
      minuteKey: 1,
    },
    {
      name: 'unique_master_minute_key',
      unique: true,
    },
  )

  await collection.createIndex({ bookingId: 1 }, { name: 'booking_id_lookup' })
  await collection.createIndex({ reservationId: 1 }, { name: 'reservation_id_lookup' })
  ensuredConnections.add(connection)
}

function buildMinuteKeys(startISO: string, endISO: string) {
  const start = DateTime.fromISO(startISO, { zone: 'utc' }).startOf('minute')
  const end = DateTime.fromISO(endISO, { zone: 'utc' })

  if (!(start.isValid && end.isValid && end > start)) {
    throw new Error('Ամրագրման միջակայքը անվավեր է')
  }

  const minuteKeys: number[] = []

  for (let cursor = start; cursor < end; cursor = cursor.plus({ minutes: 1 })) {
    minuteKeys.push(cursor.toMillis())
  }

  return minuteKeys
}

function isDuplicateKeyError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const errorWithCode = error as {
    code?: number
    writeErrors?: Array<{
      code?: number
    }>
  }

  return (
    errorWithCode.code === 11000 ||
    Boolean(errorWithCode.writeErrors?.some((item) => item.code === 11000))
  )
}

export function shouldBookingBlockSchedule(status: string) {
  return ['confirmed', 'pending'].includes(status)
}

export async function reserveBookingWindow(args: {
  endISO: string
  masterId: string
  payload: Payload
  reservationId?: string
  startISO: string
}) {
  const { endISO, masterId, payload, startISO } = args
  const reservationId = args.reservationId || randomUUID()

  await ensureBookingLockIndexes(payload)

  const minuteKeys = buildMinuteKeys(startISO, endISO)
  const collection = getLockCollection(payload)

  try {
    await collection.insertMany(
      minuteKeys.map((minuteKey) => ({
        bookingId: null,
        createdAt: new Date(),
        masterId,
        minuteKey,
        reservationId,
      })),
      { ordered: true },
    )

    return reservationId
  } catch (error) {
    await collection.deleteMany({ reservationId })

    if (isDuplicateKeyError(error)) {
      throw new Error('Ընտրված ժամը այլևս հասանելի չէ')
    }

    throw error
  }
}

export async function confirmBookingWindowReservation(args: {
  bookingId: string
  payload: Payload
  reservationId: string
}) {
  await ensureBookingLockIndexes(args.payload)

  await getLockCollection(args.payload).updateMany(
    { reservationId: args.reservationId },
    {
      $set: {
        bookingId: args.bookingId,
      },
      $unset: {
        reservationId: '',
      },
    },
  )
}

export async function releaseBookingWindowReservation(payload: Payload, reservationId: string) {
  await ensureBookingLockIndexes(payload)
  await getLockCollection(payload).deleteMany({ reservationId })
}

export async function releaseBookingLocks(payload: Payload, bookingId: string) {
  await ensureBookingLockIndexes(payload)
  await getLockCollection(payload).deleteMany({ bookingId })
}

export async function syncBookingLocksForBooking(payload: Payload, booking: BookingLockable) {
  await releaseBookingLocks(payload, booking.id)

  if (!shouldBookingBlockSchedule(booking.status)) {
    return
  }

  const masterId = relationToId(booking.master)

  if (!masterId) {
    throw new Error('Չհաջողվեց որոշել ամրագրման մասնագետին')
  }

  const reservationId = await reserveBookingWindow({
    endISO: booking.endsAt,
    masterId,
    payload,
    startISO: booking.startsAt,
  })

  await confirmBookingWindowReservation({
    bookingId: booking.id,
    payload,
    reservationId,
  })
}
