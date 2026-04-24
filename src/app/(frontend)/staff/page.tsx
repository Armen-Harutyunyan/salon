import { StaffMiniApp } from '@/components/staff/StaffMiniApp'

type StaffPageProps = {
  searchParams: Promise<{
    token?: string
  }>
}

export default async function StaffPage(props: StaffPageProps) {
  const searchParams = await props.searchParams

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_32%),linear-gradient(180deg,_#111827,_#020617)] px-5 py-8 text-stone-50 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <StaffMiniApp token={searchParams.token || ''} />
      </div>
    </div>
  )
}
