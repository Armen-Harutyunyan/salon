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

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-[0.42fr_1fr]">
      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.26em] text-slate-300/56">
          Ամսաթիվ
        </span>
        <input
          className="liquid-input w-full rounded-[1.35rem] px-4 py-4 text-white"
          min={todayDateString()}
          onChange={(event) => onDateChange(event.target.value)}
          type="date"
          value={selectedDate}
        />
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
