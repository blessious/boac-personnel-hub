# Employee Movement Management QA Report

Date: 2026-06-22

## Scope

Governed personnel actions integrated with employee profiles and Plantilla occupancy.

## Implemented controls

- Draft, Submitted, Reviewed, Approved, Posted, Rejected, and Reversed lifecycle
- HR/Admin preparation; Admin review, approval, rejection, posting, and reversal
- Immutable event history and before/after posting snapshots
- Atomic employee and Plantilla updates during posting
- Target-item vacancy and active-status validation
- One active occupancy per employee and item through Plantilla constraints
- Stale-source protection when employee or occupancy changes after preparation
- Later-movement protection before reversal
- Effectivity and current-occupancy date validation
- Required reasons for rejection and reversal
- Authority details and up to 20 supporting-document references
- Audit events and database-backup coverage

## Automated QA results

Passed 14 transactional workflow checks using temporary records removed after testing:

1. Draft creation
2. Submission
3. Review
4. Approval
5. Appointment posting
6. Employee current-profile synchronization
7. Plantilla occupancy synchronization
8. Appointment reversal
9. Re-posting after reversal
10. Retirement posting
11. Employee inactivation
12. Plantilla vacancy creation
13. Retirement reversal
14. Prior occupancy restoration

Additional verification:

- Database schema initialization: passed
- Backend syntax: passed
- Focused ESLint: passed
- Production client/SSR build: passed
- Temporary QA data cleanup: passed

## Remaining STRH validation

- Confirm who may prepare, review, approve, and post each action type.
- Confirm whether one Admin may perform multiple approval stages or separation of duties is mandatory.
- Confirm required attachments and retention rules. Current implementation records document names and references/locations; direct binary file upload is not yet included.
- Validate action-specific required fields, effectivity rules, and authorized signatories.
- UAT using real appointment, promotion, transfer, detail, step-increment, and separation samples.
