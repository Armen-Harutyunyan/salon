import { getAppBaseUrl, getTelegramBotToken } from '@/lib/env'
import type { Booking, Master } from '@/payload-types'
import { formatDateTimeLabel } from './booking/time'
import { createStaffToken } from './staff-token'

type TelegramReplyMarkup = Record<string, unknown>

type TelegramSendMessage = {
  chatId: number | string
  replyMarkup?: TelegramReplyMarkup
  text: string
}

async function callTelegram(method: string, body: Record<string, unknown>) {
  const token = getTelegramBotToken()

  if (!token) {
    return
  }

  await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })
}

export async function sendTelegramMessage(args: TelegramSendMessage) {
  await callTelegram('sendMessage', {
    chat_id: args.chatId,
    reply_markup: args.replyMarkup,
    text: args.text,
  })
}

export function buildClientKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: 'Открыть запись',
          web_app: {
            url: getAppBaseUrl(),
          },
        },
      ],
    ],
  }
}

export function buildStaffKeyboard(master: Master) {
  const telegramUserId = master.telegramUserId

  if (!telegramUserId) {
    return buildClientKeyboard()
  }

  const token = createStaffToken({
    exp: Date.now() + 1000 * 60 * 60 * 12,
    masterId: master.id,
    telegramUserId,
  })

  return {
    inline_keyboard: [
      [
        {
          text: 'Открыть запись',
          web_app: {
            url: getAppBaseUrl(),
          },
        },
      ],
      [
        {
          text: 'Открыть staff panel',
          web_app: {
            url: `${getAppBaseUrl()}/staff?token=${token}`,
          },
        },
      ],
    ],
  }
}

export function formatBookingsDigest(bookings: Booking[]) {
  if (!bookings.length) {
    return 'На сегодня активных записей нет.'
  }

  return [
    'Записи на сегодня:',
    ...bookings.map((booking) => {
      const serviceTitle =
        typeof booking.service === 'object' && booking.service ? booking.service.title : 'Услуга'

      return `• ${formatDateTimeLabel(booking.startsAt)} — ${booking.clientName} (${serviceTitle})`
    }),
  ].join('\n')
}
