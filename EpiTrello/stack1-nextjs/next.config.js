/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Security Headers Configuration
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            // Prevent MIME type sniffing
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Powered-By',
            value: '',
          },
          {
            // Clickjacking protection
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            // Content Security Policy
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-inline for development
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://gerfhenmhblqgxemwqbe.supabase.co wss://gerfhenmhblqgxemwqbe.supabase.co",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },

  // Disable X-Powered-By header
  poweredByHeader: false,
}

module.exports = nextConfig

