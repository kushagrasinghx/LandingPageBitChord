import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      // Apple Music album artwork (hero).
      { protocol: 'https', hostname: '*.mzstatic.com' },
    ],
  },
}

export default nextConfig
