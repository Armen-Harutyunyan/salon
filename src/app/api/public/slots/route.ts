import { NextResponse } from 'next/server'

import { expireStalePendingBookings } from '@/lib/booking/pending'
import { getAvailableSlots } from '@/lib/booking/slot-engine'
import { getPayloadClient } from '@/lib/payload'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const masterId = searchParams.get('masterId')
  const serviceId = searchParams.get('serviceId')
  const date = searchParams.get('date')

  if (!(masterId && serviceId && date)) {
    return NextResponse.json(
      { error: 'Պարտադիր են masterId, serviceId և date դաշտերը' },
      { status: 400 },
    )
  }

  try {
    const payload = await getPayloadClient()
    await expireStalePendingBookings(payload)
    const slots = await getAvailableSlots({
      date,
      masterId,
      payload,
      serviceId,
    })

    return NextResponse.json({ slots })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Չհաջողվեց ստանալ ազատ ժամերը',
      },
      { status: 400 },
    )
  }
}
