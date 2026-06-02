import { NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'

export const dynamic = 'force-dynamic'

export async function GET() {
  const data = await getSheetData()
  return NextResponse.json(data)
}
