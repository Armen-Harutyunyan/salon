import { randomUUID } from 'node:crypto'

export function generateBookingReferenceCode() {
  return randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
}
