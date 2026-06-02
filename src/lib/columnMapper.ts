import type {
  ColumnMapping, ColumnRole, ColumnType, SheetAnalysis
} from '@/types'

function inferColumn(header: string, index: number, rows: string[][]): ColumnMapping {
  const h = header.toLowerCase().trim()
  const samples = rows.slice(0, 20).map(r => r[index] ?? '').filter(Boolean)

  // ── 메일/티켓 전용 ─────────────────────────────────────────────────────────
  if (h.includes('티켓') && (h.includes('id') || h === '티켓id')) {
    return { index, header, type: 'text', role: '티켓ID', displayName: '티켓ID' }
  }
  if (h === '발신자유형' || h.includes('발신자유형')) {
    return { index, header, type: 'category', role: '발신자유형', displayName: '발신자유형' }
  }
  if (h === '발신자' || h.includes('발신자')) {
    return { index, header, type: 'text', role: '발신자', displayName: '발신자' }
  }
  if (h === '언어' || h === 'language') {
    return { index, header, type: 'category', role: '언어', displayName: '언어' }
  }
  if (h === '분류' || h.includes('메일분류') || h.includes('카테고리')) {
    return { index, header, type: 'category', role: '분류', displayName: '분류' }
  }
  if (h === '담당부서' || h.includes('부서')) {
    return { index, header, type: 'category', role: '담당부서', displayName: '담당부서' }
  }
  if (h === '중요도' || h.includes('priority') || h.includes('우선순위')) {
    return { index, header, type: 'numeric', role: '중요도', displayName: '중요도' }
  }
  if (h === '감정' || h.includes('sentiment') || h.includes('감정분석')) {
    return { index, header, type: 'category', role: '감정', displayName: '감정' }
  }
  if (h.includes('sla') || h.includes('기한')) {
    return { index, header, type: 'datetime', role: 'SLA기한', displayName: 'SLA기한' }
  }
  if (h === '지연' || h.includes('overdue') || h.includes('초과')) {
    return { index, header, type: 'boolean', role: '지연', displayName: '지연' }
  }
  if (h === '처리상태' || h.includes('처리') && h.includes('상태')) {
    return { index, header, type: 'status', role: '처리상태', displayName: '처리상태' }
  }
  if (h === '회신여부' || h.includes('회신')) {
    return { index, header, type: 'status', role: '회신여부', displayName: '회신여부' }
  }
  if (h === '검토필요' || h.includes('검토') || h.includes('review')) {
    return { index, header, type: 'boolean', role: '검토필요', displayName: '검토필요' }
  }
  if (h.includes('ai') && (h.includes('초안') || h.includes('조치') || h.includes('답변'))) {
    return { index, header, type: 'longtext', role: 'AI초안', displayName: 'AI초안' }
  }
  if (h.includes('draft') || h.includes('draft상태')) {
    return { index, header, type: 'status', role: 'Draft상태', displayName: 'Draft상태' }
  }
  if (h.includes('gmail') || (h.includes('링크') && samples.some(v => v.includes('mail.google')))) {
    return { index, header, type: 'url', role: '과제URL', displayName: 'Gmail링크' }
  }
  if (h.includes('최근수신') || h.includes('수신일') || h.includes('수신(')) {
    return { index, header, type: 'datetime', role: '수신일시', displayName: '수신일시' }
  }
  if (h.includes('경과') || h.includes('경과일') || h.includes('d+')) {
    return { index, header, type: 'numeric', role: '경과일', displayName: '경과(일)' }
  }

  // ── URL ───────────────────────────────────────────────────────────────────
  const dayMatch = header.match(/(\d+)일차/)
  if (dayMatch || h.includes('url') || samples.some(v => /^https?:\/\//.test(v))) {
    return {
      index, header, type: 'url', role: '과제URL',
      dayNum: dayMatch ? parseInt(dayMatch[1]) : undefined,
      displayName: header,
    }
  }

  // ── Email ─────────────────────────────────────────────────────────────────
  if (h.includes('이메일') || h.includes('email') || h.includes('mail') ||
      samples.some(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))) {
    return { index, header, type: 'email', role: '이메일', displayName: '이메일' }
  }

  // ── Phone ─────────────────────────────────────────────────────────────────
  if (h.includes('전화') || h.includes('phone') || h.includes('연락처') || h.includes('휴대')) {
    return { index, header, type: 'phone', role: '연락처', displayName: '연락처' }
  }

  // ── Name ──────────────────────────────────────────────────────────────────
  if (h === '이름' || h === '성명' || h.includes('고객명') || h === 'name') {
    return { index, header, type: 'text', role: h.includes('고객') ? '고객명' : '수강생명', displayName: '이름' }
  }

  // ── Numeric sequence ──────────────────────────────────────────────────────
  if (h === 'no' || h === 'num' || h === '번호' || h === '순번' || h === '순서' ||
      (samples.length > 0 && samples.every(v => !isNaN(Number(v)) && Number(v) > 0))) {
    return { index, header, type: 'numeric', role: '번호', displayName: header }
  }

  // ── Datetime ──────────────────────────────────────────────────────────────
  if (h.includes('일자') || h.includes('날짜') || h.includes('일시') || h.includes('date') ||
      h.includes('상담일') || h.includes('방문일') ||
      samples.some(v => /\d{4}[-./]\d{2}[-./]\d{2}/.test(v))) {
    return { index, header, type: 'datetime', role: h.includes('방문') ? '방문일' : '상담일', displayName: header }
  }

  // ── Real-estate CRM ───────────────────────────────────────────────────────
  if (h.includes('관심지역') || (h.includes('지역') && !h.includes('담당'))) {
    return { index, header, type: 'category', role: '관심지역', displayName: '관심지역' }
  }
  if (h.includes('평형') || h.includes('면적') || h.includes('타입')) {
    return { index, header, type: 'category', role: '관심평형', displayName: '관심평형' }
  }
  if (h.includes('예산') || h.includes('budget')) {
    return { index, header, type: 'numeric', role: '예산', displayName: '예산' }
  }
  if (h.includes('유입') || h.includes('경로') || h.includes('채널')) {
    return { index, header, type: 'category', role: '유입경로', displayName: '유입경로' }
  }
  if (h.includes('담당')) {
    return { index, header, type: 'category', role: '담당자', displayName: '담당자' }
  }
  if (h.includes('계약') || h.includes('가능성')) {
    return { index, header, type: 'status', role: '계약가능성', displayName: '계약가능성' }
  }
  if (h.includes('후속') || h.includes('follow')) {
    return { index, header, type: 'boolean', role: '후속관리여부', displayName: '후속관리' }
  }
  if (h.includes('메모') || h.includes('note') || h.includes('비고') || h.includes('특이사항')) {
    return { index, header, type: 'longtext', role: '메모', displayName: '메모' }
  }
  if (h.includes('상태') || h.includes('status') || h.includes('단계')) {
    return { index, header, type: 'status', role: '상담상태', displayName: header }
  }

  if (samples.some(v => v.length > 80)) {
    return { index, header, type: 'longtext', role: 'unknown', displayName: header }
  }
  if (samples.length > 0 && samples.every(v => !isNaN(Number(v.replace(/[,원%]/g, ''))))) {
    return { index, header, type: 'numeric', role: '수강생번호', displayName: header }
  }

  return { index, header, type: 'category', role: 'unknown', displayName: header }
}

