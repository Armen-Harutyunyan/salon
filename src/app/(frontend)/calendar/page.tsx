import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { ScheduleCalendarPage } from '@/components/calendar/ScheduleCalendarPage'
import { getScheduleOverview } from '@/lib/calendar/schedule-overview'
import { getPayloadClient } from '@/lib/payload'

type Props = {
  searchParams: Promise<{
    date?: string
  }>
}

export default async function CalendarPage(props: Props) {
  const payload = await getPayloadClient()
  const auth = await payload.auth({
    headers: await headers(),
  })

  if (!auth.user) {
    redirect('/admin/login')
  }

  const searchParams = await props.searchParams
  const data = await getScheduleOverview(payload, {
    date: searchParams.date,
  })

  return <ScheduleCalendarPage basePath="/calendar" data={data} />
}
