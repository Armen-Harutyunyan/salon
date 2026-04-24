'use client'

import { useEffect, useEffectEvent, useMemo, useState, useTransition } from 'react'

import { formatDateTimeLabel, todayDateString } from '@/lib/booking/time'
import type { PublicBookingItem, SlotItem } from '@/lib/booking/types'

type StaffService = {
  durationMinutes: number
  id: string
  price: number
  title: string
}

type StaffMeResponse = {
  bookings: PublicBookingItem[]
  master: {
    id: string
    name: string
    specialty: string | null
    telegramUserId: string | null
  }
  services: StaffService[]
}

type StaffMiniAppProps = {
  token: string
}

export function StaffMiniApp(props: StaffMiniAppProps) {
  const { token } = props
  const [staffData, setStaffData] = useState<StaffMeResponse | null>(null)
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [selectedDate, setSelectedDate] = useState(todayDateString())
  const [slots, setSlots] = useState<SlotItem[]>([])
  const [selectedSlotStart, setSelectedSlotStart] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [source, setSource] = useState<'phone' | 'staff-bot' | 'walk-in'>('phone')
  const [blockDate, setBlockDate] = useState(todayDateString())
  const [blockStartTime, setBlockStartTime] = useState('13:00')
  const [blockEndTime, setBlockEndTime] = useState('14:00')
  const [blockReason, setBlockReason] = useState('')
  const [blockType, setBlockType] = useState<'blocked' | 'break'>('blocked')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, startLoadingTransition] = useTransition()
  const [isSubmittingBooking, startBookingTransition] = useTransition()
  const [isSubmittingBlock, startBlockTransition] = useTransition()

  async function refreshStaffData() {
    const response = await fetch(`/api/staff/me?token=${encodeURIComponent(token)}`)
    const data = (await response.json()) as StaffMeResponse & { error?: string }

    if (!response.ok) {
      setError(data.error || 'Не удалось загрузить staff данные')
      return
    }

    setStaffData(data)

    if (!selectedServiceId && data.services[0]) {
      setSelectedServiceId(data.services[0].id)
    }
  }

  const loadStaffDataEffect = useEffectEvent(async () => {
    await refreshStaffData()
  })

  useEffect(() => {
    startLoadingTransition(loadStaffDataEffect)
  }, [])

  const loadSlots = useEffectEvent(async () => {
    const params = new URLSearchParams({
      date: selectedDate,
      serviceId: selectedServiceId,
      token,
    })

    const response = await fetch(`/api/staff/slots?${params.toString()}`)
    const data = (await response.json()) as { error?: string; slots?: SlotItem[] }

    if (!response.ok) {
      setError(data.error || 'Не удалось получить staff слоты')
      setSlots([])
      return
    }

    setError('')
    setSlots(data.slots || [])
    setSelectedSlotStart('')
  })

  useEffect(() => {
    if (!(selectedDate && selectedServiceId)) {
      return
    }

    startLoadingTransition(loadSlots)
  }, [selectedDate, selectedServiceId])

  const selectedService = useMemo(
    () => staffData?.services.find((service) => service.id === selectedServiceId) || null,
    [selectedServiceId, staffData],
  )

  async function submitManualBooking() {
    setError('')
    setSuccessMessage('')

    const response = await fetch('/api/staff/bookings', {
      body: JSON.stringify({
        clientName,
        clientPhone,
        date: selectedDate,
        notes,
        serviceId: selectedServiceId,
        slotStart: selectedSlotStart,
        source,
        token,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const data = (await response.json()) as { error?: string }

    if (!response.ok) {
      setError(data.error || 'Не удалось создать ручную запись')
      return
    }

    setSuccessMessage('Ручная запись сохранена.')
    setClientName('')
    setClientPhone('')
    setNotes('')
    setSelectedSlotStart('')
    await refreshStaffData()
  }

  async function submitBlock() {
    setError('')
    setSuccessMessage('')

    const response = await fetch('/api/staff/blocks', {
      body: JSON.stringify({
        date: blockDate,
        endTime: blockEndTime,
        reason: blockReason,
        startTime: blockStartTime,
        token,
        type: blockType,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const data = (await response.json()) as { error?: string }

    if (!response.ok) {
      setError(data.error || 'Не удалось заблокировать интервал')
      return
    }

    setSuccessMessage('Интервал заблокирован.')
    setBlockReason('')
    await refreshStaffData()
  }

  if (!token) {
    return (
      <div className="liquid-panel rounded-[2rem] border-rose-300/22 p-6 text-rose-100">
        Staff token отсутствует. Эту страницу нужно открывать из staff bot.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="liquid-shell rounded-[2.3rem] p-6 sm:p-8">
        <p className="liquid-chip inline-flex rounded-full px-4 py-2 text-xs uppercase tracking-[0.35em] text-emerald-200/80">
          Staff panel
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
          {staffData ? staffData.master.name : 'Загрузка мастера...'}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-stone-300">
          Через эту панель мастер создает ручные записи по звонку и walk-in, а также ставит блоки на
          перерыв или личную занятость.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="liquid-panel rounded-[2rem] p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Новая ручная запись</h2>
            {isLoading && <span className="text-sm text-amber-200">обновление...</span>}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <select
              className="liquid-input rounded-2xl px-4 py-3 text-white"
              onChange={(event) => setSelectedServiceId(event.target.value)}
              value={selectedServiceId}
            >
              {(staffData?.services || []).map((service) => (
                <option key={service.id} value={service.id}>
                  {service.title} • {service.durationMinutes} мин
                </option>
              ))}
            </select>
            <input
              className="liquid-input rounded-2xl px-4 py-3 text-white"
              min={todayDateString()}
              onChange={(event) => setSelectedDate(event.target.value)}
              type="date"
              value={selectedDate}
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {slots.map((slot) => {
              const selected = selectedSlotStart === slot.start

              return (
                <button
                  key={slot.start}
                  className={`rounded-2xl border px-4 py-3 text-sm transition ${
                    selected
                      ? 'border-emerald-200/46 bg-[linear-gradient(135deg,_rgba(151,247,214,0.24),_rgba(155,196,255,0.14))] text-white'
                      : 'border-white/10 bg-[linear-gradient(135deg,_rgba(255,255,255,0.12),_rgba(255,255,255,0.04))] text-stone-200 hover:border-white/18'
                  }`}
                  onClick={() => setSelectedSlotStart(slot.start)}
                  type="button"
                >
                  {slot.label}
                </button>
              )
            })}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <input
              className="liquid-input rounded-2xl px-4 py-3 text-white"
              onChange={(event) => setClientName(event.target.value)}
              placeholder="Имя клиента"
              value={clientName}
            />
            <input
              className="liquid-input rounded-2xl px-4 py-3 text-white"
              onChange={(event) => setClientPhone(event.target.value)}
              placeholder="Телефон"
              value={clientPhone}
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
            <select
              className="liquid-input rounded-2xl px-4 py-3 text-white"
              onChange={(event) =>
                setSource(event.target.value as 'phone' | 'staff-bot' | 'walk-in')
              }
              value={source}
            >
              <option value="phone">Телефон</option>
              <option value="walk-in">Walk-in</option>
              <option value="staff-bot">Staff bot</option>
            </select>
            <textarea
              className="liquid-input min-h-28 rounded-2xl px-4 py-3 text-white"
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Комментарий к записи"
              value={notes}
            />
          </div>

          <button
            className="liquid-button mt-5 w-full rounded-2xl px-5 py-4 font-medium transition hover:scale-[1.01] disabled:cursor-not-allowed"
            disabled={
              !(clientName.trim() && selectedServiceId && selectedSlotStart) || isSubmittingBooking
            }
            onClick={() => startBookingTransition(submitManualBooking)}
            type="button"
          >
            {isSubmittingBooking ? 'Сохраняем...' : 'Создать ручную запись'}
          </button>

          {selectedService && (
            <p className="mt-3 text-sm text-stone-400">
              Текущая услуга: {selectedService.title}, длительность{' '}
              {selectedService.durationMinutes} мин.
            </p>
          )}
        </section>

        <section className="space-y-6">
          <div className="liquid-panel rounded-[2rem] p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-white">Блок времени</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input
                className="liquid-input rounded-2xl px-4 py-3 text-white"
                min={todayDateString()}
                onChange={(event) => setBlockDate(event.target.value)}
                type="date"
                value={blockDate}
              />
              <select
                className="liquid-input rounded-2xl px-4 py-3 text-white"
                onChange={(event) => setBlockType(event.target.value as 'blocked' | 'break')}
                value={blockType}
              >
                <option value="blocked">Занят</option>
                <option value="break">Перерыв</option>
              </select>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                className="liquid-input rounded-2xl px-4 py-3 text-white"
                onChange={(event) => setBlockStartTime(event.target.value)}
                type="time"
                value={blockStartTime}
              />
              <input
                className="liquid-input rounded-2xl px-4 py-3 text-white"
                onChange={(event) => setBlockEndTime(event.target.value)}
                type="time"
                value={blockEndTime}
              />
            </div>

            <textarea
              className="liquid-input mt-4 min-h-24 w-full rounded-2xl px-4 py-3 text-white"
              onChange={(event) => setBlockReason(event.target.value)}
              placeholder="Причина блокировки"
              value={blockReason}
            />

            <button
              className="liquid-button mt-5 w-full rounded-2xl px-5 py-4 font-medium transition hover:scale-[1.01] disabled:cursor-not-allowed"
              disabled={!blockReason.trim() || isSubmittingBlock}
              onClick={() => startBlockTransition(submitBlock)}
              type="button"
            >
              {isSubmittingBlock ? 'Сохраняем...' : 'Заблокировать интервал'}
            </button>
          </div>

          <div className="liquid-panel rounded-[2rem] p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-white">Записи на сегодня</h2>
            <div className="mt-4 space-y-3">
              {(staffData?.bookings || []).map((booking) => (
                <div
                  key={booking.id}
                  className="liquid-panel-soft rounded-2xl px-4 py-3 text-sm text-stone-200"
                >
                  <p className="font-medium text-white">{booking.clientName}</p>
                  <p className="mt-1 text-stone-400">
                    {formatDateTimeLabel(booking.startsAt)} • {booking.serviceTitle}
                  </p>
                  <p className="mt-1 text-stone-500">
                    {booking.source} • {booking.status}
                  </p>
                </div>
              ))}

              {!staffData?.bookings.length && (
                <div className="liquid-panel-soft rounded-2xl px-4 py-6 text-sm text-stone-400">
                  Сегодня записей пока нет.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {error && <p className="text-sm text-rose-300">{error}</p>}
      {successMessage && <p className="text-sm text-emerald-300">{successMessage}</p>}
    </div>
  )
}
