import type { KeyboardEvent, MouseEvent } from 'react'
import { todayDateString } from '@/lib/booking/time'
import type { SlotItem } from '@/lib/booking/types'

type BookingSlotSectionProps = {
  isLoadingSlots: boolean
  onDateChange: (date: string) => void
  onSlotSelect: (slotStart: string) => void
  selectedDate: string
  selectedSlotStart: string
  slots: SlotItem[]
}

export function BookingSlotSection(props: BookingSlotSectionProps) {
  const { isLoadingSlots, onDateChange, onSlotSelect, selectedDate, selectedSlotStart, slots } =
    props

  function openDatePicker(event: MouseEvent<HTMLInputElement>) {
    event.currentTarget.showPicker?.()
  }

  function handleDateKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Tab') {
      return
    }

    event.preventDefault()

    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.currentTarget.showPicker?.()
    }
  }

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,0.46fr)_minmax(0,1fr)]">
      <label className="block min-w-0">
        <span className="mb-2 block text-xs uppercase tracking-[0.26em] text-slate-300/56">
          Ամսաթիվ
        </span>
        <div className="liquid-input relative min-w-0 overflow-hidden rounded-[1.35rem] focus-within:border-emerald-200/50 focus-within:ring-4 focus-within:ring-emerald-200/10">
          <div
            aria-hidden="true"
            className="flex min-h-[3.875rem] items-center px-4 py-4 pr-14 text-white"
          >
            <span className="block min-w-0 truncate leading-[1.35]">{selectedDate}</span>
          </div>

          <input
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            inputMode="none"
            onClick={openDatePicker}
            min={todayDateString()}
            onChange={(event) => onDateChange(event.target.value)}
            onKeyDown={handleDateKeyDown}
            onPaste={(event) => event.preventDefault()}
            type="date"
            value={selectedDate}
          />

          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/82"
          >
            <svg
              aria-hidden="true"
              fill="none"
              height="16"
              viewBox="0 0 16 16"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>Calendar</title>
              <path
                d="M5 1.75V3.25M11 1.75V3.25M2.5 5.25H13.5M4.25 7.5H5.75M7.25 7.5H8.75M10.25 7.5H11.75M4.25 10.25H5.75M7.25 10.25H8.75M10.25 10.25H11.75M4 3.25H12C12.8284 3.25 13.5 3.92157 13.5 4.75V12C13.5 12.8284 12.8284 13.5 12 13.5H4C3.17157 13.5 2.5 12.8284 2.5 12V4.75C2.5 3.92157 3.17157 3.25 4 3.25Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.25"
              />
            </svg>
          </span>
        </div>
      </label>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-xs uppercase tracking-[0.26em] text-slate-300/56">Ազատ ժամեր</span>
          <span className="text-xs text-slate-300/62">
            {isLoadingSlots ? 'հաշվարկում ենք...' : `${slots.length} հասանելի`}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {slots.map((slot) => {
            const isSelected = selectedSlotStart === slot.start

            return (
              <button
                key={slot.start}
                className={`rounded-[1.25rem] border px-4 py-4 text-center text-sm transition ${
                  isSelected
                    ? 'border-emerald-200/46 bg-[linear-gradient(135deg,_rgba(151,247,214,0.24),_rgba(155,196,255,0.14))] text-white'
                    : 'border-white/10 bg-[linear-gradient(135deg,_rgba(255,255,255,0.12),_rgba(255,255,255,0.05))] text-slate-100/88 hover:border-white/18'
                }`}
                onClick={() => onSlotSelect(slot.start)}
                type="button"
              >
                <span className="block text-base font-semibold">{slot.startLabel}</span>
                <span className="mt-1 block text-[11px] text-slate-300/58">{slot.endLabel}</span>
              </button>
            )
          })}

          {!(slots.length || isLoadingSlots) && (
            <div className="liquid-panel-soft col-span-full rounded-[1.45rem] px-4 py-7 text-sm text-slate-300/68">
              Ընտրված օրվա համար ազատ ժամ չկա։
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
