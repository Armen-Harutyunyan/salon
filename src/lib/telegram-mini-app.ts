import { createHmac, timingSafeEqual } from 'node:crypto'

import { getTelegramBotToken } from './env'

type TelegramMiniAppUser = {
  added_to_attachment_menu?: boolean
  allows_write_to_pm?: boolean
  first_name: string
  id: number
  is_premium?: boolean
  language_code?: string
  last_name?: string
  photo_url?: string
  username?: string
}

export type VerifiedTelegramMiniAppData = {
  authDate: number
  queryId: string | null
  raw: string
  startParam: string | null
  user: TelegramMiniAppUser | null
}

function parseJsonValue<T>(value: string | null) {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function buildDataCheckString(searchParams: URLSearchParams) {
  return [...searchParams.entries()]
    .filter(([key]) => key !== 'hash' && key !== 'signature')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
}

function isExpired(authDate: number, maxAgeSeconds: number) {
  const nowSeconds = Math.floor(Date.now() / 1000)
  return authDate <= 0 || nowSeconds - authDate > maxAgeSeconds
}

export function readTelegramInitDataFromHeaders(headers: Headers) {
  return (
    headers.get('x-telegram-init-data')?.trim() ||
    headers.get('x-telegram-webapp-init-data')?.trim() ||
    ''
  )
}

export function getTelegramDisplayName(user: TelegramMiniAppUser | null) {
  if (!user) {
    return ''
  }

  return [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
}

export function verifyTelegramMiniAppData(
  rawInitData: null | string | undefined,
  options?: {
    botToken?: string
    maxAgeSeconds?: number
  },
): VerifiedTelegramMiniAppData | null {
  const initData = rawInitData?.trim() || ''
  const botToken = options?.botToken || getTelegramBotToken()
  const maxAgeSeconds = options?.maxAgeSeconds || 60 * 60 * 24

  if (!(initData && botToken)) {
    return null
  }

  const searchParams = new URLSearchParams(initData)
  const hash = searchParams.get('hash')

  if (!hash) {
    return null
  }

  const dataCheckString = buildDataCheckString(searchParams)
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const expectedHash = createHmac('sha256', secret).update(dataCheckString).digest('hex')
  const expectedBuffer = Buffer.from(expectedHash, 'hex')
  const receivedBuffer = Buffer.from(hash, 'hex')

  if (
    expectedBuffer.length === 0 ||
    receivedBuffer.length === 0 ||
    expectedBuffer.length !== receivedBuffer.length ||
    !timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    return null
  }

  const authDate = Number(searchParams.get('auth_date'))

  if (!Number.isFinite(authDate) || isExpired(authDate, maxAgeSeconds)) {
    return null
  }

  return {
    authDate,
    queryId: searchParams.get('query_id'),
    raw: initData,
    startParam: searchParams.get('start_param'),
    user: parseJsonValue<TelegramMiniAppUser>(searchParams.get('user')),
  }
}
