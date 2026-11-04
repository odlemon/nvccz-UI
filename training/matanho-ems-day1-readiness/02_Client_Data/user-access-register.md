# User access request and verification register

No passwords, reset links, or MFA recovery codes belong here. The required names below come from the task and are **not** proof that these accounts exist or that their role mappings are approved.

| User | Function / department | Requested business role | Requested system modules/actions | Approval authority | Fund/entity scope | Provisioning | Verification / outstanding |
|---|---|---|---|---|---|---|---|
| Tino | Confirm with client | Payroll administrator (requested) | Full Payroll administration; other access to confirm | Await sponsor | Await client | Not verified | Actual account and role not available in this dev assessment. |
| Sophia | Confirm with client | Payroll administrator (requested) | Full Payroll administration; other access to confirm | Await sponsor | Await client | Not verified | Actual account and role not available in this dev assessment. |
| Ropa | Confirm with client | Payroll administrator (requested) | Full Payroll administration; other access to confirm | Await sponsor | Await client | Not verified | Actual account and role not available in this dev assessment. |
| Brendon | Confirm with client | Restricted staff (requested) | Home; scoped Portfolio; own My Pay; Procurement: create requisition only; Accounting: create requisition only; scoped Events | Await sponsor | Await client | Not verified | Do not infer actual user identity from local role-equivalent fixture. |
| Natsai | Confirm with client | Restricted staff (requested) | Same restricted actions as approved above | Await sponsor | Await client | Not verified | Actual account/role and dev access not verified. |
| Vongai | Confirm with client | Restricted staff (requested) | Same restricted actions as approved above | Await sponsor | Await client | Not verified | Actual account/role and dev access not verified. |
| Gilbert | Confirm with client | Restricted staff (requested) | Same restricted actions as approved above | Await sponsor | Await client | Not verified | Actual account/role and dev access not verified. |
| Admin NTS | Development test account | Admin label shown in UI | Test-only admin access | Not client approval | Dev test data only | Signed-in session observed | Fresh sign-in verified only to extent shown in browser; no password recorded. |

## Reusable blank row

|  |  |  |  |  |  |  |  |

## 15 Oct 2026 local synthetic verification addendum

These results are local UAT evidence only and do not replace client approval or provisioning verification:

| Synthetic persona | Observed local evidence | Client provisioning status |
|---|---|---|
| Ropa | Database role mapping is `PAYROLL_ADMIN`; local Payroll employee-admin API returned HTTP 200. | Not client-provisioned / sponsor approval still required. |
| Brendon | Personal Payroll API HTTP 200; Payroll administration and broad Procurement API checks returned HTTP 403; Funds read returned HTTP 200 and Funds create returned HTTP 403. | Not client-provisioned / sponsor approval still required. |
| Natsai, Vongai, Gilbert | Personal Payroll API returned HTTP 200 in the local synthetic matrix. Gilbert browser reached My Pay and Payroll administration denial. | Not client-provisioned / sponsor approval still required. |

No attendance names or client identities were inferred from these synthetic personas.

Before provisioning, confirm least privilege, exact action-level permissions, separation of duties, fund/entity restrictions, access expiry, and independent approval. After provisioning, verify navigation **and** API actions as both allowed and denied cases.
