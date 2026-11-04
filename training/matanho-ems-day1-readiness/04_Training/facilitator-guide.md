# Day 1 facilitator guide — verified labels only

## Before the session

1. Confirm the client date/time, attendee list, sponsor, access approvals, and secure data-submission channel.
2. Check [environment verification](../03_Configuration/environment-verification-report.md), service health and the seven-module matrix on the day of use. Do not assume yesterday's health is current.
3. Verify approved encrypted backup and restore process. Do not upload client records until controls are accepted.
4. Sign in using a named test account; never put its password in notes or slides. Watch the top-right for error toasts and record exact text immediately.
5. Verify each planned screen on the live environment. Current fund save and investor workflow are blocked; skip these steps as “working” demos until retested.

## Admin orientation (browser-observed)

**Business objective:** orient users to Home and module navigation.  
**Role:** development admin test account.  
**Starting URL:** `https://dev.matanho.com/login` → staff Home.  
**Visible route/labels:** top bar shows a **Home** link, organization selector **Matanho**, **Modules**, and **Notifications**. The module picker heading is **Select Module**; observed entries include **Portfolio Management**, **Payroll**, **Procurement**, **Accounting**, **Events**, **FP&A**, and **Fundraising & Investor Relations**.

1. Open the approved dev URL and sign in as admin. **Expected:** signed-in Home and correct environment/account identity. Verify the URL and display name before sharing the screen.
2. Point out Home and the top-bar **Modules** switcher. Open **Modules** and identify apps by their visible names. Do not infer permissions from visibility alone.
3. Choose **Portfolio Management** → left navigation **Funds**. The Funds screen labels observed include **Funds Overview**, **Create fund**, **As of date**, **Fund filter**, and **New distribution**.
4. Open **Create fund** only in an approved synthetic environment. Wizard steps are **Details**, **Ownership**, **Review**. Fields seen in Details: **Fund name**, **Strategy**, **Vintage**, **Currency**, **Target commitment**, **Primary geography**, **Description**. Strategy options shown: Growth Equity, Early Stage, Buyout, Climate Infrastructure, SME Growth, Private Equity. Currency options shown: USD, ZAR, ZWG, EUR.
5. Ownership step displayed **Management fee**, **Carry terms**, **Minimum investment**, **Maximum investment**, **Focus industries**. Review showed the summary and a **Create fund** button, with text that it creates a live fund via POST `/funds`.
6. **Current stop point:** a synthetic save stayed in **Saving…** beyond 30 seconds, with no record ID or definitive outcome. Do not retry, create a second record, or tell participants creation passed. First check Funds list for that exact name and inspect the request outcome safely.

## Investor workflow and ordinary-user session

Not verified in the current live browser pass. No investor form labels/buttons are documented here. Before showing: navigate to the verified Investor Relations function via **Fundraising & Investor Relations**, inspect the actual UI, create an approved synthetic investor, link only to a verified fund, save, refresh, and retrieve. Then log out and log in with an ordinary test persona; demonstrate only allowed screens and actions after the access matrix passes. Never invent labels or permission outcomes.

## Error toast protocol

Keep the top-right corner visible during each step. Record exact heading/description, route, account role, action immediately before toast, timestamp, and whether retry/reload changes it. Capture a redacted screenshot/trace where supported. Do not dismiss a financial/security error before recording it. Known prior dev alert: “Couldn't load the people directory — Unauthorized”; its exact root cause and post-fix retest are outstanding.
## Day 4 due diligence and portfolio-management session

Use the [Day 4 UAT evidence sheet](../06_Reports/day4-due-diligence-portfolio-management-uat.md). Demonstrate the authorised-user path first, then repeat only protected actions with the restricted persona. Record exact routes, synthetic IDs, save/refresh results, denial messages, acting user, timestamps, and Activity/Audit entries. Do not treat a visible button or seeded metric as proof of persistence. If an upload, save, approval, or refresh step fails, stop duplicate submissions and record the failure before recovery.
