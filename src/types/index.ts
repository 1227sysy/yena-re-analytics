export type ColumnType =
  | 'numeric' | 'text' | 'email' | 'url' | 'datetime'
  | 'category' | 'status' | 'boolean' | 'phone' | 'address' | 'longtext'

export type ColumnRole =
  | '수강생번호' | '수강생명' | '이메일' | '과제URL' | '번호'
  | '고객명' | '연락처' | '상담일' | '방문일' | '관심지역' | '관심평형'
  | '관심타입' | '예산' | '상담상태' | '계약가능성' | '유입경로'
  | '담당자' | '메모' | '후속관리여부'
  // 메일/티켓 전용
  | '티켓ID' | '발신자' | '발신자유형' | '언어' | '분류'
  | '담당부서' | '중요도' | '감정' | 'SLA기한' | '지연'
  | '처리상태' | '회신여부' | '검토필요' | 'AI초안' | 'Draft상태'
  | '수신일시' | '경과일'
  | 'unknown'

export interface ColumnMapping {
  index: number
  header: string
  type: ColumnType
  role: ColumnRole
  dayNum?: number
  displayName: string
}

export interface SheetAnalysis {
  columns: ColumnMapping[]
  datasetType: 'real-estate-crm' | 'education-tracking' | 'mail-crm' | 'general'
  urlColumns: ColumnMapping[]
  emailColumns: ColumnMapping[]
  nameColumn?: ColumnMapping
  dateColumns: ColumnMapping[]
  statusColumns: ColumnMapping[]
  numericColumns: ColumnMapping[]
  categoryColumns: ColumnMapping[]
  flagColumns: ColumnMapping[]   // boolean/검토필요/지연 등
}

export interface URLColumnStat {
  dayNum?: number
  header: string
  submittedCount: number
  total: number
  rate: number
}

export interface CategoryStat {
  value: string
  count: number
  pct: number
}

export interface CategoryColumnStats {
  header: string
  role: ColumnRole
  index: number
  values: CategoryStat[]
}

export interface FlagStat {
  header: string
  role: ColumnRole
  trueCount: number
  total: number
  rate: number
}

export interface IncompleteStudent {
  name: string
  email: string
  missing: string[]
  rowIndex: number
}

export interface DashboardStats {
  totalRows: number
  emailCount: number
  urlStats: URLColumnStat[]
  completionRate: number
  incompleteStudents: IncompleteStudent[]
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor'
  categoryStats: CategoryColumnStats[]
  statusStats: CategoryColumnStats[]
  flagStats: FlagStat[]
}

export interface DashboardData {
  analysis: SheetAnalysis
  headers: string[]
  rows: string[][]
  stats: DashboardStats
  lastUpdated: string
  sheetTitle: string
  error?: string
}
