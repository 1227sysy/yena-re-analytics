'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ErrorContent() {
  const params = useSearchParams()
  const error = params.get('error')

  const messages: Record<string, string> = {
    AccessDenied: '이 대시보드는 허가된 계정만 접근할 수 있습니다. 관리자에게 문의하세요.',
    Configuration: '인증 설정 오류입니다. 환경변수를 확인해주세요.',
    Default: '로그인 중 오류가 발생했습니다.',
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
    }}>
      <div className="card" style={{ maxWidth: 440, width: '100%', padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>
          접근 불가
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
          {messages[error ?? 'Default'] ?? messages.Default}
        </p>
        <a href="/api/auth/signin" className="btn btn-primary" style={{ justifyContent: 'center' }}>
          다른 계정으로 로그인
        </a>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={null}>
      <ErrorContent />
    </Suspense>
  )
}
