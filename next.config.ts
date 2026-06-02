import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  serverExternalPackages: ['googleapis'],
  outputFileTracingRoot: path.join(__dirname, '../'),
}

export default nextConfig
