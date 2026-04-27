import { NextResponse } from 'next/server'

import { bookingToPublicItem, getBookingById, updateBookingStatus } from '@/lib/booking/slot-engine'
import { getPayloadClient } from '@/lib/payload'
import { relationToId } from '@/lib/relations'
import { verifyStaffToken } from '@/lib/staff-token'
import {
  buildClientKeyboard,
  buildStaffKeyboard,
  formatBookingSummary,
  sendTelegramMessage,
} from '@/lib/telegram'
import type { Booking } from '@/payload-types'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

type StaffBookingStatusBody = {
  status?: Booking['status']
  token?: string
}

const allowedStatuses: Booking['status'][] = ['cancelled', 'completed', 'confirmed', 'no-show']

export async function PATCH(request: Request, context: RouteContext) {
  const body = (await request.json()) as StaffBookingStatusBody
  const token = verifyStaffToken(body.token)

  if (!token) {
    return NextResponse.json({ error: 'Staff token-ը անվավեր է' }, { status: 401 })
  }

  if (!(body.status && allowedStatuses.includes(body.status))) {
    return NextResponse.json({ error: 'Կարգավիճակը անվավեր է' }, { status: 400 })
  }

  const { id } = await context.params
  const payload = await getPayloadClient()
  const booking = await getBookingById(payload, id)

  if (relationToId(booking.master) !== token.masterId) {
    return NextResponse.json(
      { error: 'Այս ամրագրումը հասանելի չէ տվյալ մասնագետին' },
      { status: 403 },
    )
  }

  const updatedBooking = await updateBookingStatus({
    bookingId: id,
    payload,
    status: body.status,
  })

  await Promise.allSettled([
    ...(updatedBooking.telegramUserId
      ? [
          sendTelegramMessage({
            chatId: updatedBooking.telegramUserId,
            replyMarkup: buildClientKeyboard(),
            text: `Ամրագրման կարգավիճակը փոխվեց։\n${formatBookingSummary(updatedBooking)}`,
          }),
        ]
      : []),
    ...(typeof updatedBooking.master === 'object' &&
    updatedBooking.master &&
    updatedBooking.master.telegramUserId
      ? [
          sendTelegramMessage({
            chatId: updatedBooking.master.telegramUserId,
            replyMarkup: buildStaffKeyboard(updatedBooking.master),
            text: `Ամրագրման կարգավիճակը թարմացվեց՝ ${updatedBooking.clientName}\n${formatBookingSummary(updatedBooking)}`,
          }),
        ]
      : []),
  ])

  return NextResponse.json({ booking: bookingToPublicItem(updatedBooking) })
}