export function analyzeSheet(headers: string[], rows: string[][]): SheetAnalysis {
  const columns: ColumnMapping[] = headers.map((h, i) => inferColumn(h, i, rows))

  const urlColumns     = columns.filter(c => c.type === 'url')
  const emailColumns   = columns.filter(c => c.type === 'email')
  const nameColumn     = columns.find(c => c.role === '수강생명' || c.role === '고객명' || c.role === '발신자')
  const dateColumns    = columns.filter(c => c.type === 'datetime')
  const statusColumns  = columns.filter(c => c.type === 'status')
  const numericColumns = columns.filter(c => c.type === 'numeric')
  const categoryColumns = columns.filter(c => c.type === 'category')
  const flagColumns    = columns.filter(c => c.type === 'boolean')

  const isMailCRM = columns.some(c =>
    ['처리상태', '회신여부', '발신자유형', '감정', '티켓ID'].includes(c.role)
  )
  const hasCRM = columns.some(c =>
    ['관심지역', '상담상태', '계약가능성', '유입경로'].includes(c.role)
  )
  const hasUrlDays = urlColumns.some(c => c.dayNum !== undefined)

  const datasetType = isMailCRM ? 'mail-crm'
    : hasCRM ? 'real-estate-crm'
    : hasUrlDays ? 'education-tracking'
    : 'general'

  return {
    columns, datasetType,
    urlColumns, emailColumns, nameColumn,
    dateColumns, statusColumns, numericColumns,
    categoryColumns, flagColumns,
  }
}
