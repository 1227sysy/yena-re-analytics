import { google } from 'googleapis'
import { execSync } from 'child_process'
import { analyzeSheet } from './columnMapper'
import type { DashboardData, DashboardStats, URLColumnStat, CategoryColumnStats, FlagStat } from '@/types'

// ─── gws CLI fallback (로컬 개발 전용) ────────────────────────────────────────
async function fetchViaGwsCli(
  spreadsheetId: string,
  tabName: string
): Promise<{ headers: string[]; rows: string[][]; sheetTitle: string } | null> {
  try {
    const params = JSON.stringify({ spreadsheetId, range: tabName })
    const cmd = `npx --yes @googleworkspace/cli sheets spreadsheets values get --params ${JSON.stringify(params)}`
    const raw = execSync(cmd, {
      encoding: 'utf8',
      timeout: 20000,
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
    })
    const jsonStart = raw.indexOf('{')
    if (jsonStart === -1) return null
    const parsed = JSON.parse(raw.slice(jsonStart)) as { values?: string[][] }
    const values = parsed.values ?? []
    if (values.length < 2) return null

    // Also fetch spreadsheet title
    let sheetTitle = tabName
    try {
      const metaParams = JSON.stringify({ spreadsheetId })
      const metaCmd = `npx --yes @googleworkspace/cli sheets spreadsheets get --params ${JSON.stringify(metaParams)}`
      const metaRaw = execSync(metaCmd, {
        encoding: 'utf8', timeout: 10000,
        shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
      })
      const metaJson = metaRaw.slice(metaRaw.indexOf('{'))
      const meta = JSON.parse(metaJson) as { properties?: { title?: string } }
      sheetTitle = meta.properties?.title ?? tabName
    } catch { /* ignore */ }

    const headers = values[0] as string[]
    const rows = values.slice(1).filter(row =>
      (row as string[]).some(cell => (cell ?? '').trim() !== '')
    ) as string[][]

    return { headers, rows, sheetTitle }
  } catch {
    return null
  }
}

// ─── Demo fallback ────────────────────────────────────────────────────────────
const DEMO_HEADERS = ['no', '이름', '이메일', '1일차 URL', '2일차 URL', '3일차 URL']
const DEMO_ROWS: string[][] = [
  ['1','김유빈','yubin120866@gmail.com','https://cheongak-dashboard-opal.vercel.app','https://demo2.vercel.app',''],
  ['2','김민선','min02026@naver.com','https://cheongak-dashboard-six.vercel.app/','https://demo2b.vercel.app','https://demo3.vercel.app'],
  ['3','이유정','youj0214@naver.com','https://cheongyak-dashboard-15cu.vercel.app/','',''],
  ['4','한수연','','','',''],
  ['5','조준환','tonycico@gmail.com','https://subscription-lime.vercel.app/','https://demo2c.vercel.app',''],
  ['6','류호윤','hoyun0131.intelligence@gmail.com','https://krema-ai-edu-ply8.vercel.app/','https://demo2d.vercel.app','https://demo3b.vercel.app'],
  ['7','박선민','tsusopuraifu@gmail.com','https://cheongak-dashboard-seven.vercel.app/','',''],
  ['8','곽은선','kwakeunsun@naver.com','https://apt-dashboard-six.vercel.app/','https://demo2e.vercel.app',''],
  ['9','박형훈','jimmy7877@naver.com','https://cheongyak-dashboard-cyan.vercel.app','https://demo2f.vercel.app','https://demo3c.vercel.app'],
  ['10','박예나','1227sysy@gmail.com','https://cheongyak-dashboard-gamma.vercel.app','https://demo2g.vercel.app','https://demo3d.vercel.app'],
  ['11','이현지','kltreee111@gmail.com','https://cheongak-dashboard-thii.vercel.app/','',''],
  ['12','임정은','hi3hello33@naver.com','https://dashboard-1-objp.vercel.app/','https://demo2h.vercel.app',''],
  ['13','이은호','eunho1ee@naver.com','https://cheongak-dashboard-git-master.vercel.app/','https://demo2i.vercel.app','https://demo3e.vercel.app'],
  ['14','이지윤','rovalcrown@naver.com','청약 대시보드','',''],
  ['15','황조은','joan0123@naver.com','https://cheongyak-dashboard-nine.vercel.app/','https://demo2j.vercel.app',''],
  ['16','이예슬','lysmemo@naver.com','https://i-15ld.vercel.app/','https://demo2k.vercel.app','https://demo3f.vercel.app'],
  ['17','원재웅','jaywwon@gmail.com','https://chungyak-dashboard.vercel.app/','https://demo2l.vercel.app',''],
]

