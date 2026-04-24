import { NextResponse } from 'next/server'

import { createBlockedInterval } from '@/lib/booking/slot-engine'
import { getPayloadClient } from '@/lib/payload'
import { verifyStaffToken } from '@/lib/staff-token'

type BlockBody = {
  date?: string
  endTime?: string
  reason?: string
  startTime?: string
  token?: string
  type?: 'blocked' | 'break'
}

export async function POST(request: Request) {
  const body = (await request.json()) as BlockBody
  const token = verifyStaffToken(body.token)

  if (!token) {
    return NextResponse.json({ error: 'Staff token-ը անվավեր է' }, { status: 401 })
  }

  if (!(body.date && body.startTime && body.endTime && body.reason && body.type)) {
    return NextResponse.json(
      { error: 'Պարտադիր են date, startTime, endTime, reason և type դաշտերը' },
      { status: 400 },
    )
  }

  try {
    const payload = await getPayloadClient()
    const block = await createBlockedInterval({
      date: body.date,
      endTime: body.endTime,
      masterId: token.masterId,
      payload,
      reason: body.reason,
      startTime: body.startTime,
      type: body.type,
    })

    return NextResponse.json({ block }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Չհաջողվեց ստեղծել արգելափակված ժամահատվածը',
      },
      { status: 400 },
    )
  }
}
