# Portfolio module emails — branded letterhead

## Design

All investment / deal-workflow emails use the same newsletter transactional shell:

- 600px card
- Gradient header + CID company logo (Company Profile branding)
- Body copy + application details card where relevant
- Dark footer with audience note

Shared helpers in `nvccz/src/services/EmailNotificationService.ts`:

- `buildApplicationLifecycleEmailBrandedDocument`
- `sendBrandedApplicantEmail` / `sendBrandedInvestmentMail`

## Covered senders (applicant + staff deal workflow)

| Sender | Audience |
|--------|----------|
| Application received / shortlisted / rejected / below threshold | Applicant |
| DD started / completed | Applicant |
| Board review started | Applicant |
| Investment decision / implementation started | Applicant |
| Term sheet created / approved / rejected | Applicant |
| Portal credentials / portfolio company created / stage update | Applicant |
| Disbursement approved / completed | Applicant |
| DD task assigned / activity update / activity approved | Staff |
| Lead analyst assigned | Staff |
| Board vote request / results | Staff |
| Deal feed / collaboration mentions | Staff |
| CFO pending disbursement / analyst disbursement approved | Staff |

## Out of scope (separate designs)

- Capital call notices (official notice HTML + PDF attachment)
- Payroll / FP&A / vendor / reporting emails outside the investment deal flow

## FE intake after public apply

1. Applicant submits at `/funding-application` (no login).
2. Application lands at `SCREENING_PENDING`.
3. Staff open **Portfolio → Deal Flow** (`/portfolio-v11/deals`) — deal appears under **Screening**.
4. Live mode hides **Add Deal**; use **Launch applicant portal** for new intake.
5. Staff next: assign lead analyst → AI/analyst screening → Active DD → term sheet → board → implementation.

## Test samples

```bash
cd C:\Users\lysp\Downloads\nvccz
npx ts-node --transpile-only -r dotenv/config scripts/send-test-application-lifecycle-emails.ts
```

Default recipient: `nyashakarata1@gmail.com` (override with `TEST_APPLICATION_EMAIL_TO`).
