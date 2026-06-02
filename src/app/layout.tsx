import type { Metadata } from 'next'
import { Geist_Mono } from 'next/font/google'
import './globals.css'

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'YENA RE Analytics — AI 부동산 마케팅 대시보드',
  description: 'AI 기반 부동산 분양·상담 데이터 대시보드 by YENA',
  robots: 'noindex,nofollow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={geistMono.variable}>
        {children}
      </body>
    </html>
  )
}
