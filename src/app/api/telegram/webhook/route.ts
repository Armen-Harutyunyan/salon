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
        ? `Բարև, ${master.name}։ Բացիր աշխատակազմի վահանակը՝ ձեռքով ամրագրումների, արգելափակումների և այսօրվա հաճախորդների ցուցակի համար։`
        : 'Բացիր Mini App-ը և ընտրիր մասնագետին, ծառայությունը և ամրագրման ժամը։',
    })

    return NextResponse.json({ ok: true })
  }

  if (master && ['мои записи', 'իմ ամրագրումները'].includes(text.toLowerCase())) {
    const bookings = await getMasterTodayBookings(payload, master.id, todayDateString())

    await sendTelegramMessage({
      chatId: message.chat.id,
      replyMarkup: buildStaffKeyboard(master),
      text: formatBookingsDigest(bookings),
    })

    return NextResponse.json({ ok: true })
  }

  if (
    master &&
    ['новая запись', 'блок времени', 'նոր ամրագրում', 'ժամի բլոկ'].includes(text.toLowerCase())
  ) {
    await sendTelegramMessage({
      chatId: message.chat.id,
      replyMarkup: buildStaffKeyboard(master),
      text: 'Բացիր աշխատակազմի վահանակը ներքևի կոճակով և ստեղծիր ձեռքով ամրագրում կամ արգելափակիր ժամահատվածը։',
    })

    return NextResponse.json({ ok: true })
  }

  if (!master) {
    await sendTelegramMessage({
      chatId: message.chat.id,
      replyMarkup: buildClientKeyboard(),
      text: 'Ամրագրման համար օգտագործիր ներքևի Mini App կոճակը։',
    })
  }

  return NextResponse.json({ ok: true })
}
