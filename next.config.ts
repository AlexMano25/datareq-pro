import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Build autonome pour le conteneur Docker (deploy/vps/Dockerfile)
  output: 'standalone',
  // Racine de traçage = ce dossier (évite qu'un lockfile parent ne déplace server.js)
  outputFileTracingRoot: path.join(__dirname),
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
    {
      source: '/sitemap.xml',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=86400, s-maxage=86400' },
      ],
    },
  ],
};

export default nextConfig;
