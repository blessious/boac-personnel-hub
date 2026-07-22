# Reference Libraries QA Report

**Date:** 20 June 2026  
**Scope:** `hr_reference_values` migration, reference APIs, permissions, hierarchy, audit trail, backup coverage, validation fixes, and Employee References frontend integration.

## Final Result

**Functional pass.** All confirmed QA findings were corrected and passed isolated regression testing. Rendered browser layout verification remains pending because the in-app browser connection was unavailable in this workspace session.

## Data Safety

- All mutation tests used disposable MySQL databases.
- Disposable databases and QA users were removed after each run.
- Generated QA backup artifacts were deleted after validation.
- No QA records were added to the home-PC `hris_db`.

## Initial Core QA: 31/31 Passed

Coverage included:

- Additive schema migration, columns, indexes, unique constraints, and restricted parent deletion
- Idempotent portable SQL migration
- Authentication and Admin/HR authorization
- All nine reference categories
- Create, update, activate/deactivate, and delete behavior
- Sector -> Office -> Division -> Section hierarchy
- Duplicate, wrong-parent, date-range, blank-field, and sort-order validation
- Audit events
- Backup inclusion

## Corrective Regression QA: 27/27 Passed

Confirmed fixes:

- Office requires an active Sector.
- Division requires an active Office.
- Section/Unit requires an active Division.
- Existing hierarchy records cannot be orphaned during update.
- New and reactivated children cannot use inactive parents.
- Parents with active children cannot be deactivated.
- Parent deactivation succeeds after children are inactive or reassigned.
- Malformed parent IDs return HTTP 400.
- Codes over 80 characters return HTTP 400.
- Names over 200 characters return HTTP 400.
- Non-ISO and impossible dates return HTTP 400.
- Non-boolean active status returns HTTP 400.
- Out-of-range sort values return HTTP 400.
- Valid create/update/delete, duplicate protection, audit logging, HR read access, and HR mutation denial remain working.

## Frontend and Build Checks

- Code input is limited to 80 characters.
- Name input is limited to 200 characters.
- Parent selection is required for Office, Division, and Section/Unit.
- Inactive parents are not available for new selection.
- Save is disabled until required fields and hierarchy parent are present.
- Modified implementation files pass ESLint.
- Client and server production builds pass.
- Server syntax check passes.

The repository-wide lint command still reports pre-existing line-ending/formatting errors in unrelated files. The modified implementation files have no lint errors.

## Resolved Findings

| Finding | Previous severity | Resolution |
|---|---:|---|
| F-01: Hierarchical values could be saved without a parent | High | Resolved and regression-tested |
| F-02: Inactive parents accepted new/active children | Medium | Resolved and regression-tested |
| F-03: Missing input-boundary validation caused HTTP 500 or silent parent removal | Medium | Resolved and regression-tested |

## Remaining QA Limitation

The in-app browser connection was unavailable. UI code compiled and passed lint, but rendered layout, horizontal tab scrolling, and physical click-through behavior were not visually certified in this session.
