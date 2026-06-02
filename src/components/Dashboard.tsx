'use client'

import { useState, useEffect, useCallback, CSSProperties } from 'react'
import type {
  DashboardData, CategoryColumnStats, CategoryStat, IncompleteStudent,
} from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const card: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: '0 2px 12px rgba(124,92,252,0.06), 0 1px 3px rgba(0,0,0,0.04)',
}

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (d < 60) return '방금 전'
  if (d < 3600) return `${Math.floor(d / 60)}분 전`
  return `${Math.floor(d / 3600)}시간 전`
}

function maskEmail(e: string) {
  const [l, d] = e.split('@'); if (!l || !d) return e
  return `${l.length <= 2 ? '*'.repeat(l.length) : l[0] + '**'}@${d}`
}

function GlowDot({ color = 'var(--accent)' }: { color?: string }) {
  return <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 0 2px white, 0 0 0 3.5px ${color}33` }} />
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
      <GlowDot />
      <span className="label">{children}</span>
    </div>
  )
}

// ─── Status badge colors ──────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  '회신완료': 'badge-green', '처리완료': 'badge-green', '완료': 'badge-green',
  '신규(대기)': 'badge-blue', '신규': 'badge-blue', '대기': 'badge-blue',
  '조치필요': 'badge-red', '지연': 'badge-red', '검토필요': 'badge-amber',
  '자동분류': 'badge-muted', '자동': 'badge-muted', '자동분류(처리불요)': 'badge-muted',
  '긍정': 'badge-green', '중립': 'badge-amber', '부정': 'badge-red',
  '외부고객': 'badge-purple', '내부': 'badge-green', '자동/마케팅': 'badge-muted',
  '생성됨': 'badge-green', '대기중': 'badge-amber', '수동조치': 'badge-red',
  '미회신': 'badge-amber', '회신완료(미회신)': 'badge-muted',
  'KO': 'badge-blue', 'EN': 'badge-purple', 'ZH': 'badge-pink',
}
function statusBadgeClass(v: string) {
  return STATUS_COLORS[v] ?? (v.length < 10 ? 'badge-muted' : '')
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, accent = 'var(--accent)', icon }: {
  label: string; value: string | number; sub?: string; accent?: string; icon: string
}) {
  const [n, setN] = useState(0)
  const num = typeof value === 'number' ? value : parseFloat(String(value))
  const isNum = !isNaN(num)
  useEffect(() => {
    if (!isNum) return
    let start: number | null = null
    const go = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / 700, 1)
      setN(Math.round(num * (1 - Math.pow(1 - p, 3))))
      if (p < 1) requestAnimationFrame(go)
    }
    requestAnimationFrame(go)
  }, [num, isNum])

  return (
    <div style={{ ...card, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${accent}22, 0 2px 8px rgba(0,0,0,0.06)` }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '' }}
    >
      <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: `radial-gradient(circle, ${accent}18, transparent 70%)`, pointerEvents: 'none', borderRadius: '50%' }} />
      <span style={{ fontSize: 20, background: `${accent}18`, borderRadius: 10, width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${accent}30` }}>{icon}</span>
      <div>
        <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em', color: accent, lineHeight: 1, fontFamily: 'var(--font-geist-mono), monospace' }}>
          {isNum ? n.toLocaleString() : value}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 6 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ─── Collapsible section ──────────────────────────────────────────────────────
function CollapsibleSection({ title, badge, defaultOpen = false, forceOpen, children }: {
  title: string; badge?: string; defaultOpen?: boolean; forceOpen?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  // 외부에서 전체 펼치기/접기 트리거
  useEffect(() => {
    if (forceOpen !== undefined) setOpen(forceOpen)
  }, [forceOpen])

  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      <button onClick={() => setOpen(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', background: open ? 'var(--surface-2)' : 'var(--surface)', border: 'none', cursor: 'pointer', color: 'var(--text)', borderRadius: open ? '18px 18px 0 0' : 'var(--radius-lg)', transition: 'background 0.2s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{title}</span>
          {badge && <span className="badge badge-purple" style={{ fontSize: 10 }}>{badge}</span>}
        </div>
        <span style={{ color: 'var(--accent)', fontSize: 16, lineHeight: 1, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.25s', display: 'inline-block', fontWeight: 700 }}>›</span>
      </button>
      {open && <div style={{ padding: '4px 22px 22px', borderTop: '1px solid var(--border)' }}>{children}</div>}
    </div>
  )
}

// ─── Bar chart (horizontal) ───────────────────────────────────────────────────
const BAR_COLORS = ['#7c5cfc', '#38b2f4', '#ffb347', '#ff6b9d', '#4ecb8d', '#a78bfa']

function BarChart({ data, total }: { data: CategoryStat[]; total: number }) {
  if (!data.length) return <div style={{ color: 'var(--text-mute)', fontSize: 12 }}>데이터 없음</div>
  const max = data[0].count
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map((d, i) => (
        <div key={d.value} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 120, fontSize: 12, color: 'var(--text-dim)', textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.value}>
            {d.value}
          </div>
          <div style={{ flex: 1, height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.round((d.count / max) * 100)}%`, background: BAR_COLORS[i % BAR_COLORS.length], borderRadius: 3, transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 60 }}>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-geist-mono), monospace' }}>{d.count}</span>
            <span style={{ fontSize: 10, color: 'var(--text-mute)' }}>{d.pct}%</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Category grid (2-col) ───────────────────────────────────────────────────
