import { NextResponse } from 'next/server'

import { bookingToPublicItem, getMasterTodayBookings } from '@/lib/booking/slot-engine'
import { todayDateString } from '@/lib/booking/time'
import { getPayloadClient } from '@/lib/payload'
import { relationsToIds } from '@/lib/relations'
import { verifyStaffToken } from '@/lib/staff-token'
import type { Master, Service } from '@/payload-types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = verifyStaffToken(searchParams.get('token'))

  if (!token) {
    return NextResponse.json({ error: 'Invalid staff token' }, { status: 401 })
  }

  const payload = await getPayloadClient()
  const [master, servicesResult, bookings] = await Promise.all([
    payload.findByID({
      collection: 'masters',
      depth: 0,
      id: token.masterId,
      overrideAccess: true,
    }) as Promise<Master>,
    payload.find({
      collection: 'services',
      depth: 0,
      limit: 100,
      overrideAccess: true,
      where: {
        isActive: {
          equals: true,
        },
      },
    }),
    getMasterTodayBookings(payload, token.masterId, todayDateString()),
  ])

  const allowedServiceIds = new Set(relationsToIds(master.services))
  const services = (servicesResult.docs as Service[])
    .filter((service) => allowedServiceIds.has(service.id))
    .map((service) => ({
      durationMinutes: service.durationMinutes,
      id: service.id,
      price: service.price,
      title: service.title,
    }))

  const fallbackName = ((master as unknown as { fullName?: string | null }).fullName || '').trim()
  const resolvedName = master.name?.trim() || fallbackName || 'Мастер'

  return NextResponse.json({
    bookings: bookings.map((booking) => bookingToPublicItem(booking)),
    master: {
      id: master.id,
      name: resolvedName,
      specialty: master.specialty || null,
      telegramUserId: master.telegramUserId || null,
    },
    services,
  })
}
