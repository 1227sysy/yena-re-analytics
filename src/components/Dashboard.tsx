'use client'

import { useState, useEffect, useCallback, CSSProperties, useMemo } from 'react'
import type { DashboardData, CategoryColumnStats, CategoryStat } from '@/types'

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'Just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function maskEmail(e: string) {
  const [l, d] = e.split('@')
  if (!l || !d) return e
  return `${l.length <= 2 ? '*'.repeat(l.length) : l[0] + '**'}@${d}`
}

const STATUS_MAP: Record<string, string> = {
  '회신완료': 'badge-green', '완료': 'badge-green', '처리완료': 'badge-green',
  '신규(대기)': 'badge-blue', '대기': 'badge-blue', '신규': 'badge-blue',
  '조치필요': 'badge-red', '지연': 'badge-red',
  '검토필요': 'badge-amber',
  '자동분류': 'badge-muted', '자동분류(처리불요)': 'badge-muted',
  '긍정': 'badge-green', '중립': 'badge-amber', '부정': 'badge-red',
  '외부고객': 'badge-indigo', '내부': 'badge-green', '자동/마케팅': 'badge-muted',
  '미회신': 'badge-amber',
  'KO': 'badge-blue', 'EN': 'badge-indigo', 'ZH': 'badge-pink',
}
const badgeClass = (v: string) => STATUS_MAP[v] ?? 'badge-muted'

// ─── Sparkline (SVG) ─────────────────────────────────────────────────────────
function Spark({ values, color = '#6366F1' }: { values: number[]; color?: string }) {
  if (values.length < 2) return null
  const max = Math.max(...values), min = Math.min(...values)
  const range = max - min || 1
  const w = 64, h = 24
  const pts = values.map((v, i) =>
    `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * (h - 2) - 1}`
  ).join(' ')
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, trend, trendVal, color = '#6366F1', sparkData }: {
  label: string; value: number | string; sub?: string
  trend?: 'up' | 'down' | 'flat'; trendVal?: string
  color?: string; sparkData?: number[]
}) {
  const [n, setN] = useState(0)
  const num = typeof value === 'number' ? value : parseFloat(String(value))
  const isNum = !isNaN(num)

  useEffect(() => {
    if (!isNum) return
    let start: number | null = null
    const go = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / 900, 1)
      setN(Math.round(num * (1 - Math.pow(1 - p, 4))))
      if (p < 1) requestAnimationFrame(go)
    }
    requestAnimationFrame(go)
  }, [num, isNum])

  const trendColor = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#9CA3AF'
  const trendIcon  = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'

  return (
    <div className="card card-hover" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12, cursor: 'default', flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-mute)' }}>{label}</span>
        {trend && trendVal && (
          <span style={{ fontSize: 11, fontWeight: 600, color: trendColor, display: 'flex', alignItems: 'center', gap: 2, background: `${trendColor}12`, padding: '2px 6px', borderRadius: 4 }}>
            {trendIcon} {trendVal}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1, fontFamily: "'SF Mono','Fira Code',ui-monospace,monospace" }}>
            {isNum ? n.toLocaleString() : value}
          </div>
          {sub && <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 4 }}>{sub}</div>}
        </div>
        {sparkData && <Spark values={sparkData} color={color} />}
        {!sparkData && (
          <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
          </div>
        )}
      </div>

      <div style={{ height: 3, background: 'var(--surface-2)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: isNum && num > 0 ? '100%' : '0%', background: `linear-gradient(90deg, ${color}40, ${color})`, borderRadius: 2, transition: 'width 1s ease' }} />
      </div>
    </div>
  )
}

