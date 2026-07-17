# Contacts — Stage-by-stage flow

**Index:** [`fundraising-stages-index.md`](./fundraising-stages-index.md)  
**SRD:** People under Investor Organisations; reusable across campaigns  
**Route:** `/fundraising/contacts`  
**Component:** `components/fundraising/fundraising-contacts.tsx`  
**Mock:** `contacts-mock-data.ts`  
**Backend asks (when implementing):** `fundraising-contacts-backend-asks.md` *(create on first BE gap)*

**Product rules**

- Contacts belong to an Investor Organisation; reusable across campaigns.
- Store: name, department, position, email, phone, decision influence, consent, last interaction, next planned action.
- Influence taxonomy (SRD/UI intent): Decision Maker / Influencer / Gatekeeper / Analyst (align wizard with table).
- Consent and confidential handling matter for outreach.

---

## Status diagram

```
[0 Open Contacts]
   → [1 Search / filter]
   → [2 Select contact → detail]
   → [3 Add contact]
   → [4 Edit / archive]
   → [5 View communication history]
   → [6 Export]
```

---

## Stage 0 — Open Contacts

| | |
|---|---|
| **Who** | IR Officer |
| **Goal** | Land on people directory |
| **Steps** | 1. Open `/fundraising/contacts`. 2. Confirm table columns: Contact, Organisation, Influence, Consent, Owner, Next action, Last touch. |
| **Done when** | List loads (or empty state). |
| **FE now / BE blocked** | Mock table + detail aside. |

---

## Stage 1 — Search and filter

| | |
|---|---|
| **Who** | IR Officer |
| **Goal** | Find the right person at an org |
| **Steps** | 1. Search name/email. 2. Filter by organisation and owner. |
| **Done when** | Filtered list is usable for outreach. |
| **FE now / BE blocked** | Search + org/owner filters. |

---

## Stage 2 — Contact detail

| | |
|---|---|
| **Who** | Deal Manager / IR |
| **Goal** | Prep follow-up with influence, consent, campaigns |
| **Steps** | 1. Select row. 2. Read contact info, influence, consent, linked campaigns, next action, last touch. 3. Navigate to parent org when needed. |
| **Done when** | Detail is sufficient to act. |
| **FE now / BE blocked** | Detail panel present. **No deep link to Investor 360.** |

---

## Stage 3 — Add Contact

| | |
|---|---|
| **Who** | IR Officer |
| **Goal** | Create reusable contact linked to an organisation |
| **Steps** | 1. **Add Contact**. 2. Identity (name, email, phone, department, position). 3. Organisation link. 4. Influence + consent. 5. Review → save. |
| **Done when** | Contact persists under org; appears in list and org 360 Contacts tab. |
| **FE now / BE blocked** | Wizard: details → org → relationship → review. Toast only. Wizard influence uses High/Medium/Low (**mismatch** with table taxonomy). Phone/department/consent incomplete in wizard. |

---

## Stage 4 — Edit / archive

| | |
|---|---|
| **Who** | IR Officer |
| **Goal** | Maintain accuracy without losing history |
| **Steps** | 1. Edit fields. 2. Archive when no longer active. |
| **Done when** | Updates persist; archive hides from default list. |
| **FE now / BE blocked** | **Missing.** |

---

## Stage 5 — Communication history

| | |
|---|---|
| **Who** | IR Officer |
| **Goal** | See prior interactions for this contact |
| **Steps** | 1. From detail, open communication history. 2. Optionally log new interaction (Communications module). |
| **Done when** | History for contact id is visible. |
| **FE now / BE blocked** | **Missing** on this screen. Comms module is separate. |

---

## Stage 6 — Export

| | |
|---|---|
| **Who** | Analyst |
| **Goal** | Export contact list |
| **Steps** | Export filtered results. |
| **Done when** | File downloaded. |
| **FE now / BE blocked** | Toast only. |

---

## Status table

| Stage | UI today | Notes |
|------:|----------|-------|
| 0 Open | Mock | Table shell |
| 1 Filter | Partial | Basic |
| 2 Detail | Partial | No org 360 link |
| 3 Add | Partial | Toast; taxonomy mismatch |
| 4 Edit/Archive | Missing | — |
| 5 Comms history | Missing | — |
| 6 Export | Missing | Toast |
