import { DateTime } from 'luxon'
import Link from 'next/link'

import type { ScheduleOverviewData } from '@/lib/calendar/schedule-overview'

function getStatusTone(status: string) {
  if (status === 'Cancelled') {
    return 'border-rose-400/30 bg-rose-400/10 text-rose-100'
  }

  if (status === 'Pending') {
    return 'border-amber-300/30 bg-amber-300/10 text-amber-50'
  }

  if (status === 'Completed' || status === 'No Show') {
    return 'border-slate-300/20 bg-slate-300/10 text-slate-200'
  }

  return 'border-emerald-300/25 bg-emerald-300/10 text-emerald-50'
}

type Props = {
  basePath: string
  data: ScheduleOverviewData
}

export function ScheduleCalendarPage(props: Props) {
  const { basePath, data } = props
  const previousDate =
    DateTime.fromISO(data.anchorDate).minus({ weeks: 1 }).toISODate() || data.anchorDate
  const nextDate =
    DateTime.fromISO(data.anchorDate).plus({ weeks: 1 }).toISODate() || data.anchorDate

  return (
    <div className="liquid-page min-h-screen text-slate-50">
      <div className="liquid-orb left-[6%] top-20 h-56 w-56 bg-[radial-gradient(circle,_rgba(152,210,255,0.28),_transparent_70%)]" />
      <div className="liquid-orb right-[4%] top-40 h-72 w-72 bg-[radial-gradient(circle,_rgba(146,255,216,0.18),_transparent_70%)]" />
      <div className="liquid-grid-glow absolute inset-x-0 top-0 h-[34rem]" />

      <div className="mx-auto flex min-h-screen max-w-[1680px] flex-col gap-6 px-4 py-5 sm:px-7 sm:py-8 lg:px-10">
        <section className="liquid-shell overflow-hidden rounded-[2rem] p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--liquid-accent)]">
                Salon operations calendar
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                Weekly schedule overview
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300/78 sm:text-base">
                Each master row shows regular weekly hours, one-off exceptions, and bookings for the
                selected week. This is the screen a salon owner can scan in seconds.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                className="liquid-chip rounded-full px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10"
                href={`${basePath}?date=${previousDate}`}
              >
                Previous week
              </Link>
              <div className="liquid-chip rounded-full px-5 py-2 text-sm font-medium text-white">
                {data.rangeLabel}
              </div>
              <Link
                className="liquid-button rounded-full px-4 py-2 text-sm font-medium transition hover:brightness-105"
                href={`${basePath}?date=${nextDate}`}
              >
                Next week
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="liquid-panel rounded-[1.5rem] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-300/62">Masters</p>
              <p className="mt-3 text-3xl font-semibold text-white">{data.masterCount}</p>
              <p className="mt-2 text-sm text-slate-300/72">Active specialists visible this week</p>
            </div>
            <div className="liquid-panel rounded-[1.5rem] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-300/62">Bookings</p>
              <p className="mt-3 text-3xl font-semibold text-white">{data.totalBookings}</p>
              <p className="mt-2 text-sm text-slate-300/72">
                {data.todayBookingsCount} appointments fall on today
              </p>
            </div>
            <div className="liquid-panel rounded-[1.5rem] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-300/62">Exceptions</p>
              <p className="mt-3 text-3xl font-semibold text-white">{data.exceptionCount}</p>
              <p className="mt-2 text-sm text-slate-300/72">
                Day off, break and blocked intervals in this week
              </p>
            </div>
          </div>
        </section>

        <section className="liquid-shell rounded-[2rem] p-4 sm:p-5">
          <div className="overflow-x-auto pb-2">
            <div className="grid min-w-[1340px] grid-cols-[260px_repeat(7,minmax(170px,1fr))] gap-3">
              <div className="liquid-panel rounded-[1.4rem] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-300/58">Masters</p>
                <p className="mt-3 text-lg font-medium text-white">Base weekly schedule</p>
              </div>

              {data.weekDays.map((day) => (
                <div
                  className={`rounded-[1.4rem] border p-4 ${
                    day.isToday
                      ? 'border-[rgba(151,247,214,0.4)] bg-[rgba(151,247,214,0.12)] text-white'
                      : 'liquid-panel text-slate-100'
                  }`}
                  key={day.date}
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-300/62">
                    {day.shortLabel}
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-white">{day.label}</p>
                </div>
              ))}

              {data.masters.map((master) => (
                <FragmentRow key={master.id} master={master} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function FragmentRow(props: { master: ScheduleOverviewData['masters'][number] }) {
  const { master } = props

  return (
    <>
      <div className="liquid-panel flex h-full flex-col justify-between rounded-[1.5rem] p-4">
        <div>
          <p className="text-xl font-semibold text-white">{master.name}</p>
          <p className="mt-2 text-sm text-slate-300/74">{master.specialty || 'Salon specialist'}</p>
        </div>

        <p className="mt-5 text-sm leading-6 text-slate-200/78">{master.weeklySummary}</p>
      </div>

      {master.days.map((day) => (
        <div
          className={`rounded-[1.5rem] border p-3 ${
            day.hasDayOff
              ? 'border-rose-300/24 bg-[rgba(120,21,49,0.24)]'
              : day.isWorkingDay
                ? 'liquid-panel-soft'
                : 'border-white/6 bg-[rgba(8,14,25,0.45)]'
          }`}
          key={`${master.id}:${day.date}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-slate-300/52">
              {day.workingHoursLabel || 'Day off'}
            </span>
            <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-slate-200/78">
              {day.bookings.length} bookings
            </span>
          </div>

          {day.exceptions.length > 0 && (
            <div className="mt-3 space-y-2">
              {day.exceptions.map((exception) => (
                <div
                  className="rounded-2xl border border-white/8 bg-white/6 px-3 py-2 text-xs text-slate-100"
                  key={exception.id}
                >
                  <p className="font-medium text-white">{exception.label}</p>
                  <p className="mt-1 text-slate-300/74">{exception.reason}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 space-y-2">
            {day.bookings.map((booking) => (
              <div
                className="rounded-2xl border border-white/10 bg-[rgba(5,13,24,0.74)] px-3 py-3"
                key={booking.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {booking.startLabel} - {booking.endLabel}
                    </p>
                    <p className="mt-1 text-sm text-slate-200">{booking.clientName}</p>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-1 text-[11px] font-medium ${getStatusTone(
                      booking.status,
                    )}`}
                  >
                    {booking.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-300/74">{booking.serviceTitle}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-400/82">
                  {booking.source}
                </p>
              </div>
            ))}

            {day.bookings.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/10 px-3 py-4 text-sm text-slate-400/78">
                No bookings
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  )
}
