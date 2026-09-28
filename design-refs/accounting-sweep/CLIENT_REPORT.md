# Accounting: what has been fixed

## Access and control

- Only finance staff can open accounting records now, and each person can do only what their role allows. Before, anyone who could sign in, including investor and applicant portal accounts, could read the ledger and post or reverse journals.
- Finance roles have the access they need. The Finance Manager, auditors and executives can open the financial statements, and preparers and approvers each have their own tier.
- Nobody can post a journal they prepared, including the CFO and administrators. An approver can no longer edit someone else's draft and then post it; they reject it instead.
- Locking or unlocking a month, voiding a journal, and switching an investment's posting mode are limited to the people responsible for them.
- The Access Control page shows who holds which permission and which people hold two duties that should be kept apart. Roles and users are managed in Admin, which opens in a new tab.

## Scheduled work

- These now run by themselves, on Harare time, each with a run history, an on/off switch and a "Run now" button:
  - daily investment interest at 23:59;
  - monthly depreciation;
  - the daily official exchange rate;
  - recurring journals;
  - month-end revaluation of foreign-currency balances;
  - maturity alerts, overdue-invoice alerts and close reminders;
  - a nightly check of the ledger.
- Only people who can post to the ledger can run a job manually or switch it off.
- Before, interest was only booked on days when someone signed in, and depreciation never ran on its own.
- The whole module uses Harare time, so a journal dated today is no longer refused between midnight and 2 a.m.

## Journals and month-end close

- The Journal Entries page works in full:
  - search and filter;
  - create or edit a draft, with a live check that it balances;
  - post, reject with a reason, withdraw your own draft, and void with a reversing entry.
- Each journal shows what it was raised for.
- Journals cannot be dated in the future.
- A posted journal can be voided only while its month is open, so figures for a locked, reported month stay as reported.
- Journals are never deleted, so the journal numbering has no unexplained gaps.
- A second, overlapping 2026 calendar has been removed; it could let a locked month be bypassed.
- The Period Close page:
  - shows the real checklist for the month, with owners and due dates;
  - shows how ready the month is: draft journals, unreconciled bank lines, investment interest, depreciation;
  - lets a month be locked only once its checklist is complete, and reopened only with a reason.
- Task owners can mark their own tasks done.
- The Approval Queue shows what is really waiting for you, labelled by what it is for, and each item can be approved or rejected there.
- Recurring journals start switched off. Someone other than the author must switch them on.

## Bank and cash

- Bank reconciliation compares against the bank statement:
  - import the statement, which must add up and follow on from the last reconciliation;
  - auto-match, match by hand, and book bank-only items such as charges and interest;
  - finish once every statement line is matched.
- A finished reconciliation can only be reopened as a whole, by an approver, with a reason.
- Nothing can be booked into a period that has already been reconciled.
- The cashbook page shows real balances and entries, and records receipts, payments and transfers.
- Only approvers can void cashbook entries, and a reconciled line blocks its journal from being voided.
- Every payment into or out of a bank account now has a cashbook line, whichever module posted it, so the cashbook agrees with the ledger. This covers assets, investments, capital calls, distributions, expenses and claims.
- Bank accounts:
  - only approvers can set them up or change them;
  - an account's currency and ledger account are fixed once it has entries;
  - an account cannot be switched off while money or unfinished work remains in it;
  - every change is recorded.

## Short-term investments

- Interest approvals post correctly.
- One CFO decision now settles an approval for a large placement. Before, every CFO account had to approve it separately.
- ZiG placements reach the CFO when they should.
- Interest cannot be accrued, and investments cannot be settled, for days that haven't happened yet.
- A backdated rate change recalculates the days still in draft. If a day has already been posted, the change is refused and the message names the first date it can take effect.
- Portfolio totals are in USD at the day's rate. They no longer add ZiG amounts to USD as if they were the same currency.
- Voiding a placement booked in error also reverses the cash, and voided interest no longer counts as income.
- The page runs entirely on real data:
  - register, detail and rate history;
  - place, change rate, accrue, approve, liquidate and void, each offered only to the roles allowed to do it.

## Foreign currency

- Every amount is valued in USD at the rate fixed when it was posted. The trial balance, statements, general ledger and Command Centre now give correct USD totals across currencies.
- The month-end revaluation books only the movement since the last one, as a draft for an approver to post. The FX Rates & Revaluation page shows a preview first.
- The FX page shows the stored rates, the exposure by currency and any missing or old rates. Rates can be entered or corrected, and a correction keeps the old value and the reason.
- The rate in the top bar is the one the ledger uses.

## Receivables

