/** @type {import('next').NextConfig} */
const nextConfig = {
  // ...existing config...
  reactStrictMode: false, // Disable strict mode to prevent double mounting in dev
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // Must match next.config.mjs / Docker runtime — otherwise /_next/image 404s on login bg
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
