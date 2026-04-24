import { getPayloadClient } from '@/lib/payload'

const demoServices = [
  {
    description: 'Классическая мужская стрижка с точной формой.',
    durationMinutes: 45,
    price: 900,
    title: 'Мужская стрижка',
  },
  {
    description: 'Женская стрижка со стайлингом.',
    durationMinutes: 60,
    price: 1400,
    title: 'Женская стрижка',
  },
  {
    description: 'Оформление бороды и контуров.',
    durationMinutes: 30,
    price: 700,
    title: 'Борода и контур',
  },
  {
    description: 'Фейд с чистыми переходами и укладкой.',
    durationMinutes: 50,
    price: 1100,
    title: 'Fade стрижка',
  },
  {
    description: 'Детская стрижка без сложной укладки.',
    durationMinutes: 35,
    price: 750,
    title: 'Детская стрижка',
  },
  {
    description: 'Стрижка машинкой одной или несколькими насадками.',
    durationMinutes: 25,
    price: 600,
    title: 'Стрижка машинкой',
  },
  {
    description: 'Женская укладка после стрижки или отдельно.',
    durationMinutes: 40,
    price: 1000,
    title: 'Укладка',
  },
  {
    description: 'Окрашивание корней или базовое тонирование.',
    durationMinutes: 120,
    price: 3200,
    title: 'Окрашивание',
  },
  {
    description: 'Комплекс стрижка плюс оформление бороды.',
    durationMinutes: 70,
    price: 1500,
    title: 'Стрижка + борода',
  },
  {
    description: 'Уходовая процедура с восстановлением волос.',
    durationMinutes: 50,
    price: 1600,
    title: 'Уход для волос',
  },
] as const

const demoMasters = [
  {
    name: 'Артем',
    serviceTitles: ['Мужская стрижка', 'Борода и контур', 'Fade стрижка', 'Стрижка + борода'],
    specialty: 'fade / classic',
    telegramUserId: '100001',
  },
  {
    name: 'Милана',
    serviceTitles: ['Женская стрижка', 'Укладка', 'Уход для волос'],
    specialty: 'women / styling',
    telegramUserId: '100002',
  },
  {
    name: 'Давид',
    serviceTitles: ['Мужская стрижка', 'Стрижка машинкой', 'Fade стрижка', 'Детская стрижка'],
    specialty: 'texture / crop',
    telegramUserId: '100003',
  },
  {
    name: 'Анна',
    serviceTitles: ['Женская стрижка', 'Окрашивание', 'Укладка', 'Уход для волос'],
    specialty: 'color / blonde',
    telegramUserId: '100004',
  },
  {
    name: 'Карен',
    serviceTitles: ['Мужская стрижка', 'Борода и контур', 'Стрижка + борода', 'Стрижка машинкой'],
    specialty: 'beard / barber',
    telegramUserId: '100005',
  },
  {
    name: 'Лиана',
    serviceTitles: ['Женская стрижка', 'Укладка', 'Детская стрижка'],
    specialty: 'soft layers / kids',
    telegramUserId: '100006',
  },
  {
    name: 'Макс',
    serviceTitles: ['Fade стрижка', 'Мужская стрижка', 'Стрижка машинкой'],
    specialty: 'skin fade / precision',
    telegramUserId: '100007',
  },
  {
    name: 'Сона',
    serviceTitles: ['Женская стрижка', 'Окрашивание', 'Уход для волос'],
    specialty: 'long hair / care',
    telegramUserId: '100008',
  },
] as const

const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

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

async function seedWorkingHours(masterId: string) {
  const payload = await getPayloadClient()

  for (const weekday of weekdays) {
    const existing = await payload.find({
      collection: 'working-hours',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: {
        and: [
          {
            master: {
              equals: masterId,
            },
          },
          {
            weekday: {
              equals: weekday,
            },
          },
        ],
      },
    })

    const data = {
      endTime: weekday === 'saturday' ? '16:00' : '20:00',
      isActive: true,
      master: masterId,
      startTime: '10:00',
      weekday,
    }

    if (existing.docs[0]) {
      await payload.update({
        collection: 'working-hours',
        data,
        id: existing.docs[0].id,
        overrideAccess: true,
      })
    } else {
      await payload.create({
        collection: 'working-hours',
        data,
        overrideAccess: true,
      })
    }
  }
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
    }

    const savedMaster = existingByName
      ? await payload.update({
          collection: 'masters',
          data,
          id: existingByName.id,
          overrideAccess: true,
        })
      : await payload.create({
          collection: 'masters',
          data,
          overrideAccess: true,
        })

    await seedWorkingHours(savedMaster.id)
  }

  return {
    masters: demoMasters.length,
    services: demoServices.length,
    workingHoursPerMaster: weekdays.length,
  }
}