- A customer's payment is no longer credited twice, and it no longer has VAT taken off it.
- Allocating a payment checks the customer, currency and amount still owed, and undoing an allocation works.
- Credit notes are approved before they post, and applying one to an invoice works.
- A paid invoice cannot be voided. Voiding a sent invoice reverses its posting properly.
- The due date entered on an invoice is kept. Before, every invoice showed as overdue.
- The page shows:
  - what is owed and what is overdue;
  - ageing and days sales outstanding (DSO);
  - payments waiting to be allocated;
  - invoices, credit notes and customers, with every action working.

## Payables and payment runs

- Bills are shown by invoice number, and links to Procurement open in a new tab.
- New Payment Runs feature:
  1. A preparer picks the approved bills to pay from one bank account. Bills that can't be paid yet show why.
  2. Someone else approves the run, and the bills are checked again.
  3. The bank file lists each supplier's bank account.
  4. After the bank pays, the run is settled with the bank's confirmation. Each bill is then paid, with its journal and cashbook line.
- A bill that fails keeps its reason and can be settled again later.
- A run can only be cancelled with a reason, and every step is recorded.

## Expenses and employee claims

- An expense's status follows its approval. The paying bank is chosen, and the payment appears in the cashbook.
- Expenses are approved by someone other than the person who recorded them, and can be returned with what needs correcting.
- New Employee Claims page, which any staff member can use:
  1. The employee lists what they spent, with receipts. A receipt is required above the policy limit.
  2. The line manager approves.
  3. A finance reviewer checks the receipts and chooses the expense accounts.
  4. A finance manager approves it for payment, which posts it as owed to the employee, or rejects it.
  5. The claim is paid from a bank account in its currency.
- Nobody approves their own claim.
- Any approver can return a claim with what to correct, and the employee fixes it and resubmits.
- Possible duplicates and spending over a category's daily limit are flagged. Such a claim can only be approved with a written reason.
- The finance manager sets the policy: the receipt limit, the daily limits, and the default account for each category.

## Fixed assets

- Adding an asset, moving it, disposing of it, and running depreciation (with a preview) all work. Depreciation runs only for completed months.
- Assets are recorded in the base currency, and the paying bank must be named.
- An asset can leave the register only through a disposal.
- An asset bought on a supplier bill that is already posted moves the cost out of the bill's expense line, so the supplier is not owed twice.

## Inventory

- Every stock receipt, issue and count difference posts to the ledger immediately, so stock value and the inventory account agree.
- Stock is valued at moving weighted average.
- A count shortfall reduces stock, and only approvers can book count differences.
- Sales that include stock items work.
- The page shows items, stock movements with their journals, the month's movement from opening to closing stock, and a check against the ledger.

## Reports

- The trial balance, income statement, balance sheet, cash flow and general ledger are produced by the server from every journal, and can be exported. Before, they were built in the browser from at most 1,000 journals.
- The income statement shows the firm's investment income correctly. It had been showing a profit where the books hold a loss.
- The balance sheet shows a real difference if one exists instead of hiding it. Today it balances.
- The general ledger's opening balance counts posted journals only.
- The group consolidation now matches the balance sheet and balances. It shows each entity, the eliminations, and the source currency and rate of each translated amount.
- The Command Centre and CEO View show real figures: cash, amounts owed each way, revenue and profit against last year, what is waiting, and the month being closed.

## Tax

- VAT is posted and reported on the correct accounts.
- The VAT return:
  - counts posted journals only;
  - keeps currencies apart;
  - lists drafts separately;
  - can be exported.
- Accountants and finance managers can prepare tax return packs, and the CFO signs them off. A period that contains a voided journal can now be compiled.

## Chart of accounts, audit trail and documents

- An account that is switched off can't be posted to. An account can't be switched off while anything still depends on it.
- Every change to an account is recorded and shown on the account. A change sent for approval is checked when it is submitted.
- The Audit Trail:
  - covers every accounting area;
  - can be filtered by area, action, person, date and reference;
  - shows before and after values;
  - exports exactly what is filtered;
  - includes a full check of the journal sequence and balances.
- The Document Vault accepts documents only, and every upload is recorded.
- The Integrations page shows the modules that actually feed the ledger, with their journals, jobs and failures.

## Timesheets

- Approvers see the weeks waiting for them and can approve them, or return them with what to correct.
- Projects show approved, billable and waiting hours.

## General

- Every accounting page shows live data. Placeholder figures and buttons that did nothing have been removed.
- Pages open correctly from a direct link.
- A page that briefly loses its connection tries again before showing an error.
- Error messages give the reason instead of a status code.
- Buttons show that they are working while a save is in progress.
