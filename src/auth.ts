import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import type { NextAuthConfig } from 'next-auth'

const config: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    signIn({ profile }) {
      const raw = process.env.ALLOWED_HOSTED_DOMAINS ?? ''
      const allowedDomains = raw.split(',').map(d => d.trim()).filter(Boolean)
      if (allowedDomains.length === 0) return true
      const email = (profile?.email ?? '').toLowerCase()
      return allowedDomains.some(domain => email.endsWith(`@${domain}`))
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(config)
