#!/usr/bin/env node
/**
 * Start a dedicated portal dev server (same pattern as deploy/arcus docker-compose).
 *
 * Usage: node scripts/run-portal-dev.mjs [staff|lp|investee|apply]
 *
 * Optional overrides, so a second set of instances can run alongside the default ones without
 * fighting over ports or over each other's build output:
 *   --port=<n>       listen somewhere other than the portal's default port
 *   --dist=<suffix>  build into `.next-<portal>-<suffix>` instead of `.next-<portal>`
 *   --lp-url=<url>   what the staff portal should use as the LP portal link target
 * A distinct --dist is required whenever --port is used: two `next dev` processes sharing one
 * distDir clobber each other's inlined NEXT_PUBLIC_* values.
 */
import { spawn } from "node:child_process"

const argv = process.argv.slice(2)
const flag = (name) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : undefined
}

const portal = (argv.find((a) => !a.startsWith("--")) || "staff").toLowerCase()
const ports = { staff: 3001, lp: 3110, investee: 3120, apply: 3130 }
const port = Number(flag("port") || process.env.PORTAL_PORT || ports[portal])

if (!port) {
  console.error(`Unknown portal "${portal}". Use: staff | lp | investee | apply`)
  process.exit(1)
}

const distSuffix = flag("dist") || process.env.PORTAL_DIST_SUFFIX
const distDir = distSuffix ? `.next-${portal}-${distSuffix}` : `.next-${portal}`

if ((flag("port") || process.env.PORTAL_PORT) && !distSuffix) {
  console.error("--port requires --dist=<suffix> so this instance does not share a build dir.")
  process.exit(1)
}

const env = {
  ...process.env,
  NEXT_PUBLIC_PORTAL: portal,
  // Per-portal distDir so concurrent `dev:staff` + `dev:investee` do not
  // clobber each other's inlined NEXT_PUBLIC_PORTAL in shared `.next`.
  NEXT_DIST_DIR: distDir,
}

if (portal === "staff") {
  env.NEXT_PUBLIC_INVESTEE_PORTAL_URL =
    env.NEXT_PUBLIC_INVESTEE_PORTAL_URL || "http://localhost:3120"
  env.NEXT_PUBLIC_LP_PORTAL_URL =
    flag("lp-url") || env.NEXT_PUBLIC_LP_PORTAL_URL || "http://localhost:3110"
  env.NEXT_PUBLIC_APPLY_PORTAL_URL = env.NEXT_PUBLIC_APPLY_PORTAL_URL || "http://localhost:3130"
  if (!env.NEXT_PUBLIC_APPLY_PORTAL_REDIRECT) {
    env.NEXT_PUBLIC_APPLY_PORTAL_REDIRECT = "1"
  }
}

console.log(`Starting ${portal} portal on http://localhost:${port} (distDir=${distDir})`)

const child = spawn("npx", ["next", "dev", "-p", String(port)], {
  stdio: "inherit",
  env,
  shell: true,
})

child.on("exit", (code) => process.exit(code ?? 0))
