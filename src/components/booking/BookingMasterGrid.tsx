'use client'

import Image from 'next/image'

import type { PublicMasterItem } from '@/lib/booking/types'

import { getMasterInitials } from './booking-helpers'

type BookingMasterGridProps = {
  activeMasterId: string
  masters: PublicMasterItem[]
  onMasterSelect: (masterId: string) => void
}

export function BookingMasterGrid(props: BookingMasterGridProps) {
  const { activeMasterId, masters, onMasterSelect } = props

  return (
    <div className="mt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs uppercase tracking-[0.26em] text-slate-300/56">Մասնագետ</span>
        <span className="text-xs text-slate-300/62">{masters.length} հասանելի</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {masters.map((master) => {
          const isSelected = activeMasterId === master.id

          return (
            <button
              key={master.id}
              className="text-left transition hover:scale-[1.01]"
              onClick={() => onMasterSelect(master.id)}
              type="button"
            >
              <div
                className={`rounded-[1.45rem] border p-3 ${
                  isSelected
                    ? 'border-emerald-200/46 bg-[linear-gradient(135deg,_rgba(151,247,214,0.22),_rgba(155,196,255,0.14))]'
                    : 'border-white/10 bg-[linear-gradient(135deg,_rgba(255,255,255,0.12),_rgba(255,255,255,0.05))]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-16 w-16 overflow-hidden rounded-[1.1rem] border border-white/10 bg-[linear-gradient(135deg,_rgba(151,247,214,0.24),_rgba(155,196,255,0.16))]">
                    {master.photoUrl ? (
                      <Image
                        alt={master.photoAlt || master.name}
                        className="h-full w-full object-cover"
                        fill
                        sizes="64px"
                        src={master.photoUrl}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-white">
                        {getMasterInitials(master.name)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-base font-medium text-white">{master.name}</p>
                    <p className="mt-1 truncate text-sm text-slate-300/60">
                      {master.specialty || 'Սրահի մասնագետ'}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          )
        })}

        {!masters.length && (
          <div className="liquid-panel-soft col-span-full rounded-[1.45rem] px-4 py-7 text-sm text-slate-300/68">
            Ընտրված ծառայության համար հասանելի մասնագետներ չկան։
          </div>
        )}
      </div>
    </div>
  )
}
