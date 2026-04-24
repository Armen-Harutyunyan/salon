'use client'

import { useEffect, useEffectEvent, useMemo, useState, useTransition } from 'react'
import { todayDateString } from '@/lib/booking/time'
import type { PublicMasterItem, PublicServiceItem, SlotItem } from '@/lib/booking/types'
import { BookingHero } from './BookingHero'
import { BookingMasterGrid } from './BookingMasterGrid'
import { BookingServiceSection } from './BookingServiceSection'
import { BookingSidebar } from './BookingSidebar'
import { BookingSlotSection } from './BookingSlotSection'

type BootstrapResponse = {
  masters: PublicMasterItem[]
  services: PublicServiceItem[]
}

export function BookingMiniApp() {
  const [services, setServices] = useState<PublicServiceItem[]>([])
  const [masters, setMasters] = useState<PublicMasterItem[]>([])
  const [slots, setSlots] = useState<SlotItem[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [selectedMasterId, setSelectedMasterId] = useState('')
  const [selectedDate, setSelectedDate] = useState(todayDateString())
  const [selectedSlotStart, setSelectedSlotStart] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isBootstrapping, startBootstrapTransition] = useTransition()
  const [isSubmitting, startSubmitTransition] = useTransition()
  const [isLoadingSlots, startSlotsTransition] = useTransition()

  const bootstrap = useEffectEvent(async () => {
    const response = await fetch('/api/public/bootstrap')
    const data = (await response.json()) as BootstrapResponse

    setServices(data.services)
    setMasters(data.masters)

    if (data.services[0]) {
      setSelectedServiceId((currentValue) => currentValue || data.services[0].id)
    }
  })

  useEffect(() => {
    startBootstrapTransition(bootstrap)
  }, [])

  const filteredMasters = useMemo(() => {
    if (!selectedServiceId) {
      return masters
    }

    return masters.filter((master) => master.serviceIds.includes(selectedServiceId))
  }, [masters, selectedServiceId])

  const activeMasterId =
    selectedMasterId && filteredMasters.some((master) => master.id === selectedMasterId)
      ? selectedMasterId
      : filteredMasters[0]?.id || ''

  const selectedService = services.find((service) => service.id === selectedServiceId) || null
  const selectedMaster = masters.find((master) => master.id === activeMasterId) || null
  const selectedSlot = slots.find((slot) => slot.start === selectedSlotStart) || null

  const loadSlots = useEffectEvent(async () => {
    const params = new URLSearchParams({
      date: selectedDate,
      masterId: activeMasterId,
      serviceId: selectedServiceId,
    })

    const response = await fetch(`/api/public/slots?${params.toString()}`)
    const data = (await response.json()) as { error?: string; slots?: SlotItem[] }

    if (!response.ok) {
      setError(data.error || 'Չհաջողվեց ստանալ ազատ ժամերը')
      setSlots([])
      return
    }

    setError('')
    setSlots(data.slots || [])
    setSelectedSlotStart('')
  })

  useEffect(() => {
    if (!(selectedDate && activeMasterId && selectedServiceId)) {
      return
    }

    startSlotsTransition(loadSlots)
  }, [activeMasterId, selectedDate, selectedServiceId])

  const heroStats = [
    {
      label: 'Ծառայություններ',
      value: selectedService ? `${selectedService.durationMinutes} րոպե` : `${services.length}`,
    },
    {
      label: 'Մասնագետներ',
      value: `${filteredMasters.length}`,
    },
    {
      label: 'Ժամեր',
      value: isLoadingSlots ? '...' : `${slots.length}`,
    },
  ]

  async function submitBooking() {
    setError('')
    setSuccessMessage('')

    const response = await fetch('/api/public/bookings', {
      body: JSON.stringify({
        clientName,
        clientPhone,
        date: selectedDate,
        masterId: activeMasterId,
        serviceId: selectedServiceId,
        slotStart: selectedSlotStart,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const data = (await response.json()) as { error?: string }

    if (!response.ok) {
      setError(data.error || 'Չհաջողվեց ստեղծել ամրագրումը')
      return
    }

    setSuccessMessage(
      'Ամրագրումը ստեղծվեց։ Այն արդեն պահպանվել է համակարգում, և այս ժամը այլևս հասանելի չէ մյուս հաճախորդներին։',
    )
    setClientName('')
    setClientPhone('')
    setSelectedSlotStart('')
  }

  const submitDisabled = !(
    clientName.trim() &&
    selectedServiceId &&
    activeMasterId &&
    selectedSlotStart
  )

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.72fr] lg:gap-6">
      <section className="liquid-shell rounded-[2.2rem] p-5 sm:p-7">
        <div className="flex flex-col gap-6">
          <BookingHero stats={heroStats} />

          <div className="liquid-panel rounded-[2rem] p-5 sm:p-6">
            <BookingServiceSection
              onServiceChange={setSelectedServiceId}
              selectedService={selectedService}
              selectedServiceId={selectedServiceId}
              services={services}
            />

            <BookingMasterGrid
              activeMasterId={activeMasterId}
              masters={filteredMasters}
              onMasterSelect={setSelectedMasterId}
            />

            <BookingSlotSection
              isLoadingSlots={isLoadingSlots}
              onDateChange={setSelectedDate}
              onSlotSelect={setSelectedSlotStart}
              selectedDate={selectedDate}
              selectedSlotStart={selectedSlotStart}
              slots={slots}
            />
          </div>
        </div>
      </section>

      <BookingSidebar
        clientName={clientName}
        clientPhone={clientPhone}
        error={error}
        isBootstrapping={isBootstrapping}
        isSubmitting={isSubmitting}
        onClientNameChange={setClientName}
        onClientPhoneChange={setClientPhone}
        onSubmit={() => startSubmitTransition(submitBooking)}
        selectedDate={selectedDate}
        selectedMaster={selectedMaster}
        selectedService={selectedService}
        selectedSlot={selectedSlot}
        submitDisabled={submitDisabled}
        successMessage={successMessage}
      />
    </div>
  )
}
