import { BookingMiniApp } from '@/components/booking/BookingMiniApp'

export default function HomePage() {
  return (
    <div className="liquid-page min-h-screen text-slate-50">
      <div className="liquid-orb left-[4%] top-28 h-44 w-44 bg-[radial-gradient(circle,_rgba(155,196,255,0.4),_transparent_72%)]" />
      <div className="liquid-orb right-[6%] top-[28rem] h-56 w-56 bg-[radial-gradient(circle,_rgba(151,247,214,0.28),_transparent_72%)]" />
      <div className="liquid-grid-glow absolute inset-x-0 top-0 h-[32rem]" />
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 sm:px-7 sm:py-8 lg:px-10">
        <BookingMiniApp />
      </div>
    </div>
  )
}
