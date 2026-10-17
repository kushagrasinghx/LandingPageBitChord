import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    /**
     * On Cloudflare Workers every /_next/image hit is a billed Worker request
     * (~100 per page view with the shelves). Apple's CDN already serves sized
     * covers via artworkUrl, and /public images are small and come from static
     * assets for free, so the optimizer only cost requests and CPU.
     */
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      // Apple Music album artwork (hero).
      { protocol: 'https', hostname: '*.mzstatic.com' },
    ],
  },
}

export default nextConfig
