import type { Payload } from 'payload'

const rateLimitCollectionName = 'request_rate_limits'
const ensuredConnections = new WeakSet<object>()

function getRateLimitCollection(payload: Payload) {
  const database = payload.db.connection.db

  if (!database) {
    throw new Error('Չհաջողվեց միանալ հարցումների սահմանափակման պահեստին')
  }

  return database.collection(rateLimitCollectionName)
}

async function ensureRateLimitIndexes(payload: Payload) {
  const connection = payload.db.connection

  if (ensuredConnections.has(connection)) {
    return
  }

  const collection = getRateLimitCollection(payload)

  await collection.createIndex({ key: 1 }, { name: 'rate_limit_key_unique', unique: true })
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'rate_limit_ttl' })
  ensuredConnections.add(connection)
}

export async function assertRateLimit(args: {
  key: string
  limit: number
  payload: Payload
  windowSeconds: number
}) {
  const { key, limit, payload, windowSeconds } = args

  if (!(key && limit > 0 && windowSeconds > 0)) {
    return
  }

  await ensureRateLimitIndexes(payload)

  const collection = getRateLimitCollection(payload)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + windowSeconds * 1000)

  await collection.deleteMany({
    expiresAt: {
      $lte: now,
    },
    key,
  })

  const result = await collection.findOneAndUpdate(
    { key },
    {
      $inc: {
        count: 1,
      },
      $setOnInsert: {
        createdAt: now,
        expiresAt,
        key,
      },
    },
    {
      returnDocument: 'after',
      upsert: true,
    },
  )

  if ((result?.count || 0) > limit) {
    throw new Error('Շատ հաճախակի հարցումներ են կատարվում։ Փորձիր մի փոքր հետո։')
  }
}
