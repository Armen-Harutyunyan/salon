import { relationsToIds } from '@/lib/relations'
import type { Master, Service } from '@/payload-types'

import type { PublicMasterItem, PublicServiceItem } from './types'

export function toPublicServiceItem(service: Service): PublicServiceItem {
  return {
    description: service.description || null,
    durationMinutes: service.durationMinutes,
    id: service.id,
    isActive: service.isActive,
    price: service.price,
    title: service.title,
  }
}

export function toPublicMasterItem(master: Master): PublicMasterItem {
  const media = typeof master.photo === 'object' && master.photo ? master.photo : null
  const fallbackName = ((master as unknown as { fullName?: string | null }).fullName || '').trim()
  const resolvedName = master.name?.trim() || fallbackName || 'Мастер'

  return {
    id: master.id,
    isActive: master.isActive,
    name: resolvedName,
    photoAlt: media?.alt || null,
    photoUrl: media?.url || null,
    serviceIds: relationsToIds(master.services),
    specialty: master.specialty || null,
  }
}
