export type SlotItem = {
  end: string
  endLabel: string
  label: string
  start: string
  startLabel: string
}

export type PublicServiceItem = {
  description: string | null
  durationMinutes: number
  id: string
  isActive: boolean
  price: number
  title: string
}

export type PublicMasterItem = {
  id: string
  isActive: boolean
  name: string
  photoAlt: string | null
  photoUrl: string | null
  serviceIds: string[]
  specialty: string | null
}

export type PublicBookingItem = {
  clientName: string
  durationMinutes: number
  endsAt: string
  id: string
  masterName: string
  serviceTitle: string
  source: string
  startsAt: string
  status: string
}
