/** @type {import('next').NextConfig} */
const nextConfig = {
  // ...existing config...
  reactStrictMode: false, // Disable strict mode to prevent double mounting in dev
  // Isolate webpack output when running multiple portal dev servers in parallel
  // (staff :3001 + investee :3120, etc.). Shared `.next` overwrites NEXT_PUBLIC_PORTAL
  // and causes staff login to send portal=investee.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Each portal dev server writes into its own `.next-<portal>` (above), but by default every
  // instance also WATCHES the whole project root — including the dist dirs the other instances
  // are writing. Two servers running together then trigger each other endlessly: one rebuilds,
  // its output lands in the tree, the other sees a change and rebuilds, and so on. The visible
  // symptom is a chunk being rewritten while it is being served, so the browser receives a
  // truncated file and dies with "SyntaxError: Invalid or unexpected token" and a ChunkLoadError.
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/.git/**', '**/node_modules/**', '**/.next*/**'],
    }
    return config
  },
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
