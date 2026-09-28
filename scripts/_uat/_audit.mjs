import { chromium } from "playwright"
const b=await chromium.launch({headless:false,slowMo:60}); const pg=await (await b.newContext({viewport:{width:1500,height:1000}})).newPage()
pg.setDefaultTimeout(90000)
await pg.goto("http://localhost:3120/login");await pg.waitForTimeout(5000)
await pg.fill('input[type="email"]',"admin@nts.com");await pg.fill('input[type="password"]',"admin123")
await pg.click('button[type="submit"]');await pg.waitForTimeout(5000)
for (const r of ["tenders","quotations","evaluation","approvals"]) {
  await pg.goto("http://localhost:3120/procurement/"+r); await pg.waitForTimeout(25000)
  await pg.screenshot({path:`design-refs/sourcing-evaluation/screens/audit/${r}.png`})
  console.log("=====",r); console.log((await pg.locator("#workspace").innerText().catch(()=>"")).replace(/\n+/g,"\n").slice(0,1800))
}
await b.close()
