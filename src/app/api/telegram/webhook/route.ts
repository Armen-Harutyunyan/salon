import { NextResponse } from 'next/server'
import { getMasterByTelegramUserId, getMasterTodayBookings } from '@/lib/booking/slot-engine'
import { todayDateString } from '@/lib/booking/time'
import { getPayloadClient } from '@/lib/payload'
import {
  buildClientKeyboard,
  buildStaffKeyboard,
  formatBookingsDigest,
  sendTelegramMessage,
} from '@/lib/telegram'

type TelegramUpdate = {
  message?: {
    chat?: {
      id: number
    }
    from?: {
      id: number
    }
    text?: string
  }
}

export async function POST(request: Request) {
  const update = (await request.json()) as TelegramUpdate
  const message = update.message

  if (!(message?.chat?.id && message.from?.id)) {
    return NextResponse.json({ ok: true })
  }

  const payload = await getPayloadClient()
  const telegramUserId = String(message.from.id)
  const master = await getMasterByTelegramUserId(payload, telegramUserId)
  const text = (message.text || '').trim()

  if (text === '/start') {
    await sendTelegramMessage({
      chatId: message.chat.id,
      replyMarkup: master ? buildStaffKeyboard(master) : buildClientKeyboard(),
      text: master
        ? `Привет, ${master.name}. Открывай staff panel для ручных записей, блокировок и списка клиентов на сегодня.`
        : 'Открывай mini app и выбирай мастера, услугу и время записи.',
    })

    return NextResponse.json({ ok: true })
  }

  if (master && text.toLowerCase() === 'мои записи') {
    const bookings = await getMasterTodayBookings(payload, master.id, todayDateString())

    await sendTelegramMessage({
      chatId: message.chat.id,
      replyMarkup: buildStaffKeyboard(master),
      text: formatBookingsDigest(bookings),
    })

    return NextResponse.json({ ok: true })
  }

  if (master && (text.toLowerCase() === 'новая запись' || text.toLowerCase() === 'блок времени')) {
    await sendTelegramMessage({
      chatId: message.chat.id,
      replyMarkup: buildStaffKeyboard(master),
      text: 'Открой staff panel кнопкой ниже и создай ручную запись или заблокируй интервал.',
    })

    return NextResponse.json({ ok: true })
  }

  if (!master) {
    await sendTelegramMessage({
      chatId: message.chat.id,
      replyMarkup: buildClientKeyboard(),
      text: 'Для записи используй кнопку mini app ниже.',
    })
  }

  return NextResponse.json({ ok: true })
}
