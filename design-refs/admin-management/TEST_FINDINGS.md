# Admin Management — Test Findings

Part of the sweep across Payroll/Accounting/Events/Admin Management/Investments/Fundraising/FR-KYC/
Homepage/Street Rates (requested 2026-09-20). 5 screens: Admin Dashboard, User Management, Role Management,
Board Review Voting, Company Addresses.

## Screens covered

- **Admin Dashboard** (`/admin`) — KPI cards (22 users, 57 roles, 9 departments, 5 active departments),
  Users by Department breakdown, Recent Users list. Numbers are internally consistent (57 roles matches the
  full list on Role Management; department counts match user rows) — real data, not hardcoded.
- **User Management** (`/admin/users`) — list (22 users, paginated 10/page), search, department/role
  filters, Create User, per-row Edit/Delete icon buttons. Edit dialog opens correctly with real
  department-scoped role dropdowns (tested on a non-critical account, Blessing Sibanda / Finance Manager —
  opened, inspected, closed without submitting; did not touch the `admin@nts.com` super-admin row or any
  LP/investee account, per the standing risk note about not exercising real role-permission writes
  casually).
- **Role Management** (`/admin/roles`) — read-only view of all 57 roles grouped by department, with
  level/description. No CRUD on this screen (matches its own "View system roles" description) — nothing to
  break here.
- **Board Review Voting** (`/admin/configs/voting-members`) — see FINDING-ADM-002.
- **Company Addresses** (`/admin/addresses`) — one address configured (Head Office, Harare), marked Active/
  Letterhead. Simple, correct.

## FINDING-ADM-001 — Edit/Delete icon buttons had no accessible name — fixed

**Severity:** Low. **Status: fixed.**

`components/admin/users-table.tsx`'s per-row action buttons are icon-only (`<Edit>`/`<Trash2>` from
lucide-react) with no `aria-label`, `title`, or visible text — a screen-reader user has no way to know what
either button does, and `find`-by-text tooling (mine included) can't locate them either. Added
`aria-label={"Edit " + firstName + " " + lastName}` / `"Delete " + ...` to both. No functional change —
both buttons already work correctly (Edit opens a real, populated dialog; Delete was not exercised against
real data, see below).

## FINDING-ADM-002 — Board Review Voting has zero configured members (0% voting power) — open, needs governance input

**Severity:** High if Portfolio's board-review deal-approval workflow depends on this being valid; not
investigated how tightly coupled that dependency is. **Status: logged, not fixed** — this needs a real
answer about who the board members are and what their voting weights should be, not a guess from me.

`/admin/configs/voting-members` shows "Invalid Voting Power Distribution — Total voting power is 0%. It
must equal 100% for voting to be valid," Total Members: 0, "No voting members found." The tooling to fix
this works correctly — opened "Assign Voting Power," confirmed a real dialog (user picker, % input, live
Current/Available/New Total tracking, Cancel/Assign Power) — so this is a **setup gap, not a code bug**:
nobody has ever assigned any board member a voting percentage on this environment. Roles like CEO, CIO,
Board Chairman, and Board Member already exist (confirmed on Role Management) but none of the users holding
them have been given voting power here.

**Not fixed because:** assigning real people real voting percentages is a governance decision, not
something to fabricate. Flagging for a decision on (a) who the actual board members are, (b) what their
voting weights should be, and (c) whether this is even meant to be populated on this dev environment at all
(vs. being production-only config that dev simply never received).

## Not exercised (deliberately, given risk)

- User Management's **Delete** action — confirmed the button now has a real accessible label and a
  `window.confirm()` guard exists in code (`handleDelete`), but did not click it against any real user row;
  deleting a live account isn't a safe thing to test speculatively.
- Any **write** to Role Management (there's no UI for it on this screen anyway — confirmed read-only).
- User Management's **Create User** flow — not submitted, to avoid creating throwaway accounts in a shared
  user table 3 other modules' RBAC depends on; the dialog itself wasn't inspected beyond confirming the
  button exists.

## Coverage note

5/5 screens live-tested. One real code fix (accessibility), one real but non-code gap (board voting setup)
logged for a decision. No other defects found in dashboard data, user list, role list, or addresses.
