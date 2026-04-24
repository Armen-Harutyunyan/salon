import { NextResponse } from 'next/server'

import { getAvailableSlots } from '@/lib/booking/slot-engine'
import { getPayloadClient } from '@/lib/payload'
import { verifyStaffToken } from '@/lib/staff-token'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = verifyStaffToken(searchParams.get('token'))
  const serviceId = searchParams.get('serviceId')
  const date = searchParams.get('date')

  if (!token) {
    return NextResponse.json({ error: 'Staff token-ը անվավեր է' }, { status: 401 })
  }

  if (!(serviceId && date)) {
    return NextResponse.json({ error: 'Պարտադիր են serviceId և date դաշտերը' }, { status: 400 })
  }

  try {
    const payload = await getPayloadClient()
    const slots = await getAvailableSlots({
      date,
      masterId: token.masterId,
      payload,
      serviceId,
    })

    return NextResponse.json({ slots })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Չհաջողվեց ստանալ staff ազատ ժամերը',
      },
      { status: 400 },
    )
  }
}