function CategoryGrid({ stats, total }: { stats: CategoryColumnStats[]; total: number }) {
  const IMPORTANT = ['처리상태', '발신자유형', '분류', '담당부서', '감정', '회신여부', '언어']
  const ordered = [
    ...IMPORTANT.flatMap(role => stats.filter(s => s.role === role || s.header === role)),
    ...stats.filter(s => !IMPORTANT.includes(s.role) && !IMPORTANT.includes(s.header)),
  ].filter((s, i, arr) => arr.indexOf(s) === i)

  if (!ordered.length) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
      {ordered.map(col => (
        <div key={col.header} style={{ background: 'var(--surface)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <GlowDot color={BAR_COLORS[0]} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)' }}>{col.header}</span>
            <span style={{ fontSize: 10, color: 'var(--text-mute)', marginLeft: 'auto' }}>{col.values.reduce((s, v) => s + v.count, 0)}건</span>
          </div>
          <BarChart data={col.values} total={total} />
        </div>
      ))}
    </div>
  )
}

// ─── Status funnel ────────────────────────────────────────────────────────────
function StatusFunnel({ stats, total }: { stats: CategoryColumnStats[]; total: number }) {
  const primary = stats.find(s => s.role === '처리상태') ?? stats[0]
  if (!primary) return null
  const colors = [BAR_COLORS[0], BAR_COLORS[2], BAR_COLORS[1], BAR_COLORS[3], BAR_COLORS[4]]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {primary.values.map((v, i) => (
        <div key={v.value} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`badge ${statusBadgeClass(v.value)}`}>{v.value}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-mute)' }}>{v.count}건</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: colors[i % colors.length], fontFamily: 'var(--font-geist-mono), monospace' }}>{v.pct}%</span>
            </div>
          </div>
          <div style={{ height: 5, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${v.pct}%`, background: colors[i % colors.length], borderRadius: 3, transition: 'width 0.6s ease' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Review needed cards ──────────────────────────────────────────────────────
function ReviewCards({ rows, headers, analysis }: {
  rows: string[][]; headers: string[]; analysis: DashboardData['analysis']
}) {
  const reviewCol = analysis.flagColumns.find(c => c.role === '검토필요')
  const statusCol = analysis.statusColumns.find(c => c.role === '처리상태')
  const senderCol = analysis.columns.find(c => c.role === '발신자')
  const classCol  = analysis.categoryColumns.find(c => c.role === '분류')
  const deptCol   = analysis.categoryColumns.find(c => c.role === '담당부서')
  const sentimentCol = analysis.categoryColumns.find(c => c.role === '감정')
  const urlCol    = analysis.urlColumns[0]
  const importanceCol = analysis.numericColumns.find(c => c.role === '중요도')
  const delayCol  = analysis.flagColumns.find(c => c.role === '지연')

  const REVIEW_VALS = new Set(['검토필요', '조치필요', '신규(대기)'])
  const reviewRows = rows.filter(r => {
    if (reviewCol) {
      const v = (r[reviewCol.index] ?? '').trim()
      return v !== '' && v !== '—'
    }
    if (statusCol) return REVIEW_VALS.has((r[statusCol.index] ?? '').trim())
    return false
  }).slice(0, 20)

  if (!reviewRows.length) {
    return (
      <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-mute)' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
        <div>검토 필요 항목이 없습니다</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
      {reviewRows.map((row, i) => {
        const sender = senderCol ? (row[senderCol.index] ?? '') : ''
        const cls = classCol ? (row[classCol.index] ?? '') : ''
        const dept = deptCol ? (row[deptCol.index] ?? '') : ''
        const sentiment = sentimentCol ? (row[sentimentCol.index] ?? '') : ''
        const status = statusCol ? (row[statusCol.index] ?? '') : ''
        const url = urlCol ? (row[urlCol.index] ?? '') : ''
        const importance = importanceCol ? (row[importanceCol.index] ?? '') : ''
        const isDelayed = delayCol ? ((row[delayCol.index] ?? '').trim() === '지연') : false

        return (
          <div key={i} style={{ background: 'var(--surface)', border: `1.5px solid ${isDelayed ? '#ffc5d3' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sender}>
                  {sender || `항목 ${i + 1}`}
                </div>
                {cls && <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>{cls}</div>}
              </div>
              <div style={{ display: 'flex', gap: 5, flexShrink: 0, marginLeft: 8 }}>
                {isDelayed && <span className="badge badge-red">지연</span>}
                {status && <span className={`badge ${statusBadgeClass(status)}`}>{status}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {dept && <span className="badge badge-blue">{dept}</span>}
              {sentiment && <span className={`badge ${statusBadgeClass(sentiment)}`}>{sentiment}</span>}
              {importance && (
                <span className="badge badge-amber">
                  중요도 {importance}
                </span>
              )}
            </div>
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--accent-3)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                ↗ {url.replace('https://mail.google.com', 'Gmail')}
              </a>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Full data table ──────────────────────────────────────────────────────────
function DataTable({ headers, rows, analysis }: { headers: string[]; rows: string[][]; analysis: DashboardData['analysis'] }) {
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<number | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const filtered = rows.filter(r => search === '' || r.some(c => c?.toLowerCase().includes(search.toLowerCase())))
  const sorted = sortCol === null ? filtered : [...filtered].sort((a, b) => {
    const cmp = (a[sortCol] ?? '').localeCompare(b[sortCol] ?? '', 'ko')
    return sortDir === 'asc' ? cmp : -cmp
  })
  const toggleSort = (i: number) => { if (sortCol === i) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(i); setSortDir('asc') } }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <input className="input" placeholder="이름, 발신자, 상태 검색..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
      </div>
      <div style={{ overflowX: 'auto', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <table className="data-table">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} onClick={() => toggleSort(i)} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  {h}{sortCol === i && <span style={{ marginLeft: 4, color: 'var(--accent)' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan={headers.length} style={{ textAlign: 'center', padding: 32, color: 'var(--text-mute)' }}>검색 결과 없음</td></tr>
            )}
            {sorted.map((row, ri) => (
              <tr key={ri}>
                {headers.map((_, ci) => {
                  const cell = row[ci] ?? ''
                  const col = analysis.columns[ci]
                  if (col?.type === 'url' && cell.startsWith('http')) {
                    return <td key={ci}><a href={cell} target="_blank" rel="noopener noreferrer" className="badge badge-green" style={{ textDecoration: 'none' }}>↗ 링크</a></td>
                  }
                  if (col?.type === 'email') return <td key={ci} style={{ fontSize: 12, color: 'var(--text-dim)' }}>{cell ? maskEmail(cell) : <span style={{ color: 'var(--text-mute)' }}>—</span>}</td>
                  if (col?.type === 'status' || col?.type === 'boolean') {
                    return <td key={ci}>{cell ? <span className={`badge ${statusBadgeClass(cell)}`}>{cell}</span> : <span style={{ color: 'var(--text-mute)' }}>—</span>}</td>
                  }
                  if (col?.type === 'longtext') {
                    return <td key={ci} style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11, color: 'var(--text-mute)' }} title={cell}>{cell || '—'}</td>
                  }
                  return <td key={ci} style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: cell ? 'var(--text-dim)' : 'var(--text-mute)' }}>{cell || '—'}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-mute)', textAlign: 'right' }}>{sorted.length} / {rows.length}건 표시</div>
    </div>
  )
}

// ─── Setup guide ─────────────────────────────────────────────────────────────
function SetupGuide({ error }: { error: string }) {
  return (
    <div style={{ maxWidth: 680, margin: '60px auto', padding: '0 24px' }}>
      <div style={{ ...card, padding: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <span style={{ fontSize: 32 }}>⚙️</span>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>초기 설정 필요</h2>
            <p style={{ fontSize: 13, color: 'var(--text-mute)', marginTop: 2 }}>환경변수를 설정하면 대시보드가 활성화됩니다</p>
          </div>
        </div>
        <div style={{ background: 'var(--bg-2)', border: '1.5px solid #ffc5d3', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: 'var(--accent-2)', marginBottom: 4 }}>오류 메시지</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-geist-mono), monospace', wordBreak: 'break-all' }}>{error}</div>
        </div>
        <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { step: 'Google Cloud Console에서 서비스 계정 생성 및 JSON 키 다운로드', detail: '프로젝트 > IAM 및 관리 > 서비스 계정' },
            { step: 'Google Sheets에 서비스 계정 이메일 뷰어 권한 추가', detail: 'Sheets > 공유 > 서비스 계정 이메일 입력 > 뷰어' },
            { step: '.env.local에 GOOGLE_SERVICE_ACCOUNT_JSON 설정', detail: "cat key.json | tr -d '\\n'" },
            { step: 'Google OAuth 웹 클라이언트 ID/Secret 설정', detail: 'Cloud Console > API 및 서비스 > 사용자 인증 정보' },
          ].map((item, i) => (
            <li key={i} style={{ color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.6 }}>
              {item.step}
              <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-mute)', fontFamily: 'var(--font-geist-mono), monospace', background: 'var(--bg-2)', padding: '4px 8px', borderRadius: 4, display: 'inline-block' }}>{item.detail}</div>
            </li>
          ))}
        </ol>
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-primary" onClick={() => location.reload()}>↻ 재시도</button>
        </div>
      </div>
    </div>
  )
}

// ─── Header ──────────────────────────────────────────────────────────────────
function AppHeader({ user, onRefresh, refreshing, sheetTitle, allExpanded, onToggleAll }: {
  user: { name?: string | null; email?: string | null; image?: string | null } | null
  onRefresh: () => void
  refreshing: boolean
  sheetTitle: string
  allExpanded: boolean
  onToggleAll: () => void
}) {
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, gap: 16 }}>
        {/* 로고 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, var(--accent), var(--accent-3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--bg)' }}>Y</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text)', lineHeight: 1 }}>YENA RE Analytics</div>
            <div style={{ fontSize: 10, color: 'var(--text-mute)', lineHeight: 1, marginTop: 2 }}>AI 부동산 마케팅 대시보드</div>
          </div>
        </div>

        {/* 시트명 */}
        {sheetTitle && (
          <div style={{ fontSize: 12, color: 'var(--text-mute)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'none' }} className="sheet-badge">
            {sheetTitle}
          </div>
        )}

        {/* 액션 버튼들 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* 모두 펼치기/접기 */}
          <button
            className="btn"
            onClick={onToggleAll}
            style={{ padding: '6px 12px', fontSize: 12, gap: 6 }}
            title={allExpanded ? '모두 접기' : '모두 펼치기'}
          >
            <span style={{ fontSize: 13 }}>{allExpanded ? '▲' : '▼'}</span>
            {allExpanded ? '모두 접기' : '모두 펼치기'}
          </button>

          {/* 새로고침 */}
          <button className="btn btn-primary" onClick={onRefresh} disabled={refreshing} style={{ padding: '6px 12px', fontSize: 12, gap: 5 }}>
            <span style={{ display: 'inline-block', animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>↻</span>
            새로고침
          </button>

          {/* 유저 */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {user.image
                ? <img src={user.image} alt="" width={28} height={28} style={{ borderRadius: '50%', border: '1px solid var(--border)' }} />
                : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--text-dim)' }}>{(user.name ?? user.email ?? '?')[0].toUpperCase()}</div>
              }
              <a href="/api/auth/signout" className="btn" style={{ padding: '4px 10px', fontSize: 11 }}>로그아웃</a>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @media (min-width: 640px) { .sheet-badge { display: block !important; } }
      `}</style>
    </header>
  )
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
export default function Dashboard({ data: init, user }: {
  data: DashboardData
  user: { name?: string | null; email?: string | null; image?: string | null } | null
}) {
  const [data, setData] = useState(init)
  const [refreshing, setRefreshing] = useState(false)
  const [allExpanded, setAllExpanded] = useState(false)
  // undefined = 개별 제어, true/false = 전체 강제
  const [forceOpen, setForceOpen] = useState<boolean | undefined>(undefined)

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try { const r = await fetch('/api/data', { cache: 'no-store' }); if (r.ok) setData(await r.json()) }
    finally { setRefreshing(false) }
  }, [])

  const toggleAll = useCallback(() => {
    setAllExpanded(v => {
      const next = !v
      setForceOpen(next)
      // 잠깐 후 undefined로 복원해 개별 제어 다시 허용
      setTimeout(() => setForceOpen(undefined), 50)
      return next
    })
  }, [])

  if (data.error) return (
    <div style={{ minHeight: '100dvh' }}>
      <AppHeader user={user} onRefresh={refresh} refreshing={refreshing} sheetTitle="" allExpanded={false} onToggleAll={() => {}} />
      <SetupGuide error={data.error} />
    </div>
  )

  const { stats, analysis, headers, rows, sheetTitle, lastUpdated } = data
  const isMailCRM = analysis.datasetType === 'mail-crm'

  // Dynamic KPIs
  const processingStatus = stats.statusStats.find(s => s.role === '처리상태')
  const needsAction = processingStatus?.values.find(v => v.value === '조치필요')?.count ?? 0
  const delayed = stats.flagStats.find(s => s.role === '지연')?.trueCount ?? 0
  const reviewNeeded = stats.flagStats.find(s => s.role === '검토필요')?.trueCount ?? 0
  const completed = processingStatus?.values.find(v => v.value === '회신완료')?.count ?? 0

  const QUALITY_BADGE: Record<string, string> = { excellent: 'badge-green', good: 'badge-green', fair: 'badge-amber', poor: 'badge-red' }
  const QUALITY_LABEL: Record<string, string> = { excellent: '최상', good: '양호', fair: '보통', poor: '주의' }
  const DATASET_LABEL: Record<string, string> = { 'mail-crm': '메일 CRM', 'real-estate-crm': '부동산 CRM', 'education-tracking': '교육 진도', 'general': '일반 데이터' }

  return (
    <div style={{ minHeight: '100dvh', paddingBottom: 60 }}>
      <AppHeader user={user} onRefresh={refresh} refreshing={refreshing} sheetTitle={sheetTitle} allExpanded={allExpanded} onToggleAll={toggleAll} />

      <main className="container" style={{ paddingTop: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Hero */}
        <div style={{ ...card, padding: '28px 32px', background: 'linear-gradient(135deg, #f3efff 0%, #ffffff 50%, #eaf6ff 100%)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                <span className={`badge ${QUALITY_BADGE[stats.dataQuality]}`}>
                  <GlowDot color={stats.dataQuality === 'poor' ? 'oklch(65% 0.22 25)' : 'var(--accent)'} />
                  데이터 품질 {QUALITY_LABEL[stats.dataQuality]}
                </span>
                <span className="badge badge-blue">{DATASET_LABEL[analysis.datasetType]}</span>
                {delayed > 0 && <span className="badge badge-red">⚠ 지연 {delayed}건</span>}
                {needsAction > 0 && <span className="badge badge-amber">조치필요 {needsAction}건</span>}
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 6 }}>{sheetTitle || '데이터 분석'}</h1>
              <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                총 <strong style={{ color: 'var(--text)' }}>{stats.totalRows}건</strong>
                {isMailCRM && completed > 0 && <> · 회신완료 <strong style={{ color: 'var(--accent)' }}>{completed}건</strong></>}
                {isMailCRM && needsAction > 0 && <> · 조치필요 <strong style={{ color: 'var(--accent-2)' }}>{needsAction}건</strong></>}
                {!isMailCRM && stats.emailCount > 0 && <> · 이메일 <strong style={{ color: 'var(--accent)' }}>{stats.emailCount}명</strong></>}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 3 }}>마지막 업데이트</div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{timeAgo(lastUpdated)}</div>
            </div>
          </div>
          {/* Column chips */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-dim)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {analysis.columns.map(col => (
              <span key={col.index} className={`badge ${col.type === 'url' ? 'badge-blue' : col.type === 'email' ? 'badge-green' : col.type === 'numeric' ? 'badge-amber' : col.type === 'status' ? 'badge-muted' : col.type === 'boolean' ? 'badge-red' : 'badge-muted'}`}>
                {col.displayName} <span style={{ opacity: 0.6, fontSize: 9 }}>{col.type}</span>
              </span>
            ))}
          </div>
        </div>

        {/* KPI Band */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <KPICard icon="📬" label="전체 데이터" value={stats.totalRows} sub={`${analysis.columns.length}개 컬럼`} accent="var(--accent)" />
          {isMailCRM ? (
            <>
              <KPICard icon="✅" label="회신 완료" value={completed} sub={stats.totalRows > 0 ? `${Math.round(completed / stats.totalRows * 100)}% 처리율` : '—'} accent="var(--accent-3)" />
              <KPICard icon="⚡" label="조치 필요" value={needsAction} sub="즉시 대응 필요" accent="var(--accent-2)" />
              <KPICard icon="🔴" label="지연 건수" value={delayed} sub={`SLA 초과`} accent="oklch(65% 0.22 25)" />
            </>
          ) : (
            <>
              <KPICard icon="📧" label="이메일 등록" value={stats.emailCount} sub={stats.totalRows > 0 ? `${Math.round(stats.emailCount / stats.totalRows * 100)}% 등록률` : '—'} accent="var(--accent-3)" />
              <KPICard icon="✅" label="1차 완료" value={stats.urlStats[0]?.submittedCount ?? 0} sub={`${stats.urlStats[0]?.rate ?? 0}% 제출률`} accent="var(--accent-4)" />
              <KPICard icon="🎯" label="전체 완료율" value={stats.completionRate} sub={`${stats.incompleteStudents.length}명 미완료`} accent="var(--accent-2)" />
            </>
          )}
        </div>

        {/* 처리상태 퍼널 */}
        {stats.statusStats.length > 0 && (
          <CollapsibleSection title="처리 현황 퍼널" badge={`${stats.statusStats.length}개 상태 컬럼`} forceOpen={forceOpen}>
            <SectionLabel>처리 단계별 분포</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {stats.statusStats.map(s => (
                <div key={s.header} style={{ background: 'var(--surface)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <GlowDot />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)' }}>{s.header}</span>
                  </div>
                  <StatusFunnel stats={[s]} total={stats.totalRows} />
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* 분류 분석 */}
        {stats.categoryStats.length > 0 && (
          <CollapsibleSection title="고객·발신자 유형 분석" badge={`${stats.categoryStats.length}개 분류`} forceOpen={forceOpen}>
            <SectionLabel>카테고리별 분포</SectionLabel>
            <CategoryGrid stats={stats.categoryStats} total={stats.totalRows} />
          </CollapsibleSection>
        )}

        {/* 검토 필요 */}
        {(analysis.flagColumns.length > 0 || stats.statusStats.some(s => s.role === '처리상태')) && (
          <CollapsibleSection
            title={isMailCRM ? '검토·조치 필요 메일' : '미완료 항목'}
            badge={`${reviewNeeded + needsAction}건 주의`}
            defaultOpen={reviewNeeded + needsAction > 0}
          >
            <SectionLabel>후속 조치 필요 항목</SectionLabel>
            <ReviewCards rows={rows} headers={headers} analysis={analysis} />
          </CollapsibleSection>
        )}

        {/* URL 제출 현황 (교육 데이터용) */}
        {stats.urlStats.filter(u => u.dayNum !== undefined).length > 0 && (
          <CollapsibleSection title="과제 제출 현황" badge={`${stats.urlStats.length}개`}>
            <SectionLabel>일차별 제출률</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {stats.urlStats.map((u, i) => (
                <div key={u.header}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{u.header}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', fontFamily: 'var(--font-geist-mono), monospace' }}>{u.submittedCount}/{u.total} ({u.rate}%)</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${u.rate}%`, background: BAR_COLORS[i % BAR_COLORS.length], borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* 전체 테이블 */}
        <CollapsibleSection title="전체 데이터 테이블" badge={`${rows.length}건`}>
          <SectionLabel>필터 · 검색 · 정렬</SectionLabel>
          <DataTable headers={headers} rows={rows} analysis={analysis} />
        </CollapsibleSection>

      </main>

      <footer style={{ marginTop: 48, borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', color: 'var(--text-mute)', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span>데이터 소스: Google Sheets</span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span>Read-only Dashboard</span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span>Powered by Claude + Google Workspace</span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span>YENA RE Analytics © 2026</span>
      </footer>
    </div>
  )
}
