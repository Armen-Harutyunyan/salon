import type { GroupField, Payload } from 'payload'

import { weekdays } from '@/constants/booking'
import type { Master, WorkingHour } from '@/payload-types'
import { ensureValidTimeRange } from './validation'

export type WeekdayValue =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

type WorkingDayValue = {
  enabled?: boolean | null
  endTime?: null | string
  startTime?: null | string
}

type WeeklyScheduleValue = Partial<Record<WeekdayValue, WorkingDayValue | null>> | null | undefined

export const weekdayOrder = weekdays.map((item) => item.value) as WeekdayValue[]

const weekdayLabelMap = Object.fromEntries(
  weekdays.map((item) => [item.value, item.label]),
) as Record<WeekdayValue, string>

function buildWorkingDayField(name: WeekdayValue): GroupField {
  return {
    name,
    type: 'group',
    label: weekdayLabelMap[name],
    fields: [
      {
        name: 'enabled',
        label: 'Works this day',
        type: 'checkbox',
        defaultValue: false,
      },
      {
        type: 'row',
        fields: [
          {
            name: 'startTime',
            label: 'Start',
            type: 'text',
            admin: {
              condition: (_, siblingData) => Boolean(siblingData?.enabled),
              description: 'Format HH:MM, for example 10:00',
              width: '50%',
            },
          },
          {
            name: 'endTime',
            label: 'End',
            type: 'text',
            admin: {
              condition: (_, siblingData) => Boolean(siblingData?.enabled),
              description: 'Format HH:MM, for example 20:00',
              width: '50%',
            },
          },
        ],
      },
    ],
  }
}

export function buildWeeklyScheduleField(): GroupField {
  return {
    name: 'weeklySchedule',
    type: 'group',
    label: 'Weekly Schedule',
    admin: {
      description: 'Set the master weekly working days and core working hours.',
    },
    fields: weekdayOrder.map((weekday) => buildWorkingDayField(weekday)),
  }
}

export function validateWeeklySchedule(value: WeeklyScheduleValue) {
  if (!value) {
    return
  }

  for (const weekday of weekdayOrder) {
    const day = value[weekday]

    if (!day?.enabled) {
      continue
    }

    if (!(day.startTime && day.endTime)) {
      throw new Error(`${weekdayLabelMap[weekday]} working hours are required`)
    }

    ensureValidTimeRange(
      day.startTime,
      day.endTime,
      `${weekdayLabelMap[weekday]} hours are invalid`,
    )
  }
}

export function hasConfiguredWeeklySchedule(value: WeeklyScheduleValue) {
  if (!value) {
    return false
  }

  return weekdayOrder.some((weekday) => {
    const day = value[weekday]

    return Boolean(day?.enabled || day?.startTime || day?.endTime)
  })
}

export function formatWeeklyScheduleLabel(master: Pick<Master, 'weeklySchedule'>) {
  const parts = weekdayOrder.flatMap((weekday) => {
    const interval = getMasterWorkingInterval(master, weekday)

    if (!interval) {
      return []
    }

    return `${weekdayLabelMap[weekday]} ${interval.startTime}-${interval.endTime}`
  })

  return parts.join(' • ')
}

export function createWeeklyScheduleFromLegacyHours(workingHours: WorkingHour[]) {
  const schedule: Record<WeekdayValue, WorkingDayValue> = {} as Record<
    WeekdayValue,
    WorkingDayValue
  >

  for (const weekday of weekdayOrder) {
    const match = workingHours.find((item) => item.weekday === weekday && item.isActive)

    if (!match) {
      continue
    }

    schedule[weekday] = {
      enabled: true,
      endTime: match.endTime,
      startTime: match.startTime,
    }
  }

  return schedule
}

export async function hydrateMasterWeeklySchedule(payload: Payload, master: Master) {
  if (!(master.id && !hasConfiguredWeeklySchedule(master.weeklySchedule))) {
    return master
  }

  const result = await payload.find({
    collection: 'working-hours',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    where: {
      and: [
        {
          master: {
            equals: master.id,
          },
        },
        {
          isActive: {
            equals: true,
          },
        },
      ],
    },
  })

  const workingHours = result.docs as WorkingHour[]

  if (!workingHours.length) {
    return master
  }

  return {
    ...master,
    weeklySchedule: createWeeklyScheduleFromLegacyHours(workingHours),
  }
}

export function getMasterWorkingInterval(
  master: Pick<Master, 'weeklySchedule'>,
  weekday: WeekdayValue,
): null | { endTime: string; startTime: string } {
  const day = master.weeklySchedule?.[weekday]

  if (!(day?.enabled && day.startTime && day.endTime)) {
    return null
  }

  return {
    endTime: day.endTime,
    startTime: day.startTime,
  }
}

export function getWeekdayLabel(weekday: WeekdayValue) {
  return weekdayLabelMap[weekday]
}
