import { createHmac, timingSafeEqual } from 'node:crypto'

import { getPayloadSecret } from '@/lib/env'

type StaffTokenPayload = {
  exp: number
  masterId: string
  telegramUserId: string
}

function toBase64Url(value: string) {
  return Buffer.from(value).toString('base64url')
}

function sign(value: string) {
  return createHmac('sha256', getPayloadSecret()).update(value).digest('base64url')
}

export function createStaffToken(payload: StaffTokenPayload) {
  const encodedPayload = toBase64Url(JSON.stringify(payload))
  const signature = sign(encodedPayload)

  return `${encodedPayload}.${signature}`
}

export function verifyStaffToken(token: string | null | undefined) {
  if (!token) {
    return null
  }

  const [encodedPayload, signature, ...rest] = token.split('.')

  if (!(encodedPayload && signature) || rest.length > 0) {
    return null
  }

  const expectedSignature = sign(encodedPayload)

  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (actualBuffer.length !== expectedBuffer.length) {
    return null
  }

  if (!timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null
  }

  let parsedPayload: StaffTokenPayload

  try {
    parsedPayload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString(),
    ) as StaffTokenPayload
  } catch {
    return null
  }

  if (
    !(parsedPayload.masterId && parsedPayload.telegramUserId) ||
    typeof parsedPayload.exp !== 'number' ||
    parsedPayload.exp < Date.now()
  ) {
    return null
  }

  return parsedPayload
}
