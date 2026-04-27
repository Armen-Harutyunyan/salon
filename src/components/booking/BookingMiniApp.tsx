'use client'

import { useEffect, useEffectEvent, useMemo, useState, useTransition } from 'react'
import { todayDateString } from '@/lib/booking/time'
import type {
  PublicBookingItem,
  PublicMasterItem,
  PublicServiceItem,
  SlotItem,
} from '@/lib/booking/types'
import { BookingHero } from './BookingHero'
import { BookingMasterGrid } from './BookingMasterGrid'
import { BookingServiceSection } from './BookingServiceSection'
import { BookingSidebar } from './BookingSidebar'
import { BookingSlotSection } from './BookingSlotSection'

type BootstrapResponse = {
  masters: PublicMasterItem[]
  services: PublicServiceItem[]
}

type TelegramMiniAppUser = {
  first_name?: string
  id?: number
  last_name?: string
  username?: string
}

type TelegramWebApp = {
  enableClosingConfirmation?: () => void
  expand?: () => void
  initData?: string
  initDataUnsafe?: {
    user?: TelegramMiniAppUser
  }
  ready?: () => void
}

type TelegramAccount = {
  displayName: string
  id: string
  username: string | null
}

type MyBookingsResponse = {
  bookings: PublicBookingItem[]
  user: TelegramAccount
}

export function BookingMiniApp() {
  const [services, setServices] = useState<PublicServiceItem[]>([])
  const [masters, setMasters] = useState<PublicMasterItem[]>([])
  const [slots, setSlots] = useState<SlotItem[]>([])
  const [myBookings, setMyBookings] = useState<PublicBookingItem[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [selectedMasterId, setSelectedMasterId] = useState('')
  const [selectedDate, setSelectedDate] = useState(todayDateString())
  const [selectedSlotStart, setSelectedSlotStart] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [telegramInitData, setTelegramInitData] = useState('')
  const [telegramAccount, setTelegramAccount] = useState<TelegramAccount | null>(null)
  const [latestBooking, setLatestBooking] = useState<PublicBookingItem | null>(null)
  const [cancellingBookingId, setCancellingBookingId] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isBootstrapping, startBootstrapTransition] = useTransition()
  const [isSubmitting, startSubmitTransition] = useTransition()
  const [isLoadingSlots, startSlotsTransition] = useTransition()
  const [isLoadingMyBookings, startMyBookingsTransition] = useTransition()

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

  const bootstrapTelegram = useEffectEvent(() => {
    const telegram = (
      window as Window & {
        Telegram?: {
          WebApp?: TelegramWebApp
        }
      }
    ).Telegram?.WebApp

    if (!telegram) {
      return false
    }

    telegram.ready?.()
    telegram.expand?.()
    telegram.enableClosingConfirmation?.()

    const rawInitData = telegram.initData?.trim() || ''
    const telegramUser = telegram.initDataUnsafe?.user

    if (rawInitData) {
      setTelegramInitData(rawInitData)
    }

    if (telegramUser?.id) {
      const displayName = [telegramUser.first_name, telegramUser.last_name]
        .filter(Boolean)
        .join(' ')
        .trim()

      setTelegramAccount({
        displayName,
        id: String(telegramUser.id),
        username: telegramUser.username || null,
      })
      setClientName((currentValue) => currentValue || displayName)
    }

    return true
  })

  useEffect(() => {
    if (bootstrapTelegram()) {
      return
    }

    const interval = window.setInterval(() => {
      if (bootstrapTelegram()) {
        window.clearInterval(interval)
      }
    }, 250)
    const timeout = window.setTimeout(() => window.clearInterval(interval), 4000)

    return () => {
      window.clearInterval(interval)
      window.clearTimeout(timeout)
    }
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

  const refreshMyBookings = useEffectEvent(async () => {
    if (!telegramInitData) {
      setMyBookings([])
      return
    }

    const response = await fetch('/api/public/me', {
      headers: {
        'x-telegram-init-data': telegramInitData,
      },
    })
    const data = (await response.json()) as MyBookingsResponse & { error?: string }

    if (!response.ok) {
      if (response.status === 401) {
        setMyBookings([])
        return
      }

      setError(data.error || 'Չհաջողվեց ստանալ ամրագրումների ցանկը')
      return
    }

    setMyBookings(data.bookings)
    setTelegramAccount(data.user)
  })

  useEffect(() => {
    if (!(selectedDate && activeMasterId && selectedServiceId)) {
      return
    }

    startSlotsTransition(loadSlots)
  }, [activeMasterId, selectedDate, selectedServiceId])

  useEffect(() => {
    if (!telegramInitData) {
      return
    }

    startMyBookingsTransition(refreshMyBookings)
  }, [telegramInitData])

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
        ...(telegramInitData
          ? {
              'x-telegram-init-data': telegramInitData,
            }
          : {}),
      },
      method: 'POST',
    })

    const data = (await response.json()) as { booking?: PublicBookingItem; error?: string }

    if (!response.ok) {
      setError(data.error || 'Չհաջողվեց ստեղծել ամրագրումը')
      return
    }

    setLatestBooking(data.booking || null)
    setSuccessMessage(
      'Ամրագրումը ստեղծվեց։ Այն արդեն պահպանվել է համակարգում և հասանելի է «Իմ ամրագրումները» բաժնում։',
    )
    setClientName('')
    setClientPhone('')
    setSelectedSlotStart('')

    await Promise.all([loadSlots(), refreshMyBookings()])
  }

  const cancelBooking = useEffectEvent(async (bookingId: string) => {
    if (!telegramInitData) {
      setError('Այս գործողությունը հասանելի է միայն Telegram Mini App-ից')
      return
    }

    setError('')
    setSuccessMessage('')
    setCancellingBookingId(bookingId)

    try {
      const response = await fetch(`/api/public/bookings/${bookingId}/cancel`, {
        headers: {
          'x-telegram-init-data': telegramInitData,
        },
        method: 'PATCH',
      })
      const data = (await response.json()) as { booking?: PublicBookingItem; error?: string }

      if (!response.ok) {
        setError(data.error || 'Չհաջողվեց չեղարկել ամրագրումը')
        return
      }

      setLatestBooking(data.booking || null)
      setSuccessMessage('Ամրագրումը չեղարկվեց։ Ազատված ժամը կրկին հասանելի է ամրագրման համար։')
      await Promise.all([refreshMyBookings(), loadSlots()])
    } finally {
      setCancellingBookingId('')
    }
  })

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
        cancellingBookingId={cancellingBookingId}
        clientName={clientName}
        clientPhone={clientPhone}
        confirmedBooking={latestBooking}
        error={error}
        isBootstrapping={isBootstrapping}
        isLoadingMyBookings={isLoadingMyBookings}
        isSubmitting={isSubmitting}
        myBookings={myBookings}
        onCancelBooking={(bookingId) =>
          startMyBookingsTransition(async () => cancelBooking(bookingId))
        }
        onClientNameChange={setClientName}
        onClientPhoneChange={setClientPhone}
        onSubmit={() => startSubmitTransition(submitBooking)}
        selectedDate={selectedDate}
        selectedMaster={selectedMaster}
        selectedService={selectedService}
        selectedSlot={selectedSlot}
        submitDisabled={submitDisabled}
        successMessage={successMessage}
        telegramDisplayName={telegramAccount?.displayName || ''}
      />
    </div>
  )
}