// ─── AI Insight card ──────────────────────────────────────────────────────────
function AIInsights({ stats, analysis }: { stats: DashboardData['stats']; analysis: DashboardData['analysis'] }) {
  const insights = useMemo(() => {
    const list: { icon: string; text: string; type: 'info' | 'warn' | 'success' | 'danger' }[] = []
    const { totalRows, urlStats, flagStats, statusStats, categoryStats } = stats

    const processingStatus = statusStats.find(s => s.role === '처리상태')
    const replied = processingStatus?.values.find(v => v.value === '회신완료')?.count ?? 0
    const pending = processingStatus?.values.find(v => v.value === '신규(대기)')?.count ?? 0
    const autoClassified = processingStatus?.values.find(v => v.value === '자동분류')?.count ?? 0
    const delayed = flagStats.find(s => s.role === '지연')?.trueCount ?? 0
    const needsAction = processingStatus?.values.find(v => v.value === '조치필요')?.count ?? 0

    const replyRate = totalRows > 0 ? Math.round((replied / totalRows) * 100) : 0
    const autoRate  = totalRows > 0 ? Math.round((autoClassified / totalRows) * 100) : 0

    const sentimentStat = categoryStats.find(s => s.role === '감정')
    const topSentiment  = sentimentStat?.values[0]
    const langStat      = categoryStats.find(s => s.role === '언어')
    const topLang       = langStat?.values[0]
    const classStat     = categoryStats.find(s => s.role === '분류')
    const topClass      = classStat?.values[0]

    if (delayed > 0)      list.push({ icon: '🔴', text: `${delayed}건의 메일이 SLA 기한을 초과했습니다. 즉시 검토가 필요합니다.`, type: 'danger' })
    if (needsAction > 0)  list.push({ icon: '⚡', text: `${needsAction}건의 조치 필요 메일이 대기 중입니다.`, type: 'warn' })
    if (replyRate > 0)    list.push({ icon: '✅', text: `전체 응답률은 ${replyRate}%입니다. (${replied}/${totalRows}건 회신 완료)`, type: replyRate >= 50 ? 'success' : 'info' })
    if (autoRate > 0)     list.push({ icon: '🤖', text: `${autoRate}%의 메일이 AI에 의해 자동 분류되었습니다. (${autoClassified}건)`, type: 'info' })
    if (topSentiment)     list.push({ icon: '💬', text: `발신자 감정 분석: 가장 많은 감정은 '${topSentiment.value}' (${topSentiment.count}건, ${topSentiment.pct}%)입니다.`, type: 'info' })
    if (topClass)         list.push({ icon: '📂', text: `가장 많은 메일 유형은 '${topClass.value}' (${topClass.count}건)입니다.`, type: 'info' })
    if (topLang && topLang.value !== 'KO') list.push({ icon: '🌐', text: `${topLang.count}건의 ${topLang.value} 언어 메일이 포함되어 있습니다.`, type: 'info' })
    if (pending > 0)      list.push({ icon: '⏳', text: `${pending}건의 신규 메일이 담당자 배정을 기다리고 있습니다.`, type: 'warn' })

    return list.slice(0, 5)
  }, [stats, analysis])

  const typeStyles: Record<string, CSSProperties> = {
    danger:  { borderLeft: '3px solid #EF4444', background: '#FEF2F2' },
    warn:    { borderLeft: '3px solid #F59E0B', background: '#FFFBEB' },
    success: { borderLeft: '3px solid #10B981', background: '#ECFDF5' },
    info:    { borderLeft: '3px solid #6366F1', background: '#EEF2FF' },
  }

  return (
    <div className="card" style={{ padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✦</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>AI Insights</div>
            <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>Powered by data analysis</div>
          </div>
        </div>
        <span className="badge badge-indigo">Live</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {insights.map((ins, i) => (
          <div key={i} style={{ ...typeStyles[ins.type], padding: '10px 14px', borderRadius: '0 8px 8px 0', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.4 }}>{ins.icon}</span>
            <span style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>{ins.text}</span>
          </div>
        ))}
        {insights.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-mute)', fontSize: 13 }}>
            데이터를 분석하는 중입니다...
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Section wrapper (collapsible) ───────────────────────────────────────────
function Section({ title, badge, sub, defaultOpen = false, forceOpen, children }: {
  title: string; badge?: string; sub?: string; defaultOpen?: boolean; forceOpen?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  useEffect(() => { if (forceOpen !== undefined) setOpen(forceOpen) }, [forceOpen])

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{title}</span>
            {badge && <span className="badge badge-muted">{badge}</span>}
          </div>
          {sub && <span style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 1, display: 'block' }}>{sub}</span>}
        </div>
        <span style={{ color: 'var(--text-mute)', fontSize: 14, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block', flexShrink: 0 }}>›</span>
      </button>
      {open && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '18px 20px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Bar chart ────────────────────────────────────────────────────────────────
const PALETTE = ['#6366F1','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#F97316','#EC4899']

function BarChart({ data }: { data: CategoryStat[] }) {
  if (!data.length) return <p style={{ color: 'var(--text-mute)', fontSize: 12 }}>—</p>
  const max = data[0].count
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {data.map((d, i) => (
        <div key={d.value} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 4, height: 16, borderRadius: 2, background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
          <div style={{ width: 130, fontSize: 12, color: 'var(--text-dim)', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.value}>{d.value}</div>
          <div style={{ flex: 1, height: 5, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.round((d.count / max) * 100)}%`, background: PALETTE[i % PALETTE.length], borderRadius: 3, transition: 'width 0.5s ease', opacity: 0.85 }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-mute)', minWidth: 28, textAlign: 'right', fontFamily: 'ui-monospace,monospace' }}>{d.count}</span>
          <span style={{ fontSize: 10, color: 'var(--text-faint)', minWidth: 30 }}>{d.pct}%</span>
        </div>
      ))}
    </div>
  )
}

// ─── Category grid ────────────────────────────────────────────────────────────
function CategoryGrid({ stats }: { stats: CategoryColumnStats[] }) {
  const ORDER = ['처리상태','발신자유형','분류','담당부서','감정','회신여부','언어','Draft상태']
  const sorted = [
    ...ORDER.flatMap(r => stats.filter(s => s.header === r || s.role === r)),
    ...stats.filter(s => !ORDER.includes(s.header) && !ORDER.includes(s.role)),
  ].filter((s, i, a) => a.indexOf(s) === i)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
      {sorted.map(col => (
        <div key={col.header} style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '16px 18px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: 14 }}>{col.header}</p>
          <BarChart data={col.values} />
        </div>
      ))}
    </div>
  )
}

// ─── Status funnel ─────────────────────────────────────────────────────────────
function StatusFunnel({ stats }: { stats: CategoryColumnStats[] }) {
  const primary = stats.find(s => s.role === '처리상태') ?? stats[0]
  if (!primary) return null
  const colors = ['#6366F1','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4']
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
      {stats.map(col => (
        <div key={col.header} style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '16px 18px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: 14 }}>{col.header}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {col.values.map((v, i) => (
              <div key={v.value} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`badge ${badgeClass(v.value)}`}>{v.value}</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>{v.count}건</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: colors[i % colors.length], fontFamily: 'ui-monospace,monospace' }}>{v.pct}%</span>
                  </div>
                </div>
                <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${v.pct}%`, background: colors[i % colors.length], borderRadius: 2, opacity: 0.8, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Review cards ─────────────────────────────────────────────────────────────
function ReviewCards({ rows, analysis }: { rows: string[][]; analysis: DashboardData['analysis'] }) {
  const statusCol    = analysis.statusColumns.find(c => c.role === '처리상태')
  const reviewCol    = analysis.flagColumns.find(c => c.role === '검토필요')
  const senderCol    = analysis.columns.find(c => c.role === '발신자')
  const classCol     = analysis.categoryColumns.find(c => c.role === '분류')
  const deptCol      = analysis.categoryColumns.find(c => c.role === '담당부서')
  const sentimentCol = analysis.categoryColumns.find(c => c.role === '감정')
  const urlCol       = analysis.urlColumns[0]
  const delayCol     = analysis.flagColumns.find(c => c.role === '지연')
  const importCol    = analysis.numericColumns.find(c => c.role === '중요도')

  const NEEDS = new Set(['검토필요','조치필요','신규(대기)'])
  const items = rows.filter(r => {
    if (reviewCol) return (r[reviewCol.index] ?? '').trim() === '검토필요'
    if (statusCol) return NEEDS.has((r[statusCol.index] ?? '').trim())
    return false
  }).slice(0, 24)

  if (!items.length) return (
    <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-mute)', fontSize: 13 }}>
      ✅ 검토 필요 항목이 없습니다
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
      {items.map((row, i) => {
        const isDelayed = delayCol ? (row[delayCol.index] ?? '') === '지연' : false
        const status    = statusCol ? (row[statusCol.index] ?? '') : ''
        const sender    = senderCol ? (row[senderCol.index] ?? '') : `항목 ${i+1}`
        const cls       = classCol  ? (row[classCol.index] ?? '')  : ''
        const dept      = deptCol   ? (row[deptCol.index] ?? '')   : ''
        const sentiment = sentimentCol ? (row[sentimentCol.index] ?? '') : ''
        const url       = urlCol    ? (row[urlCol.index] ?? '')    : ''
        const imp       = importCol ? (row[importCol.index] ?? '') : ''

        return (
          <div key={i} className="card-hover" style={{
            background: 'var(--surface)', border: `1px solid ${isDelayed ? '#FECACA' : 'var(--border)'}`,
            borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, cursor: 'default',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sender}>{sender}</p>
                {cls && <p style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>{cls}</p>}
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {isDelayed && <span className="badge badge-red">지연</span>}
                {status && <span className={`badge ${badgeClass(status)}`}>{status}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {dept && <span className="badge badge-indigo">{dept}</span>}
              {sentiment && <span className={`badge ${badgeClass(sentiment)}`}>{sentiment}</span>}
              {imp && <span className="badge badge-amber">중요도 {imp}</span>}
            </div>
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: '#6366F1', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                ↗ Gmail에서 보기
              </a>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Data table ───────────────────────────────────────────────────────────────
function DataTable({ headers, rows, analysis }: { headers: string[]; rows: string[][]; analysis: DashboardData['analysis'] }) {
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<number | null>(null)
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')

  const filtered = rows.filter(r => !search || r.some(c => c?.toLowerCase().includes(search.toLowerCase())))
  const sorted = sortCol === null ? filtered : [...filtered].sort((a, b) => {
    const cmp = (a[sortCol] ?? '').localeCompare(b[sortCol] ?? '', 'ko')
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <input className="input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
        <span style={{ fontSize: 12, color: 'var(--text-mute)', marginLeft: 'auto' }}>{sorted.length} / {rows.length} rows</span>
      </div>
      <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
        <table className="data-table">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} onClick={() => { if (sortCol === i) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(i); setSortDir('asc') } }} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  {h} {sortCol === i ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan={headers.length} style={{ textAlign: 'center', padding: 32, color: 'var(--text-mute)' }}>No results</td></tr>
            )}
            {sorted.map((row, ri) => (
              <tr key={ri}>
                {headers.map((_, ci) => {
                  const cell = row[ci] ?? ''
                  const col  = analysis.columns[ci]
                  if (col?.type === 'url' && cell.startsWith('http'))
                    return <td key={ci}><a href={cell} target="_blank" rel="noopener noreferrer" className="badge badge-indigo" style={{ textDecoration: 'none' }}>↗ Open</a></td>
                  if (col?.type === 'email')
                    return <td key={ci} style={{ fontSize: 12, color: 'var(--text-mute)' }}>{cell ? maskEmail(cell) : '—'}</td>
                  if (col?.type === 'status' || col?.type === 'boolean')
                    return <td key={ci}>{cell ? <span className={`badge ${badgeClass(cell)}`}>{cell}</span> : <span style={{ color: 'var(--text-faint)' }}>—</span>}</td>
                  if (col?.type === 'longtext')
                    return <td key={ci} style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text-mute)' }} title={cell}>{cell || '—'}</td>
                  return <td key={ci} style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: cell ? 'var(--text-dim)' : 'var(--text-faint)' }}>{cell || '—'}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ sheetTitle, lastUpdated, onRefresh, refreshing, allExpanded, onToggleAll }: {
  sheetTitle: string; lastUpdated: string; onRefresh: () => void; refreshing: boolean; allExpanded: boolean; onToggleAll: () => void
}) {
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(248,250,252,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
      <div className="container" style={{ height: 52, display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>Y</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>YENA RE Analytics</span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 18, background: 'var(--border)', flexShrink: 0 }} />

        {/* Sheet title */}
        {sheetTitle && (
          <span style={{ fontSize: 12, color: 'var(--text-mute)', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>{sheetTitle}</span>
        )}

        <div style={{ flex: 1 }} />

        {/* Last updated */}
        <span style={{ fontSize: 11, color: 'var(--text-faint)', flexShrink: 0 }}>{timeAgo(lastUpdated)}</span>

        {/* Buttons */}
        <button className="btn btn-ghost" onClick={onToggleAll} style={{ fontSize: 12, padding: '5px 10px' }}>
          {allExpanded ? '접기' : '펼치기'}
        </button>
        <button className="btn btn-primary" onClick={onRefresh} disabled={refreshing} style={{ padding: '6px 14px', fontSize: 12 }}>
          <span style={{ display: 'inline-block', animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>↻</span>
          Refresh
        </button>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </header>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Dashboard({ data: init }: { data: DashboardData }) {
  const [data, setData] = useState(init)
  const [refreshing, setRefreshing] = useState(false)
  const [allExpanded, setAllExpanded] = useState(false)
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
      setTimeout(() => setForceOpen(undefined), 50)
      return next
    })
  }, [])

  const { stats, analysis, headers, rows, sheetTitle, lastUpdated, error } = data

  // Error / setup
  if (error) return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: 480, width: '100%', margin: 24, padding: '40px 36px' }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 20 }}>⚠️</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Setup Required</h2>
        <p style={{ fontSize: 13, color: 'var(--text-mute)', marginBottom: 20, lineHeight: 1.6 }}>Connect your Google Sheets to get started.</p>
        <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '12px 14px', fontFamily: 'ui-monospace,monospace', fontSize: 12, color: 'var(--text-dim)', wordBreak: 'break-all', marginBottom: 24 }}>{error}</div>
        <button className="btn btn-primary" onClick={() => location.reload()}>Retry</button>
      </div>
    </div>
  )

  const isMailCRM = analysis.datasetType === 'mail-crm'
  const processingStatus = stats.statusStats.find(s => s.role === '처리상태')
  const replied    = processingStatus?.values.find(v => v.value === '회신완료')?.count ?? 0
  const needsAction = processingStatus?.values.find(v => v.value === '조치필요')?.count ?? 0
  const delayed    = stats.flagStats.find(s => s.role === '지연')?.trueCount ?? 0
  const review     = stats.flagStats.find(s => s.role === '검토필요')?.trueCount ?? 0

  const replyRate  = stats.totalRows > 0 ? Math.round((replied / stats.totalRows) * 100) : 0

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <Header sheetTitle={sheetTitle} lastUpdated={lastUpdated} onRefresh={refresh} refreshing={refreshing} allExpanded={allExpanded} onToggleAll={toggleAll} />

      <main className="container" style={{ paddingTop: 24, paddingBottom: 60, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Hero strip ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>{sheetTitle || 'Dashboard'}</h1>
            <p style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 3 }}>
              {stats.totalRows.toLocaleString()} records · {analysis.datasetType === 'mail-crm' ? 'Mail CRM' : analysis.datasetType === 'education-tracking' ? 'Education' : 'Analytics'}
              {delayed > 0 && <> · <span style={{ color: '#EF4444', fontWeight: 600 }}>{delayed} overdue</span></>}
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {needsAction > 0 && <span className="badge badge-red">⚡ {needsAction} 조치필요</span>}
            {delayed > 0     && <span className="badge badge-amber">⏰ {delayed} 지연</span>}
            {review > 0      && <span className="badge badge-indigo">🔍 {review} 검토</span>}
          </div>
        </div>

        {/* ── KPI row ── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <KPICard label="Total Records" value={stats.totalRows}
            trend="flat" color="#6366F1" />
          {isMailCRM ? (
            <>
              <KPICard label="Replied" value={replied}
                sub={`${replyRate}% reply rate`}
                trend={replyRate >= 50 ? 'up' : 'down'}
                trendVal={`${replyRate}%`}
                color="#10B981" />
              <KPICard label="Action Required" value={needsAction}
                trend={needsAction > 10 ? 'down' : 'flat'}
                trendVal={needsAction > 0 ? 'Urgent' : undefined}
                color="#EF4444" />
              <KPICard label="Overdue" value={delayed}
                trend={delayed > 0 ? 'down' : 'flat'}
                trendVal={delayed > 0 ? 'SLA' : undefined}
                color="#F59E0B" />
            </>
          ) : (
            <>
              <KPICard label="Email Registered" value={stats.emailCount}
                sub={`${stats.totalRows > 0 ? Math.round(stats.emailCount / stats.totalRows * 100) : 0}% coverage`}
                color="#10B981" />
              <KPICard label="Submitted (D1)" value={stats.urlStats[0]?.submittedCount ?? 0}
                sub={`${stats.urlStats[0]?.rate ?? 0}% rate`}
                color="#F59E0B" />
              <KPICard label="Complete Rate" value={stats.completionRate}
                color="#EF4444" />
            </>
          )}
        </div>

        {/* ── AI Insights ── */}
        <AIInsights stats={stats} analysis={analysis} />

        {/* ── Status funnel ── */}
        {stats.statusStats.length > 0 && (
          <Section title="처리 현황" badge={`${stats.statusStats.length} columns`} forceOpen={forceOpen} defaultOpen>
            <StatusFunnel stats={stats.statusStats} />
          </Section>
        )}

        {/* ── Category analysis ── */}
        {stats.categoryStats.length > 0 && (
          <Section title="유형 분석" badge={`${stats.categoryStats.length} dimensions`} forceOpen={forceOpen}>
            <CategoryGrid stats={stats.categoryStats} />
          </Section>
        )}

        {/* ── Review items ── */}
        {(analysis.flagColumns.length > 0 || stats.statusStats.some(s => s.role === '처리상태')) && (
          <Section
            title="검토 · 조치 필요"
            badge={`${needsAction + (review ?? 0)}건`}
            sub="즉시 처리가 필요한 항목"
            forceOpen={forceOpen}
          >
            <ReviewCards rows={rows} analysis={analysis} />
          </Section>
        )}

        {/* ── URL funnel (education) ── */}
        {stats.urlStats.filter(u => u.dayNum !== undefined).length > 0 && (
          <Section title="과제 제출 현황" badge={`${stats.urlStats.length}개`} forceOpen={forceOpen}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.urlStats.map((u, i) => (
                <div key={u.header} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 20, height: 20, borderRadius: 5, background: PALETTE[i % PALETTE.length] + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: PALETTE[i % PALETTE.length] }}>{u.dayNum}</span>
                  <span style={{ width: 90, fontSize: 12, color: 'var(--text-dim)', flexShrink: 0 }}>{u.header}</span>
                  <div style={{ flex: 1, height: 5, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${u.rate}%`, background: PALETTE[i % PALETTE.length], borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: PALETTE[i % PALETTE.length], minWidth: 48, textAlign: 'right', fontFamily: 'ui-monospace,monospace' }}>{u.rate}%</span>
                  <span style={{ fontSize: 11, color: 'var(--text-mute)', minWidth: 56 }}>{u.submittedCount}/{u.total}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Full table ── */}
        <Section title="전체 데이터" badge={`${rows.length} rows`} forceOpen={forceOpen}>
          <DataTable headers={headers} rows={rows} analysis={analysis} />
        </Section>

      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>YENA RE Analytics · Powered by Claude + Google Workspace</span>
        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Read-only · © 2026</span>
      </footer>
    </div>
  )
}
