import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'

import { expireStalePendingBookings } from '@/lib/booking/pending'
import { sendUpcomingBookingReminders } from '@/lib/booking/reminders'
import { getCronSecret } from '@/lib/env'
import { getPayloadClient } from '@/lib/payload'

function getProvidedSecret(request: Request) {
  const authHeader = request.headers.get('authorization')?.trim()
  const headerSecret = request.headers.get('x-cron-secret')?.trim()

  if (headerSecret) {
    return headerSecret
  }

  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim()
  }

  return ''
}

function isAuthorized(request: Request) {
  const expectedSecret = getCronSecret()

  if (!expectedSecret) {
    return false
  }

  const providedSecret = getProvidedSecret(request)
  const expectedBuffer = Buffer.from(expectedSecret)
  const providedBuffer = Buffer.from(providedSecret)

  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  )
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayloadClient()
  const expiredPending = await expireStalePendingBookings(payload)
  const reminders = await sendUpcomingBookingReminders(payload)

  return NextResponse.json({
    ok: true,
    reminders,
    expiredPending,
  })
}
