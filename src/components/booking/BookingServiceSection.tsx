import type { PublicServiceItem } from '@/lib/booking/types'

type BookingServiceSectionProps = {
  onServiceChange: (serviceId: string) => void
  selectedService: PublicServiceItem | null
  selectedServiceId: string
  services: PublicServiceItem[]
}

export function BookingServiceSection(props: BookingServiceSectionProps) {
  const { onServiceChange, selectedService, selectedServiceId, services } = props

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.26em] text-slate-300/56">
          Ծառայություն
        </span>
        <select
          className="liquid-input w-full rounded-[1.35rem] px-4 py-4 text-white"
          onChange={(event) => onServiceChange(event.target.value)}
          value={selectedServiceId}
        >
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.title} • {service.durationMinutes} րոպե • {service.price} ֏
            </option>
          ))}
        </select>
      </label>

      <div className="liquid-panel-soft flex items-center rounded-[1.35rem] px-4 py-4 text-sm text-slate-200/74">
        {selectedService ? (
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-300/52">Ընտրված է</p>
            <p className="mt-2 text-base font-medium text-white">{selectedService.title}</p>
            <p className="mt-1 text-sm text-slate-300/60">
              {selectedService.durationMinutes} րոպե • {selectedService.price} ֏
            </p>
          </div>
        ) : (
          'Ընտրիր ծառայությունը՝ մասնագետներին տեսնելու համար'
        )}
      </div>
    </div>
  )
}
