import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getMasterByTelegramUserId, getMasterTodayBookings } from '@/lib/booking/slot-engine'
import { todayDateString } from '@/lib/booking/time'
import { getTelegramWebhookSecret } from '@/lib/env'
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

function isAuthorizedWebhookRequest(request: Request) {
  const expectedSecret = getTelegramWebhookSecret()

  if (!expectedSecret) {
    return true
  }

  const receivedSecret = request.headers.get('x-telegram-bot-api-secret-token')?.trim() || ''
  const expectedBuffer = Buffer.from(expectedSecret)
  const receivedBuffer = Buffer.from(receivedSecret)

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  )
}

async function replyToStart(
  chatId: number,
  master: Awaited<ReturnType<typeof getMasterByTelegramUserId>>,
) {
  await sendTelegramMessage({
    chatId,
    replyMarkup: master ? buildStaffKeyboard(master) : buildClientKeyboard(),
    text: master
      ? `Բարև, ${master.name}։ Բացիր աշխատակազմի վահանակը՝ ձեռքով ամրագրումների, արգելափակումների և այսօրվա հաճախորդների ցուցակի համար։`
      : 'Բացիր Mini App-ը և ընտրիր մասնագետին, ծառայությունը և ամրագրման ժամը։',
  })
}

async function replyToMasterShortcut(
  chatId: number,
  master: NonNullable<Awaited<ReturnType<typeof getMasterByTelegramUserId>>>,
) {
  await sendTelegramMessage({
    chatId,
    replyMarkup: buildStaffKeyboard(master),
    text: 'Բացիր աշխատակազմի վահանակը ներքևի կոճակով և ստեղծիր ձեռքով ամրագրում կամ արգելափակիր ժամահատվածը։',
  })
}

async function replyWithTodayBookings(
  chatId: number,
  master: NonNullable<Awaited<ReturnType<typeof getMasterByTelegramUserId>>>,
) {
  const payload = await getPayloadClient()
  const bookings = await getMasterTodayBookings(payload, master.id, todayDateString())

  await sendTelegramMessage({
    chatId,
    replyMarkup: buildStaffKeyboard(master),
    text: formatBookingsDigest(bookings),
  })
}

export async function POST(request: Request) {
  if (!isAuthorizedWebhookRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
    await replyToStart(message.chat.id, master)
    return NextResponse.json({ ok: true })
  }

  if (master && ['мои записи', 'իմ ամրագրումները'].includes(text.toLowerCase())) {
    await replyWithTodayBookings(message.chat.id, master)
    return NextResponse.json({ ok: true })
  }

  if (
    master &&
    ['новая запись', 'блок времени', 'նոր ամրագրում', 'ժամի բլոկ'].includes(text.toLowerCase())
  ) {
    await replyToMasterShortcut(message.chat.id, master)
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
