import { seedDemoSalonData } from '../src/lib/demo-seed'

async function main() {
  const result = await seedDemoSalonData()

  console.log(
    `Demo salon data seeded. Services: ${result.services}, masters: ${result.masters}, weekdays per master: ${result.workingHoursPerMaster}.`,
  )
}

void main()
