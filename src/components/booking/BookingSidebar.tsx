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
            <p className="text-xs uppercase tracking-[0.32em] text-slate-300/58">Подтверждение</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Запись</h2>
          </div>
          <div className="liquid-chip rounded-full px-3 py-1 text-xs text-emerald-100/85">
            {selectedSlot ? 'слот выбран' : 'ждем выбор'}
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <div className="liquid-panel-soft rounded-[1.6rem] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-300/52">Услуга</p>
            <p className="mt-2 text-lg font-medium text-white">
              {selectedService ? selectedService.title : 'Выбери услугу'}
            </p>
            {selectedService && (
              <p className="mt-1 text-sm text-slate-300/62">
                {selectedService.durationMinutes} мин • {selectedService.price} ₽
              </p>
            )}
          </div>

          <div className="liquid-panel-soft rounded-[1.6rem] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-300/52">Мастер</p>
            <p className="mt-2 text-lg font-medium text-white">
              {selectedMaster ? selectedMaster.name : 'Выбери мастера'}
            </p>
            <p className="mt-1 text-sm text-slate-300/62">
              {selectedMaster?.specialty || 'Специалист салона'}
            </p>
          </div>

          <div className="liquid-panel-soft rounded-[1.6rem] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-300/52">Окно</p>
            <p className="mt-2 text-lg font-medium text-white">
              {selectedSlot ? selectedSlot.label : 'Выбери слот'}
            </p>
            <p className="mt-1 text-sm text-slate-300/62">
              {selectedDate || 'Дата будет указана после выбора'}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <input
            className="liquid-input w-full rounded-[1.35rem] px-4 py-4 text-white"
            onChange={(event) => onClientNameChange(event.target.value)}
            placeholder="Имя клиента"
            value={clientName}
          />
          <input
            className="liquid-input w-full rounded-[1.35rem] px-4 py-4 text-white"
            onChange={(event) => onClientPhoneChange(event.target.value)}
            placeholder="Телефон"
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
          {isSubmitting ? 'Фиксируем запись...' : 'Подтвердить запись'}
        </button>
      </div>

      <div className="liquid-panel-soft rounded-[2rem] px-5 py-5">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-300/58">Как это работает</p>
        <div className="mt-4 grid gap-3">
          <div className="liquid-chip rounded-[1.3rem] px-4 py-3 text-sm text-slate-100/82">
            Мастер видит те же данные через staff flow.
          </div>
          <div className="liquid-chip rounded-[1.3rem] px-4 py-3 text-sm text-slate-100/82">
            Ручные записи и клиентские записи лежат в одной базе.
          </div>
          <div className="liquid-chip rounded-[1.3rem] px-4 py-3 text-sm text-slate-100/82">
            Слот исчезает, если его заняли или заблокировали.
          </div>
        </div>
      </div>
    </section>
  )
}