// ─── Main entry ───────────────────────────────────────────────────────────────
export async function getSheetData(): Promise<DashboardData> {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID ?? '1zVrJhs_0sB3wSP-vpV23usjBfS7zfPeBi8oTx_jZ9qw'
  const tabName = process.env.GOOGLE_SHEET_TAB ?? 'Rawdata'

  // ① Service account (production)
  if (serviceAccountJson && serviceAccountJson !== '여기에_JSON_한_줄로') {
    return fetchViaServiceAccount(serviceAccountJson, spreadsheetId, tabName)
  }

  // ② gws CLI (local dev — already authenticated)
  const gwsData = await fetchViaGwsCli(spreadsheetId, tabName)
  if (gwsData) {
    const { headers, rows, sheetTitle } = gwsData
    const analysis = analyzeSheet(headers, rows)
    const stats = computeStats(headers, rows, analysis)
    return { analysis, headers, rows, stats, lastUpdated: new Date().toISOString(), sheetTitle }
  }

  // ③ Demo fallback
  const analysis = analyzeSheet(DEMO_HEADERS, DEMO_ROWS)
  const stats = computeStats(DEMO_HEADERS, DEMO_ROWS, analysis)
  return {
    analysis, headers: DEMO_HEADERS, rows: DEMO_ROWS, stats,
    lastUpdated: new Date().toISOString(),
    sheetTitle: 'KREMA AI 심화 교육 작업물 [데모 모드]',
  }
}

