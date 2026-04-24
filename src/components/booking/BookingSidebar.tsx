import type { PublicMasterItem, PublicServiceItem, SlotItem } from '@/lib/booking/types'

type BookingSidebarProps = {
  clientName: string
  clientPhone: string
  error: string
  isBootstrapping: boolean
  isSubmitting: boolean
  onClientNameChange: (value: string) => void
  onClientPhoneChange: (value: string) => void
  onSubmit: () => void
  selectedDate: string
  selectedMaster: PublicMasterItem | null
  selectedService: PublicServiceItem | null
  selectedSlot: SlotItem | null
  submitDisabled: boolean
  successMessage: string
}

export function BookingSidebar(props: BookingSidebarProps) {
  const {
    clientName,
    clientPhone,
    error,
    isBootstrapping,
    isSubmitting,
    onClientNameChange,
    onClientPhoneChange,
    onSubmit,
    selectedDate,
    selectedMaster,
    selectedService,
    selectedSlot,
    submitDisabled,
    successMessage,
  } = props

  return (
    <section className="space-y-5">
      <div className="liquid-panel rounded-[2rem] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-slate-300/58">Հաստատում</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Ամրագրում</h2>
          </div>
          <div className="liquid-chip rounded-full px-3 py-1 text-xs text-emerald-100/85">
            {selectedSlot ? 'ժամը ընտրված է' : 'սպասում ենք ընտրությանը'}
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <div className="liquid-panel-soft rounded-[1.6rem] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-300/52">
              Ծառայություն
            </p>
            <p className="mt-2 text-lg font-medium text-white">
              {selectedService ? selectedService.title : 'Ընտրիր ծառայությունը'}
            </p>
            {selectedService && (
              <p className="mt-1 text-sm text-slate-300/62">
                {selectedService.durationMinutes} րոպե • {selectedService.price} ֏
              </p>
            )}
          </div>

          <div className="liquid-panel-soft rounded-[1.6rem] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-300/52">Մասնագետ</p>
            <p className="mt-2 text-lg font-medium text-white">
              {selectedMaster ? selectedMaster.name : 'Ընտրիր մասնագետին'}
            </p>
            <p className="mt-1 text-sm text-slate-300/62">
              {selectedMaster?.specialty || 'Սրահի մասնագետ'}
            </p>
          </div>

          <div className="liquid-panel-soft rounded-[1.6rem] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-300/52">Ժամ</p>
            <p className="mt-2 text-lg font-medium text-white">
              {selectedSlot ? selectedSlot.label : 'Ընտրիր ժամը'}
            </p>
            <p className="mt-1 text-sm text-slate-300/62">
              {selectedDate || 'Ամսաթիվը կերևա ընտրությունից հետո'}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <input
            className="liquid-input w-full rounded-[1.35rem] px-4 py-4 text-white"
            onChange={(event) => onClientNameChange(event.target.value)}
            placeholder="Հաճախորդի անուն"
            value={clientName}
          />
          <input
            className="liquid-input w-full rounded-[1.35rem] px-4 py-4 text-white"
            onChange={(event) => onClientPhoneChange(event.target.value)}
            placeholder="Հեռախոս"
            value={clientPhone}
          />
        </div>

        {error && <p className="mt-4 text-sm text-rose-200">{error}</p>}
        {successMessage && <p className="mt-4 text-sm text-emerald-100">{successMessage}</p>}

        <button
          className="liquid-button mt-5 w-full rounded-[1.5rem] px-5 py-4 text-base font-semibold transition hover:scale-[1.01]"
          disabled={isSubmitting || isBootstrapping || submitDisabled}
          onClick={onSubmit}
          type="button"
        >
          {isSubmitting ? 'Պահպանում ենք ամրագրումը...' : 'Հաստատել ամրագրումը'}
        </button>
      </div>

      <div className="liquid-panel-soft rounded-[2rem] px-5 py-5">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-300/58">Ինչպես է աշխատում</p>
        <div className="mt-4 grid gap-3">
          <div className="liquid-chip rounded-[1.3rem] px-4 py-3 text-sm text-slate-100/82">
            Մասնագետը staff panel-ում տեսնում է նույն տվյալները։
          </div>
          <div className="liquid-chip rounded-[1.3rem] px-4 py-3 text-sm text-slate-100/82">
            Ձեռքով և հաճախորդների ամրագրումները պահվում են նույն բազայում։
          </div>
          <div className="liquid-chip rounded-[1.3rem] px-4 py-3 text-sm text-slate-100/82">
            Ժամը անհետանում է, եթե այն արդեն զբաղված է կամ արգելափակված։
          </div>
        </div>
      </div>
    </section>
  )
}
