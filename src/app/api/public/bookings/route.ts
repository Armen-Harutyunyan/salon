import { NextResponse } from 'next/server'

import { expireStalePendingBookings } from '@/lib/booking/pending'
import { bookingToPublicItem, createBookingRecord } from '@/lib/booking/slot-engine'
import { getClientAddress } from '@/lib/client-address'
import {
  getPublicBookingRateLimitMaxRequests,
  getPublicMutationRateLimitWindowSeconds,
} from '@/lib/env'
import { getPayloadClient } from '@/lib/payload'
import { validatePhone } from '@/lib/phone'
import { assertRateLimit } from '@/lib/request-throttle'
import {
  buildClientKeyboard,
  buildStaffKeyboard,
  formatBookingSummary,
  sendTelegramMessage,
} from '@/lib/telegram'
import { readTelegramInitDataFromHeaders, verifyTelegramMiniAppData } from '@/lib/telegram-mini-app'
import type { Master } from '@/payload-types'

type CreateBookingBody = {
  clientName?: string
  clientPhone?: string
  date?: string
  masterId?: string
  notes?: string
  serviceId?: string
  slotStart?: string
  telegramInitData?: string
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateBookingBody

  if (!(body.clientName && body.date && body.masterId && body.serviceId && body.slotStart)) {
    return NextResponse.json(
      { error: 'Պարտադիր են clientName, date, masterId, serviceId և slotStart դաշտերը' },
      { status: 400 },
    )
  }

  try {
    const payload = await getPayloadClient()
    await expireStalePendingBookings(payload)
    const verifiedTelegram = verifyTelegramMiniAppData(
      body.telegramInitData || readTelegramInitDataFromHeaders(request.headers),
    )
    const normalizedPhone = validatePhone(body.clientPhone)
    const clientKey = verifiedTelegram?.user?.id
      ? `tg:${verifiedTelegram.user.id}`
      : `ip:${getClientAddress(request.headers)}`

    await assertRateLimit({
      key: `public-booking:${clientKey}`,
      limit: getPublicBookingRateLimitMaxRequests(),
      payload,
      windowSeconds: getPublicMutationRateLimitWindowSeconds(),
    })

    if (!(normalizedPhone || verifiedTelegram?.user?.id)) {
      return NextResponse.json(
        { error: 'Պետք է տրամադրել վավեր հեռախոսահամար կամ բացել Mini App-ը Telegram-ից' },
        { status: 400 },
      )
    }

    const booking = await createBookingRecord({
      clientName: body.clientName,
      clientPhone: normalizedPhone,
      date: body.date,
      masterId: body.masterId,
      notes: body.notes,
      payload,
      serviceId: body.serviceId,
      slotStart: body.slotStart,
      source: 'telegram',
      status: 'pending',
      telegramUserId: verifiedTelegram?.user?.id ? String(verifiedTelegram.user.id) : undefined,
    })

    await Promise.allSettled([
      ...(verifiedTelegram?.user?.id
        ? [
            sendTelegramMessage({
              chatId: verifiedTelegram.user.id,
              replyMarkup: buildClientKeyboard(),
              text: `Ամրագրումը ընդունվեց։\n${formatBookingSummary(booking)}`,
            }),
          ]
        : []),
      ...((typeof booking.master === 'object' &&
      booking.master &&
      booking.master.telegramUserId &&
      !Array.isArray(booking.master)
        ? [
            sendTelegramMessage({
              chatId: booking.master.telegramUserId,
              replyMarkup: buildStaffKeyboard(booking.master as Master),
              text: `Նոր առցանց ամրագրում՝ ${booking.clientName}\n${formatBookingSummary(booking)}`,
            }),
          ]
        : []) as Promise<boolean>[]),
    ])

    return NextResponse.json({ booking: bookingToPublicItem(booking) }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Չհաջողվեց ստեղծել ամրագրումը',
      },
      { status: 400 },
    )
  }
}
