import { getSheetData } from '@/lib/sheets'
import Dashboard from '@/components/Dashboard'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const data = await getSheetData()
  return <Dashboard data={data} />
}
