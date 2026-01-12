import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow devtunnels for local development with tunnels
  // Uses APP_URL from environment variables
  allowedDevOrigins: process.env.APP_URL ? [process.env.APP_URL] : [],
  // Configure external image domains for Next.js Image component
  images: {
    remotePatterns: [
      {
        // Allow images from Unsplash (placeholder images)
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        // Allow images from placeholder.com
        protocol: "https",
        hostname: "via.placeholder.com",
        port: "",
        pathname: "/**",
      },
      {
        // Allow images from Wikimedia Commons (integration logos)
        protocol: "https",
        hostname: "upload.wikimedia.org",
        port: "",
        pathname: "/**",
      },
      {
        // Allow images from Google (Google Analytics logo)
        protocol: "https",
        hostname: "www.gstatic.com",
        port: "",
        pathname: "/**",
      },
      {
        // Allow images from CDN World Vector Logo (Zapier logo)
        protocol: "https",
        hostname: "cdn.worldvectorlogo.com",
        port: "",
        pathname: "/**",
      },
    ],
    // Add these optimization settings
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [96, 128, 256, 384],
  },
};

export default nextConfig;
