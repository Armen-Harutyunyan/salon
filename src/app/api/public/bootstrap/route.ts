import { NextResponse } from 'next/server'

import { toPublicMasterItem, toPublicServiceItem } from '@/lib/booking/public-data'
import { getPayloadClient } from '@/lib/payload'
import type { Master, Service } from '@/payload-types'

export async function GET() {
  const payload = await getPayloadClient()

  const [servicesResult, mastersResult] = await Promise.all([
    payload.find({
      collection: 'services',
      depth: 0,
      limit: 100,
      where: {
        isActive: {
          equals: true,
        },
      },
    }),
    payload.find({
      collection: 'masters',
      depth: 1,
      limit: 100,
      where: {
        isActive: {
          equals: true,
        },
      },
    }),
  ])

  return NextResponse.json({
    masters: (mastersResult.docs as Master[]).map((master) => toPublicMasterItem(master)),
    services: (servicesResult.docs as Service[]).map((service) => toPublicServiceItem(service)),
  })
}