// ─── Service account auth ─────────────────────────────────────────────────────
async function fetchViaServiceAccount(
  serviceAccountJson: string,
  spreadsheetId: string,
  tabName: string
): Promise<DashboardData> {
  if (!spreadsheetId) return makeError('GOOGLE_SHEETS_ID가 설정되지 않았습니다.')
  try {
    const credentials = JSON.parse(serviceAccountJson)
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })
    const sheetsApi = google.sheets({ version: 'v4', auth })

    let sheetTitle = tabName
    try {
      const meta = await sheetsApi.spreadsheets.get({ spreadsheetId })
      sheetTitle = meta.data.properties?.title ?? tabName
    } catch { /* ignore */ }

    const response = await sheetsApi.spreadsheets.values.get({ spreadsheetId, range: tabName })
    const values = (response.data.values ?? []) as string[][]
    if (values.length < 2) return makeError('시트에 데이터가 없습니다.', sheetTitle)

    const headers = values[0]
    const rows = values.slice(1).filter(row => row.some(c => (c ?? '').trim() !== ''))
    const analysis = analyzeSheet(headers, rows)
    const stats = computeStats(headers, rows, analysis)
    return { analysis, headers, rows, stats, lastUpdated: new Date().toISOString(), sheetTitle }
  } catch (err) {
    return makeError(err instanceof Error ? err.message : String(err))
  }
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function computeStats(
  _headers: string[],
  rows: string[][],
  analysis: ReturnType<typeof analyzeSheet>
): DashboardStats {
  const totalRows = rows.length

  const emailCount = analysis.emailColumns.length > 0
    ? rows.filter(r => (r[analysis.emailColumns[0].index] ?? '').trim().length > 0).length
    : 0

  const urlStats: URLColumnStat[] = analysis.urlColumns.map(col => {
    const submittedCount = rows.filter(r => (r[col.index] ?? '').trim().length > 0).length
    return {
      dayNum: col.dayNum, header: col.header, submittedCount,
      total: totalRows,
      rate: totalRows > 0 ? Math.round((submittedCount / totalRows) * 100) : 0,
    }
  })

  const fullyComplete = rows.filter(row =>
    analysis.urlColumns.every(col => (row[col.index] ?? '').trim().length > 0)
  ).length
  const completionRate = totalRows > 0 ? Math.round((fullyComplete / totalRows) * 100) : 0

  const nameCol = analysis.nameColumn
  const emailCol = analysis.emailColumns[0]
  const incompleteStudents = analysis.urlColumns.length > 0
    ? rows.map((row, i) => {
        const missing = analysis.urlColumns
          .filter(col => (row[col.index] ?? '').trim() === '')
          .map(col => col.header)
        if (missing.length === 0) return null
        return {
          name: nameCol ? (row[nameCol.index] ?? '이름없음') : `행 ${i + 2}`,
          email: emailCol ? (row[emailCol.index] ?? '') : '',
          missing, rowIndex: i,
        }
      }).filter((x): x is NonNullable<typeof x> => x !== null)
    : []

  // Category stats (top 10 values per column)
  const categoryStats: CategoryColumnStats[] = analysis.categoryColumns.map(col => {
    const freq: Record<string, number> = {}
    rows.forEach(r => {
      const v = (r[col.index] ?? '').trim()
      if (v) freq[v] = (freq[v] ?? 0) + 1
    })
    const sorted = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([value, count]) => ({ value, count, pct: Math.round((count / totalRows) * 100) }))
    return { header: col.header, role: col.role, index: col.index, values: sorted }
  })

  // Status stats
  const statusStats: CategoryColumnStats[] = analysis.statusColumns.map(col => {
    const freq: Record<string, number> = {}
    rows.forEach(r => {
      const v = (r[col.index] ?? '').trim()
      if (v) freq[v] = (freq[v] ?? 0) + 1
    })
    const sorted = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .map(([value, count]) => ({ value, count, pct: Math.round((count / totalRows) * 100) }))
    return { header: col.header, role: col.role, index: col.index, values: sorted }
  })

  // Flag/boolean stats
  const TRUTHY = new Set(['true', '예', 'yes', '검토필요', '지연', 'o', '✓', '1'])
  const flagStats: FlagStat[] = analysis.flagColumns.map(col => {
    const trueCount = rows.filter(r => {
      const v = (r[col.index] ?? '').trim().toLowerCase()
      return v !== '' && TRUTHY.has(v)
    }).length
    return {
      header: col.header, role: col.role, trueCount, total: totalRows,
      rate: totalRows > 0 ? Math.round((trueCount / totalRows) * 100) : 0,
    }
  })

  const emailRate = totalRows > 0 ? emailCount / totalRows : 1
  const avgUrlRate = urlStats.length > 0
    ? urlStats.reduce((s, u) => s + u.rate, 0) / urlStats.length / 100 : 1
  const score = (emailRate + avgUrlRate) / 2
  const dataQuality =
    score >= 0.9 ? 'excellent' : score >= 0.75 ? 'good' : score >= 0.5 ? 'fair' : 'poor'

  return { totalRows, emailCount, urlStats, completionRate, incompleteStudents, dataQuality, categoryStats, statusStats, flagStats }
}

function makeError(error: string, sheetTitle = ''): DashboardData {
  return {
    analysis: {
      columns: [], datasetType: 'general',
      urlColumns: [], emailColumns: [],
      dateColumns: [], statusColumns: [], numericColumns: [],
      categoryColumns: [], flagColumns: [],
    },
    headers: [], rows: [],
    stats: {
      totalRows: 0, emailCount: 0, urlStats: [], completionRate: 0,
      incompleteStudents: [], dataQuality: 'poor',
      categoryStats: [], statusStats: [], flagStats: [],
    },
    lastUpdated: new Date().toISOString(),
    sheetTitle, error,
  }
}
