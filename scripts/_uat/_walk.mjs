import { chromium } from "playwright"
import fs from "node:fs"
const pages = (process.argv[2] || "documents,audit").split(",")
const b = await chromium.launch({ headless: false, args: ["--window-position=-2400,0", "--window-size=1500,1000"] })
const p = await (await b.newContext({ viewport: { width: 1500, height: 1000 } })).newPage()
p.setDefaultTimeout(120000)
p.on("pageerror", (e) => console.log("PAGE ERR", String(e).slice(0, 200)))
await p.goto("http://localhost:3120/login"); await p.waitForTimeout(4500)
await p.fill('input[type="email"]', "admin@nts.com"); await p.fill('input[type="password"]', "admin123")
await Promise.all([p.waitForResponse((r) => r.url().includes("/auth/login")), p.click('button[type="submit"]')])
await p.waitForTimeout(3500)
fs.mkdirSync("design-refs/documents-audit/screens/_walk", { recursive: true })
for (const pg of pages) {
  await p.goto(`http://localhost:3120/procurement/${pg}`); await p.waitForTimeout(30000)
  await p.screenshot({ path: `design-refs/documents-audit/screens/_walk/${pg}.png`, fullPage: true })
  console.log("==", pg, "\nACTIONS:", await p.evaluate(() => [...new Set([...document.querySelectorAll("[data-action]")].map((e) => e.dataset.action))].join(" ")))
  console.log((await p.locator("body").innerText()).replace(/\n+/g, " | ").slice(0, 1800))
}
await b.close()
