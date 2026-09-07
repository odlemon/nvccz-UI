/** @type {import('next').NextConfig} */
const nextConfig = {
  // ...existing config...
  reactStrictMode: false, // Disable strict mode to prevent double mounting in dev
  // Isolate webpack output when running multiple portal dev servers in parallel
  // (staff :3001 + investee :3120, etc.). Shared `.next` overwrites NEXT_PUBLIC_PORTAL
  // and causes staff login to send portal=investee.
  distDir: process.env.NEXT_DIST_DIR || '.next',
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
