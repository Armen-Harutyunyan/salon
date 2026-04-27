import { getPayloadClient } from '@/lib/payload'
import type { WeekdayValue } from './booking/weekly-schedule'

const demoServices = [
  {
    description: 'Դասական տղամարդկանց սանրվածք՝ հստակ ձևով և մաքուր ավարտով։',
    durationMinutes: 45,
    price: 900,
    title: 'Տղամարդկանց սանրվածք',
  },
  {
    description: 'Կանացի սանրվածք՝ հարդարմամբ։',
    durationMinutes: 60,
    price: 1400,
    title: 'Կանացի սանրվածք',
  },
  {
    description: 'Մորուքի ձևավորում և եզրագծերի մշակում։',
    durationMinutes: 30,
    price: 700,
    title: 'Մորուք և կոնտուր',
  },
  {
    description: 'Fade սանրվածք՝ մաքուր անցումներով և հարդարմամբ։',
    durationMinutes: 50,
    price: 1100,
    title: 'Fade սանրվածք',
  },
  {
    description: 'Մանկական սանրվածք՝ առանց բարդ հարդարման։',
    durationMinutes: 35,
    price: 750,
    title: 'Մանկական սանրվածք',
  },
  {
    description: 'Սանրվածք մեքենայով՝ մեկ կամ մի քանի գլխիկով։',
    durationMinutes: 25,
    price: 600,
    title: 'Սանրվածք մեքենայով',
  },
  {
    description: 'Կանացի հարդարում՝ սանրվածքից հետո կամ առանձին։',
    durationMinutes: 40,
    price: 1000,
    title: 'Հարդարում',
  },
  {
    description: 'Արմատների ներկում կամ բազային տոնավորում։',
    durationMinutes: 120,
    price: 3200,
    title: 'Ներկում',
  },
  {
    description: 'Համակցված ծառայություն՝ սանրվածք և մորուքի ձևավորում։',
    durationMinutes: 70,
    price: 1500,
    title: 'Սանրվածք + մորուք',
  },
  {
    description: 'Մազերի խնամքի վերականգնող պրոցեդուրա։',
    durationMinutes: 50,
    price: 1600,
    title: 'Մազերի խնամք',
  },
] as const

const demoMasters = [
  {
    name: 'Արմեն',
    serviceTitles: [
      'Տղամարդկանց սանրվածք',
      'Մորուք և կոնտուր',
      'Fade սանրվածք',
      'Սանրվածք + մորուք',
    ],
    specialty: 'fade / դասական',
    telegramUserId: '100001',
  },
  {
    name: 'Միլենա',
    serviceTitles: ['Կանացի սանրվածք', 'Հարդարում', 'Մազերի խնամք'],
    specialty: 'կանացի / հարդարում',
    telegramUserId: '100002',
  },
  {
    name: 'Դավիթ',
    serviceTitles: [
      'Տղամարդկանց սանրվածք',
      'Սանրվածք մեքենայով',
      'Fade սանրվածք',
      'Մանկական սանրվածք',
    ],
    specialty: 'texture / crop',
    telegramUserId: '100003',
  },
  {
    name: 'Աննա',
    serviceTitles: ['Կանացի սանրվածք', 'Ներկում', 'Հարդարում', 'Մազերի խնամք'],
    specialty: 'գույն / blonde',
    telegramUserId: '100004',
  },
  {
    name: 'Կարեն',
    serviceTitles: [
      'Տղամարդկանց սանրվածք',
      'Մորուք և կոնտուր',
      'Սանրվածք + մորուք',
      'Սանրվածք մեքենայով',
    ],
    specialty: 'մորուք / barber',
    telegramUserId: '100005',
  },
  {
    name: 'Լիանա',
    serviceTitles: ['Կանացի սանրվածք', 'Հարդարում', 'Մանկական սանրվածք'],
    specialty: 'soft layers / kids',
    telegramUserId: '100006',
  },
  {
    name: 'Մաքս',
    serviceTitles: ['Fade սանրվածք', 'Տղամարդկանց սանրվածք', 'Սանրվածք մեքենայով'],
    specialty: 'skin fade / ճշգրտություն',
    telegramUserId: '100007',
  },
  {
    name: 'Սոնա',
    serviceTitles: ['Կանացի սանրվածք', 'Ներկում', 'Մազերի խնամք'],
    specialty: 'երկար մազեր / խնամք',
    telegramUserId: '100008',
  },
] as const

const weekdays: WeekdayValue[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]

async function upsertService(
  title: string,
  data: { description: string; durationMinutes: number; price: number },
) {
  const payload = await getPayloadClient()
  const existing = await payload.find({
    collection: 'services',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      title: {
        equals: title,
      },
    },
  })

  if (existing.docs[0]) {
    return payload.update({
      collection: 'services',
      data: {
        ...data,
        isActive: true,
        title,
      },
      id: existing.docs[0].id,
      overrideAccess: true,
    })
  }

  return payload.create({
    collection: 'services',
    data: {
      ...data,
      isActive: true,
      title,
    },
    overrideAccess: true,
  })
}

function buildWeeklySchedule() {
  return Object.fromEntries(
    weekdays.map((weekday) => [
      weekday,
      {
        enabled: true,
        endTime: weekday === 'saturday' ? '16:00' : '20:00',
        startTime: '10:00',
      },
    ]),
  )
}

export async function seedDemoSalonData() {
  const payload = await getPayloadClient()
  const serviceMap = new Map<string, string>()

  for (const service of demoServices) {
    const created = await upsertService(service.title, {
      description: service.description,
      durationMinutes: service.durationMinutes,
      price: service.price,
    })

    serviceMap.set(service.title, created.id)
  }

  for (const master of demoMasters) {
    const serviceIds = master.serviceTitles
      .map((title) => serviceMap.get(title))
      .filter((value): value is string => Boolean(value))

    const existingByTelegram = await payload.find({
      collection: 'masters',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: {
        telegramUserId: {
          equals: master.telegramUserId,
        },
      },
    })

    const existingByName =
      existingByTelegram.docs[0] ||
      (
        await payload.find({
          collection: 'masters',
          depth: 0,
          limit: 1,
          overrideAccess: true,
          where: {
            name: {
              equals: master.name,
            },
          },
        })
      ).docs[0]

    const data = {
      isActive: true,
      name: master.name,
      services: serviceIds,
      specialty: master.specialty,
      telegramUserId: master.telegramUserId,
      weeklySchedule: buildWeeklySchedule(),
    }

    if (existingByName) {
      await payload.update({
        collection: 'masters',
        data,
        id: existingByName.id,
        overrideAccess: true,
      })
    } else {
      await payload.create({
        collection: 'masters',
        data,
        overrideAccess: true,
      })
    }
  }

  return {
    masters: demoMasters.length,
    services: demoServices.length,
    workingHoursPerMaster: weekdays.length,
  }
}
