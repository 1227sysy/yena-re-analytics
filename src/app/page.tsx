import { getSheetData } from '@/lib/sheets'
import { auth } from '@/auth'
import Dashboard from '@/components/Dashboard'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const [session, data] = await Promise.all([
    auth().catch(() => null),
    getSheetData(),
  ])

  return (
    <Dashboard
      data={data}
      user={session?.user ?? null}
    />
  )
}
