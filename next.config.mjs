/** @type {import('next').NextConfig} */
const nextConfig = {
  // Isolate webpack output when running multiple portal dev servers in parallel
  // (staff :3001 + investee :3120, etc.). Shared `.next` overwrites NEXT_PUBLIC_PORTAL
  // and causes staff login to send portal=investee.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
