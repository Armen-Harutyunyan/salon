import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'

import { seedDemoSalonData } from '@/lib/demo-seed'

type SeedBody = {
  secret?: string
}

function readProvidedSecret(request: Request, bodySecret?: string) {
  const authHeader = request.headers.get('authorization')?.trim()
  const headerSecret = request.headers.get('x-seed-secret')?.trim()

  if (headerSecret) {
    return headerSecret
  }

  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim()
  }

  return bodySecret?.trim() || ''
}

function secretsMatch(expected: string, actual: string) {
  const expectedBuffer = Buffer.from(expected)
  const actualBuffer = Buffer.from(actual)

  if (expectedBuffer.length !== actualBuffer.length) {
    return false
  }

  return timingSafeEqual(expectedBuffer, actualBuffer)
}

export async function POST(request: Request) {
  const expectedSecret = process.env.SEED_SECRET?.trim() || ''

  if (!expectedSecret) {
    return NextResponse.json(
      { error: 'SEED_SECRET is not configured on the server' },
      { status: 500 },
    )
  }

  let bodySecret = ''

  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const body = (await request.json()) as SeedBody
    bodySecret = body.secret?.trim() || ''
  }

  const providedSecret = readProvidedSecret(request, bodySecret)

  if (!(providedSecret && secretsMatch(expectedSecret, providedSecret))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await seedDemoSalonData()

  return NextResponse.json({
    ok: true,
    seeded: result,
  })
}
