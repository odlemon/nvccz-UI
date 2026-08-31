#!/usr/bin/env node
/**
 * Start a dedicated portal dev server (same pattern as deploy/arcus docker-compose).
 *
 * Usage: node scripts/run-portal-dev.mjs [staff|lp|investee|apply]
 */
import { spawn } from "node:child_process"

const portal = (process.argv[2] || "staff").toLowerCase()
const ports = { staff: 3001, lp: 3110, investee: 3120, apply: 3130 }
const port = ports[portal]

if (!port) {
  console.error(`Unknown portal "${portal}". Use: staff | lp | investee | apply`)
  process.exit(1)
}

const env = {
  ...process.env,
  NEXT_PUBLIC_PORTAL: portal,
}

if (portal === "staff") {
  env.NEXT_PUBLIC_INVESTEE_PORTAL_URL =
    env.NEXT_PUBLIC_INVESTEE_PORTAL_URL || "http://localhost:3120"
  env.NEXT_PUBLIC_LP_PORTAL_URL = env.NEXT_PUBLIC_LP_PORTAL_URL || "http://localhost:3110"
  env.NEXT_PUBLIC_APPLY_PORTAL_URL = env.NEXT_PUBLIC_APPLY_PORTAL_URL || "http://localhost:3130"
  if (!env.NEXT_PUBLIC_APPLY_PORTAL_REDIRECT) {
    env.NEXT_PUBLIC_APPLY_PORTAL_REDIRECT = "1"
  }
}

console.log(`Starting ${portal} portal on http://localhost:${port}`)

const child = spawn("npx", ["next", "dev", "-p", String(port)], {
  stdio: "inherit",
  env,
  shell: true,
})

child.on("exit", (code) => process.exit(code ?? 0))
