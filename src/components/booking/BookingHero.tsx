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

      <div className="grid grid-cols-3 gap-3 self-stretch lg:w-[22rem]">
        {stats.map((item) => (
          <div
            key={item.label}
            className="liquid-panel-soft flex min-h-[8.6rem] flex-col justify-between rounded-[1.45rem] px-4 py-4"
          >
            <p className="text-[10px] leading-tight tracking-[0.08em] text-slate-300/55 sm:tracking-[0.12em]">
              {item.label}
            </p>
            <p className="mt-3 text-xl font-semibold leading-none tracking-[-0.04em] text-white sm:text-[1.75rem]">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
