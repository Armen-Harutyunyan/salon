const defaultTimezone = 'Europe/Moscow'
const defaultSlotIntervalMinutes = 15
const defaultDatabaseUrl = 'mongodb://127.0.0.1:27017/salon'
const defaultDevelopmentPayloadSecret = 'dev-only-change-me'
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

export function getTelegramBotUsername() {
  return readEnv('NEXT_PUBLIC_TELEGRAM_BOT_USERNAME').replace(/^@/, '')
}
