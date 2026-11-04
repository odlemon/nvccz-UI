

## Accounting work rules

- The six original Accounting functionality PDFs in `C:\Users\lysp\Downloads` are the source of truth for Accounting workflows and behavior; the UI inspiration PDF is not a functional specification.
- For each Accounting task, consult only the relevant source document(s) when the user gives that task, then trace the existing frontend, API, and database workflow before changing behavior.
- Do not proactively compare the full system to the Accounting documents before a task is assigned. Ask or state a focused assumption only when a real workflow conflict blocks the requested change.
- The user may ask to restore an older Accounting UI. Inspect the current page and the legacy implementation first; preserve required current functionality and validate the business flow against the relevant SRD.
- Make changes locally and verify them when requested. Do not deploy unless the user explicitly requests deployment for that task.
- After completing an Accounting task, report the changed behavior, relevant checks, and any remaining gap plainly.
- Current task state: handoff prepared; wait for the user’s next Accounting task.
