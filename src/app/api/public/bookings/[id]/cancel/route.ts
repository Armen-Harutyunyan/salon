import { DateTime } from 'luxon'
import { NextResponse } from 'next/server'

import { expireStalePendingBookings } from '@/lib/booking/pending'
import { bookingToPublicItem, getBookingById, updateBookingStatus } from '@/lib/booking/slot-engine'
import {
  getPublicCancelRateLimitMaxRequests,
  getPublicMutationRateLimitWindowSeconds,
} from '@/lib/env'
import { getPayloadClient } from '@/lib/payload'
import { assertRateLimit } from '@/lib/request-throttle'
import {
  buildClientKeyboard,
  buildStaffKeyboard,
  formatBookingSummary,
  sendTelegramMessage,
} from '@/lib/telegram'
import { readTelegramInitDataFromHeaders, verifyTelegramMiniAppData } from '@/lib/telegram-mini-app'
import type { Master } from '@/payload-types'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const verifiedTelegram = verifyTelegramMiniAppData(
    readTelegramInitDataFromHeaders(request.headers),
  )

  if (!verifiedTelegram?.user?.id) {
    return NextResponse.json({ error: 'Telegram օգտատերը չի հաստատվել' }, { status: 401 })
  }

  const { id } = await context.params
  const payload = await getPayloadClient()
  await expireStalePendingBookings(payload)

  await assertRateLimit({
    key: `public-cancel:tg:${verifiedTelegram.user.id}`,
    limit: getPublicCancelRateLimitMaxRequests(),
    payload,
    windowSeconds: getPublicMutationRateLimitWindowSeconds(),
  })

  const booking = await getBookingById(payload, id)

  if (booking.telegramUserId !== String(verifiedTelegram.user.id)) {
    return NextResponse.json({ error: 'Այս ամրագրումը ձեզ չի պատկանում' }, { status: 403 })
  }

  if (!['pending', 'confirmed'].includes(booking.status)) {
    return NextResponse.json(
      { error: 'Այս ամրագրումը այլևս հնարավոր չէ չեղարկել' },
      { status: 400 },
    )
  }

  const startsAt = DateTime.fromISO(booking.startsAt, { zone: 'utc' })

  if (!(startsAt.isValid && startsAt > DateTime.utc())) {
    return NextResponse.json(
      { error: 'Անցած ժամի ամրագրումը հնարավոր չէ չեղարկել' },
      { status: 400 },
    )
  }

  const updatedBooking = await updateBookingStatus({
    bookingId: id,
    payload,
    status: 'cancelled',
  })

  await Promise.allSettled([
    sendTelegramMessage({
      chatId: verifiedTelegram.user.id,
      replyMarkup: buildClientKeyboard(),
      text: `Ամրագրումը չեղարկվեց։\n${formatBookingSummary(updatedBooking)}`,
    }),
    ...((typeof updatedBooking.master === 'object' &&
    updatedBooking.master &&
    updatedBooking.master.telegramUserId
      ? [
          sendTelegramMessage({
            chatId: updatedBooking.master.telegramUserId,
            replyMarkup: buildStaffKeyboard(updatedBooking.master as Master),
            text: `Հաճախորդը չեղարկել է ամրագրումը՝ ${updatedBooking.clientName}\n${formatBookingSummary(updatedBooking)}`,
          }),
        ]
      : []) as Promise<boolean>[]),
  ])

  return NextResponse.json({ booking: bookingToPublicItem(updatedBooking) })
}
