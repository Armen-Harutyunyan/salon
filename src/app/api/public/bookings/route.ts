import { NextResponse } from 'next/server'

import { bookingToPublicItem, createBookingRecord } from '@/lib/booking/slot-engine'
import { getPayloadClient } from '@/lib/payload'

type CreateBookingBody = {
  clientName?: string
  clientPhone?: string
  date?: string
  masterId?: string
  notes?: string
  serviceId?: string
  slotStart?: string
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateBookingBody

  if (!(body.clientName && body.date && body.masterId && body.serviceId && body.slotStart)) {
    return NextResponse.json(
      { error: 'clientName, date, masterId, serviceId and slotStart are required' },
      { status: 400 },
    )
  }

  try {
    const payload = await getPayloadClient()
    const booking = await createBookingRecord({
      clientName: body.clientName,
      clientPhone: body.clientPhone,
      date: body.date,
      masterId: body.masterId,
      notes: body.notes,
      payload,
      serviceId: body.serviceId,
      slotStart: body.slotStart,
      source: 'telegram',
      status: 'pending',
    })

    return NextResponse.json({ booking: bookingToPublicItem(booking) }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create booking',
      },
      { status: 400 },
    )
  }
}
