import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable CSS optimization to fix LightningCSS deployment issues
  experimental: {
    optimizeCss: false,
  },
  // Also try disabling SWC minification as fallback
  swcMinify: true,
};

export default nextConfig;