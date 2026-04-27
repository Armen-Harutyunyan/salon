import { NextResponse } from 'next/server'

import { expireStalePendingBookings } from '@/lib/booking/pending'
import { bookingToPublicItem, getTelegramUserUpcomingBookings } from '@/lib/booking/slot-engine'
import { getPayloadClient } from '@/lib/payload'
import {
  getTelegramDisplayName,
  readTelegramInitDataFromHeaders,
  verifyTelegramMiniAppData,
} from '@/lib/telegram-mini-app'

export async function GET(request: Request) {
  const verifiedTelegram = verifyTelegramMiniAppData(
    readTelegramInitDataFromHeaders(request.headers),
  )

  if (!verifiedTelegram?.user?.id) {
    return NextResponse.json({ error: 'Telegram օգտատերը չի հաստատվել' }, { status: 401 })
  }

  const payload = await getPayloadClient()
  await expireStalePendingBookings(payload)
  const bookings = await getTelegramUserUpcomingBookings(payload, String(verifiedTelegram.user.id))

  return NextResponse.json({
    bookings: bookings.map((booking) => bookingToPublicItem(booking)),
    user: {
      displayName: getTelegramDisplayName(verifiedTelegram.user),
      id: String(verifiedTelegram.user.id),
      username: verifiedTelegram.user.username || null,
    },
  })
}
