import type { NextConfig } from 'next';
import { parseEnvironment } from './src/lib/env';

parseEnvironment(process.env);
const config: NextConfig = {
  distDir: process.env.NEXT_BUILD_OUTPUT_DIR || '.next',
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};
export default config;
