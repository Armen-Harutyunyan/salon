type BookingHeroStat = {
  label: string
  value: string
}

type BookingHeroProps = {
  stats: BookingHeroStat[]
}

export function BookingHero(props: BookingHeroProps) {
  const { stats } = props

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <div className="liquid-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-cyan-100/78">
          <span className="h-2 w-2 rounded-full bg-emerald-200 shadow-[0_0_18px_rgba(151,247,214,0.8)]" />
          արագ ամրագրում
        </div>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
          Ամրագրում սրահում առանց ավելորդ բարդության։
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200/70">
          Ընտրիր ծառայությունը, մասնագետին և ազատ ժամը։ Միայն անհրաժեշտ քայլեր, առանց ավելորդ
          աղմուկի ու ծանր ինտերֆեյսի։
        </p>
      </div>

      <div className="grid w-full max-w-[28rem] auto-rows-fr grid-cols-2 gap-3 self-stretch sm:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.label}
            className="liquid-panel-soft last:col-span-2 flex min-h-[7.25rem] flex-col gap-3 rounded-[1.45rem] px-4 py-4 sm:last:col-span-1"
          >
            <p className="max-w-full text-[11px] leading-[1.15rem] tracking-[0.04em] text-slate-300/60 [overflow-wrap:anywhere] sm:max-w-none sm:text-xs sm:tracking-[0.08em]">
              {item.label}
            </p>
            <p className="text-[1.35rem] font-semibold leading-none tracking-[-0.04em] text-white sm:text-[1.75rem]">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
