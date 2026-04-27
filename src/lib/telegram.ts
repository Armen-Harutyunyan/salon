import { getAppBaseUrl, getTelegramBotToken } from '@/lib/env'
import type { Booking, Master } from '@/payload-types'
import { formatDateTimeLabel } from './booking/time'
import { relationToId } from './relations'
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
    return false
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!response.ok) {
    return false
  }

  const data = (await response.json()) as {
    ok?: boolean
  }

  return Boolean(data.ok)
}

export async function sendTelegramMessage(args: TelegramSendMessage) {
  return callTelegram('sendMessage', {
    chat_id: args.chatId,
    reply_markup: args.replyMarkup,
    text: args.text,
  })
}

function getServiceTitle(booking: Booking) {
  return typeof booking.service === 'object' && booking.service
    ? booking.service.title
    : 'Ծառայություն'
}

function getMasterName(booking: Booking) {
  if (typeof booking.master === 'object' && booking.master) {
    return booking.master.name || 'Մասնագետ'
  }

  return relationToId(booking.master) || 'Մասնագետ'
}

export function formatBookingStatusLabel(status: Booking['status']) {
  switch (status) {
    case 'pending':
      return 'սպասման մեջ'
    case 'confirmed':
      return 'հաստատված'
    case 'cancelled':
      return 'չեղարկված'
    case 'completed':
      return 'ավարտված'
    case 'no-show':
      return 'չի ներկայացել'
    default:
      return status
  }
}

export function formatBookingSummary(booking: Booking) {
  return [
    `Կոդ՝ ${booking.referenceCode || booking.id}`,
    `${formatDateTimeLabel(booking.startsAt)} • ${getServiceTitle(booking)}`,
    `Մասնագետ՝ ${getMasterName(booking)}`,
    `Կարգավիճակ՝ ${formatBookingStatusLabel(booking.status)}`,
  ].join('\n')
}

export function buildClientKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: 'Բացել ամրագրումը',
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
          text: 'Բացել ամրագրումը',
          web_app: {
            url: getAppBaseUrl(),
          },
        },
      ],
      [
        {
          text: 'Բացել աշխատակազմի վահանակը',
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
    return 'Այսօր ակտիվ ամրագրումներ չկան։'
  }

  return [
    'Այսօրվա ամրագրումները՝',
    ...bookings.map((booking) => {
      return `• ${formatDateTimeLabel(booking.startsAt)} — ${booking.clientName} (${getServiceTitle(booking)})`
    }),
  ].join('\n')
}
