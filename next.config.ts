import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Simple config - remove swcMinify (deprecated in Next.js 15)
  experimental: {
    optimizeCss: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'evixjvagwjmjdjpbazuj.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;