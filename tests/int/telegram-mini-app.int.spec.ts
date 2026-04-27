import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import { verifyTelegramMiniAppData } from '@/lib/telegram-mini-app'

function buildSignedInitData(botToken: string) {
  const authDate = Math.floor(Date.now() / 1000)
  const user = JSON.stringify({
    first_name: 'Armen',
    id: 123456789,
    username: 'armen_test',
  })

  const params = new URLSearchParams({
    auth_date: String(authDate),
    query_id: 'AAEAAAE',
    start_param: 'booking',
    user,
  })

  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const hash = createHmac('sha256', secret).update(dataCheckString).digest('hex')

  params.set('hash', hash)

  return params.toString()
}

describe('verifyTelegramMiniAppData', () => {
  it('accepts valid telegram init data', () => {
    const initData = buildSignedInitData('test-bot-token')
    const verified = verifyTelegramMiniAppData(initData, {
      botToken: 'test-bot-token',
      maxAgeSeconds: 60,
    })

    expect(verified?.user?.id).toBe(123456789)
    expect(verified?.user?.username).toBe('armen_test')
    expect(verified?.startParam).toBe('booking')
  })

  it('rejects tampered init data', () => {
    const initData = `${buildSignedInitData('test-bot-token')}&query_id=tampered`
    const verified = verifyTelegramMiniAppData(initData, {
      botToken: 'test-bot-token',
      maxAgeSeconds: 60,
    })

    expect(verified).toBeNull()
  })
})
