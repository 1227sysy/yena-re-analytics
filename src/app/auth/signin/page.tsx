'use client'

import { signIn } from 'next-auth/react'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function SignInContent() {
  const params = useSearchParams()
  const callbackUrl = params.get('callbackUrl') ?? '/'

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(135deg, #f3efff 0%, #fdf4ff 30%, #eaf6ff 60%, #fff4f8 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'PretendardVariable','Pretendard',-apple-system,sans-serif",
      padding: 24,
    }}>
      {/* 배경 동그라미 장식 */}
      <div style={{ position: 'fixed', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,252,0.12), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -60, left: -60, width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,157,0.10), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '40%', left: '10%', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,178,244,0.08), transparent 70%)', pointerEvents: 'none' }} />

      <div style={{
        background: '#fff',
        border: '1.5px solid #e2dcf8',
        borderRadius: 24,
        padding: '48px 40px',
        maxWidth: 420,
        width: '100%',
        boxShadow: '0 8px 40px rgba(124,92,252,0.10), 0 2px 8px rgba(0,0,0,0.04)',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* 로고 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #7c5cfc, #b48bfd)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 800, color: '#fff',
            boxShadow: '0 4px 14px rgba(124,92,252,0.35)',
          }}>Y</div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1e1a3a', letterSpacing: '-0.02em' }}>YENA RE Analytics</div>
            <div style={{ fontSize: 11, color: '#a09bc0', marginTop: 1 }}>AI 부동산 마케팅 대시보드</div>
          </div>
        </div>

        {/* 이모지 장식 */}
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏠✨</div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e1a3a', marginBottom: 8, letterSpacing: '-0.02em' }}>
          반갑습니다!
        </h1>
        <p style={{ fontSize: 14, color: '#5a5380', marginBottom: 32, lineHeight: 1.6 }}>
          Google 계정으로 로그인하면<br />
          실시간 데이터 대시보드를 바로 확인할 수 있어요 🎉
        </p>

        {/* Google 로그인 버튼 */}
        <button
          onClick={() => signIn('google', { callbackUrl })}
          style={{
            width: '100%',
            padding: '14px 20px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, #7c5cfc, #9b7ffd)',
            border: 'none',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: '0 4px 18px rgba(124,92,252,0.35)',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(124,92,252,0.45)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = ''
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 18px rgba(124,92,252,0.35)'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#fff" fillOpacity="0.9"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#fff" fillOpacity="0.8"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#fff" fillOpacity="0.7"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#fff" fillOpacity="0.6"/>
          </svg>
          Google 계정으로 로그인
        </button>

        {/* 구분선 */}
        <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: '#ede9ff' }} />
          <span style={{ fontSize: 11, color: '#a09bc0' }}>Read-only 대시보드</span>
          <div style={{ flex: 1, height: 1, background: '#ede9ff' }} />
        </div>

        {/* 특징 설명 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { icon: '📊', text: '실시간 데이터' },
            { icon: '🔒', text: '보안 접근' },
            { icon: '✨', text: 'AI 분석' },
            { icon: '📱', text: '어디서나' },
          ].map(item => (
            <div key={item.text} style={{
              background: '#f7f4ff',
              border: '1px solid #e2dcf8',
              borderRadius: 10,
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 12,
              color: '#5a5380',
              fontWeight: 500,
            }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>

        <p style={{ fontSize: 11, color: '#c0bcd8', marginTop: 24 }}>
          Powered by Claude + Google Workspace
        </p>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInContent />
    </Suspense>
  )
}
