import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Simple config - remove swcMinify (deprecated in Next.js 15)
  experimental: {
    optimizeCss: false,
  },
};

export default nextConfig;