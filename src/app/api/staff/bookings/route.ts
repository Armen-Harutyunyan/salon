import { NextResponse } from 'next/server'

import {
  bookingToPublicItem,
  createBookingRecord,
  getMasterTodayBookings,
} from '@/lib/booking/slot-engine'
import { todayDateString } from '@/lib/booking/time'
import { getPayloadClient } from '@/lib/payload'
import { verifyStaffToken } from '@/lib/staff-token'

type StaffBookingBody = {
  clientName?: string
  clientPhone?: string
  date?: string
  notes?: string
  serviceId?: string
  slotStart?: string
  source?: 'phone' | 'staff-bot' | 'walk-in'
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = verifyStaffToken(searchParams.get('token'))
  const date = searchParams.get('date') || todayDateString()

  if (!token) {
    return NextResponse.json({ error: 'Invalid staff token' }, { status: 401 })
  }

  const payload = await getPayloadClient()
  const bookings = await getMasterTodayBookings(payload, token.masterId, date)

  return NextResponse.json({ bookings: bookings.map((booking) => bookingToPublicItem(booking)) })
}

export async function POST(request: Request) {
  const body = (await request.json()) as StaffBookingBody & { token?: string }
  const token = verifyStaffToken(body.token)

  if (!token) {
    return NextResponse.json({ error: 'Invalid staff token' }, { status: 401 })
  }

  if (!(body.clientName && body.date && body.serviceId && body.slotStart)) {
    return NextResponse.json(
      { error: 'clientName, date, serviceId and slotStart are required' },
      { status: 400 },
    )
  }

  try {
    const payload = await getPayloadClient()
    const booking = await createBookingRecord({
      clientName: body.clientName,
      clientPhone: body.clientPhone,
      date: body.date,
      masterId: token.masterId,
      notes: body.notes,
      payload,
      serviceId: body.serviceId,
      slotStart: body.slotStart,
      source: body.source || 'staff-bot',
      status: 'confirmed',
      telegramUserId: token.telegramUserId,
    })

    return NextResponse.json({ booking: bookingToPublicItem(booking) }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create staff booking',
      },
      { status: 400 },
    )
  }
}
