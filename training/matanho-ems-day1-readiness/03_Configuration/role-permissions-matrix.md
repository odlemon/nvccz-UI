# Role and permissions matrix

“Requested” describes the task requirement. “Verified” requires a fresh live browser and API action test; no name-to-account mapping is inferred.

| Role/persona | Home | Portfolio | My Pay | Procurement | Accounting | Events | Full Payroll admin | Status |
|---|---|---|---|---|---|---|---|---|
| Admin NTS (dev test) | Visible | Switcher shows app | App visible | App visible | App visible | App visible | Not action-tested here | Signed-in browser observed; seven modules not workflow-tested. |
| Tino | Requested | Confirm | Confirm | Confirm | Confirm | Confirm | Requested admin | Actual identity and dev access not verified. |
| Sophia | Requested | Confirm | Confirm | Confirm | Confirm | Confirm | Requested admin | Actual identity and dev access not verified. |
| Ropa | Requested | Confirm | Confirm | Confirm | Confirm | Confirm | Requested admin | Actual identity and dev access not verified. |
| Brendon / Natsai / Vongai / Gilbert | Requested | Scoped permitted actions only | Own account only | Create purchase requisition only | Create requisition only | Scoped permissions | Deny | Actual accounts and exact policy not verified in dev. |

Prior local-only findings in `UAT_ACCESS_VERIFICATION.md`: synthetic restricted roles had overbroad module grants; local FP&A API fix passed CFO 200 vs analyst 403; Payroll self-service lacked linked Employee rows; Accounting requisition creation route was not found; Procurement create was not proven with a valid payload. These results are **not dev retests** and require fresh verification before sign-off.

Test each boundary both ways: visible menu, deep link, allowed action, denied action, own-record isolation, and audit evidence. A hidden button is not authorization proof.
