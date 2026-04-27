const defaultTimezone = 'Europe/Moscow'
const defaultSlotIntervalMinutes = 15
const defaultDatabaseUrl = 'mongodb://127.0.0.1:27017/salon'
const defaultDevelopmentPayloadSecret = 'dev-only-change-me'
const defaultPendingBookingHoldMinutes = 30
const defaultPublicMutationRateLimitWindowSeconds = 60
const defaultBookingReminderLeadHours = 5
const defaultBookingReminderWindowMinutes = 15
const weakSecrets = new Set(['change-me', 'changeme', 'default', 'secret'])

function readEnv(name: string) {
  return process.env[name]?.trim() || ''
}

function isProductionRuntime() {
  return process.env.NODE_ENV === 'production'
}

function isWeakSecret(value: string) {
  return weakSecrets.has(value.toLowerCase())
}

export function getSalonTimezone() {
  return readEnv('SALON_TIMEZONE') || defaultTimezone
}

export function getSlotIntervalMinutes() {
  const value = Number(readEnv('SLOT_INTERVAL_MINUTES') || defaultSlotIntervalMinutes)

  if (Number.isNaN(value) || value <= 0) {
    return defaultSlotIntervalMinutes
  }

  return value
}

export function getPendingBookingHoldMinutes() {
  const value = Number(readEnv('PENDING_BOOKING_HOLD_MINUTES') || defaultPendingBookingHoldMinutes)

  if (Number.isNaN(value) || value < 0) {
    return defaultPendingBookingHoldMinutes
  }

  return value
}

export function getPublicMutationRateLimitWindowSeconds() {
  const value = Number(
    readEnv('PUBLIC_MUTATION_RATE_LIMIT_WINDOW_SECONDS') ||
      defaultPublicMutationRateLimitWindowSeconds,
  )

  if (Number.isNaN(value) || value <= 0) {
    return defaultPublicMutationRateLimitWindowSeconds
  }

  return value
}

export function getPublicBookingRateLimitMaxRequests() {
  const value = Number(readEnv('PUBLIC_BOOKING_RATE_LIMIT_MAX_REQUESTS') || 5)

  if (Number.isNaN(value) || value <= 0) {
    return 5
  }

  return value
}

export function getPublicCancelRateLimitMaxRequests() {
  const value = Number(readEnv('PUBLIC_CANCEL_RATE_LIMIT_MAX_REQUESTS') || 8)

  if (Number.isNaN(value) || value <= 0) {
    return 8
  }

  return value
}

export function getBookingReminderLeadHours() {
  const value = Number(readEnv('BOOKING_REMINDER_LEAD_HOURS') || defaultBookingReminderLeadHours)

  if (Number.isNaN(value) || value <= 0) {
    return defaultBookingReminderLeadHours
  }

  return value
}

export function getBookingReminderWindowMinutes() {
  const value = Number(
    readEnv('BOOKING_REMINDER_WINDOW_MINUTES') || defaultBookingReminderWindowMinutes,
  )

  if (Number.isNaN(value) || value <= 0) {
    return defaultBookingReminderWindowMinutes
  }

  return value
}

export function getAppBaseUrl() {
  const rawValue = readEnv('APP_BASE_URL') || 'http://localhost:3000'
  const appUrl = new URL(rawValue)

  if (!(appUrl.protocol === 'http:' || appUrl.protocol === 'https:')) {
    throw new Error('APP_BASE_URL must use http or https')
  }

  if (isProductionRuntime() && appUrl.protocol !== 'https:') {
    throw new Error('APP_BASE_URL must use https in production')
  }

  return appUrl.toString().replace(/\/$/, '')
}

export function getDatabaseUrl() {
  return readEnv('DATABASE_URL') || defaultDatabaseUrl
}

export function getPayloadSecret() {
  const value = readEnv('PAYLOAD_SECRET')

  if (!value) {
    if (isProductionRuntime()) {
      throw new Error('PAYLOAD_SECRET is required in production')
    }

    return defaultDevelopmentPayloadSecret
  }

  if (isProductionRuntime() && isWeakSecret(value)) {
    throw new Error('PAYLOAD_SECRET must not use a placeholder value in production')
  }

  return value
}

export function getTelegramBotToken() {
  return readEnv('TELEGRAM_BOT_TOKEN')
}

export function getTelegramWebhookSecret() {
  return readEnv('TELEGRAM_WEBHOOK_SECRET')
}

export function getCronSecret() {
  return readEnv('CRON_SECRET')
}

export function getTelegramBotUsername() {
  return readEnv('NEXT_PUBLIC_TELEGRAM_BOT_USERNAME').replace(/^@/, '')
}
