# Leave Application Implementation Plan

This document records the CS Form No. 6 analysis and the recommended implementation path for the BOAC Personnel Hub leave module. It exists so future Codex sessions, including sessions on another PC, can continue from the same product and technical context.

## Source Files Reviewed

- `leave application/CS Form No. 6, Revised 2020 (Application for Leave) (Fillable).xlsx`
- `leave application/CS Form No. 6, Revised 2020 (Application for Leave) (Secured).pdf`
- `src/routes/leave.tsx`
- `src/routes/self-service.tsx`
- `src/lib/leave-api.ts`
- `src/lib/requests-api.ts`
- `src/routes/employees.$id.tsx`
- `server/index.mjs`
- Existing SQL dumps containing leave tables and seed data

## Current System State

The leave module already has a basic flow:

- Employee self-service can submit a leave request.
- HR/Admin can file leave for an employee.
- HR/Admin can approve, disapprove, cancel, or delete a leave application.
- Employee profile has leave balances, leave applications, and leave credit adjustments.
- Leave credits are stored by leave type in `leave_balances`.
- Approved leave deducts from the selected leave type balance by increasing `used` and decreasing `balance`.

Current seeded leave types:

1. Vacation Leave
2. Sick Leave
3. Mandatory/Forced Leave
4. Special Privilege Leave
5. Maternity Leave
6. Paternity Leave
7. Solo Parent Leave
8. Leave Without Pay

Current `leave_applications` fields are too generic for CS Form No. 6:

- `employee_id`
- `leave_type_id`
- `date_from`
- `date_to`
- `days_requested`
- `reason`
- `status`
- `approver_id`
- `decision_remarks`
- `decided_at`
- `created_by`

## CS Form No. 6 Required Leave Types

The form supports these leave categories:

1. Vacation Leave
2. Mandatory/Forced Leave
3. Sick Leave
4. Maternity Leave
5. Paternity Leave
6. Special Privilege Leave
7. Solo Parent Leave
8. Study Leave
9. 10-Day VAWC Leave
10. Rehabilitation Privilege
11. Special Leave Benefits for Women
12. Special Emergency / Calamity Leave
13. Adoption Leave
14. Monetization of Leave Credits
15. Terminal Leave
16. Others

The system currently lacks:

- Study Leave
- 10-Day VAWC Leave
- Rehabilitation Privilege
- Special Leave Benefits for Women
- Special Emergency / Calamity Leave
- Adoption Leave
- Monetization of Leave Credits
- Terminal Leave
- Generic Others

## CS Form No. 6 Fields To Support

### Applicant / Employee Details

These can be pulled from employee records where possible:

- Office / department
- Name
- Date of filing
- Position
- Salary

Salary may not be consistently available in the current employee schema. If missing, support a manual value on the application.

### Type of Leave

Store the selected leave type as structured data, not only free text.

Recommended leave type metadata:

- `code`
- `name`
- `legal_basis`
- `is_paid`
- `is_credit_based`
- `credit_group`
- `max_days`
- `sort_order`
- `requires_advance_filing`
- `advance_days`
- `filing_rule`
- `requirements_json`
- `detail_schema_json`
- `is_active`

### Details of Leave

The form has conditional details depending on leave type:

- Vacation / Special Privilege Leave:
  - Within the Philippines
  - Abroad, specify location
- Sick Leave:
  - In hospital, specify illness
  - Out patient, specify illness
- Special Leave Benefits for Women:
  - Specify illness
- Study Leave:
  - Completion of master's degree
  - BAR / board examination review
- Other purpose:
  - Monetization of leave credits
  - Terminal leave
  - Other purpose text
- Commutation:
  - Requested
  - Not requested

Recommended application fields:

- `detail_location_type` enum: `Philippines`, `Abroad`, `NotApplicable`
- `detail_location_text`
- `detail_sick_type` enum: `Hospital`, `OutPatient`, `NotApplicable`
- `detail_illness`
- `detail_study_purpose` enum: `MastersDegree`, `BarBoardReview`, `NotApplicable`
- `detail_other_purpose` enum: `Monetization`, `TerminalLeave`, `Other`, `NotApplicable`
- `detail_other_text`
- `commutation_requested` boolean
- `form_payload` JSON for future fields that do not deserve first-class columns yet

### Leave Credits Certification

CS Form No. 6 section 7.A certifies Vacation Leave and Sick Leave balances:

- As of date
- Vacation Leave total earned
- Vacation Leave less this application
- Vacation Leave balance
- Sick Leave total earned
- Sick Leave less this application
- Sick Leave balance
- Certifying officer

Recommended approach:

- Add a separate `leave_credit_certifications` table or embed a certification snapshot into each application.
- Prefer a separate table if certification can be updated independently.
- Store snapshot values so exported historical forms remain accurate even if balances change later.

Suggested fields:

- `application_id`
- `as_of_date`
- `vl_total_earned`
- `vl_less_this_application`
- `vl_balance`
- `sl_total_earned`
- `sl_less_this_application`
- `sl_balance`
- `certified_by`
- `certified_at`

### Recommendation

CS Form No. 6 section 7.B:

- For approval
- For disapproval due to reason
- Authorized officer

Current system jumps directly from Pending to Approved/Disapproved. Add recommendation as a workflow step.

Suggested fields:

- `recommendation_status` enum: `Pending`, `ForApproval`, `ForDisapproval`
- `recommendation_reason`
- `recommended_by`
- `recommended_at`

### Final Action

CS Form No. 6 section 7.C and 7.D:

- Approved days with pay
- Approved days without pay
- Approved other days / specify
- Disapproved due to reason
- Authorized official

Suggested fields:

- `approved_days_with_pay`
- `approved_days_without_pay`
- `approved_days_other`
- `approved_days_other_text`
- `final_disapproval_reason`
- Reuse existing `status`, `approver_id`, `decision_remarks`, and `decided_at`, but align labels in the UI with Form 6.

## Documentary Requirements From Page 2

These should be shown dynamically in the UI and stored as checklist/attachment records.

### Vacation Leave

- File five days in advance whenever possible.
- Indicate whether leave is within the Philippines or abroad.
- Used for travel authority and clearance from money/work accountabilities.

### Mandatory / Forced Leave

- Annual five-day vacation leave is forfeited if not taken during the year.
- If scheduled leave is cancelled due to exigency of service by the head of agency, it is no longer deducted from accumulated vacation leave.
- One day or more Vacation Leave can count toward forced leave compliance, subject to rules.

### Sick Leave

- File immediately upon return.
- If filed in advance or exceeding five days, require medical certificate.
- If no medical consultation was availed of, require applicant affidavit.

### Maternity Leave

- 105 days.
- Proof of pregnancy, such as ultrasound or doctor's certificate showing expected delivery date.
- CS Form No. 6a Notice of Allocation of Maternity Leave Credits, if needed.
- Seconded female employees enjoy maternity leave with full pay in the recipient agency.

### Paternity Leave

- 7 days.
- Proof of child's delivery, such as birth certificate or medical certificate.
- Marriage contract.

### Special Privilege Leave

- 3 days.
- File/approve at least one week before availment, except emergency cases.
- Indicate whether within the Philippines or abroad.

### Solo Parent Leave

- 7 days.
- File in advance or whenever possible five days before leave.
- Updated Solo Parent Identification Card.

### Study Leave

- Up to 6 months.
- Must meet agency internal requirements, if any.
- Contract between agency head or authorized representative and employee.

### 10-Day VAWC Leave

- 10 days.
- File in advance or immediately upon return.
- Requires one of the supporting documents listed in the instructions:
  - Barangay Protection Order
  - Temporary/Permanent Protection Order
  - Certification that BPO/TPO/PPO application was filed
  - Police report and medical certificate, subject to supervisor discretion

### Rehabilitation Leave

- Up to 6 months.
- Apply within one week from the accident unless longer period is warranted.
- Letter request supported by relevant reports, such as police report if any.
- Medical certificate stating injuries, treatment, and need for rest/recuperation/rehabilitation.
- Written concurrence of a government physician if attending physician is private, especially on duration.

### Special Leave Benefits For Women

- Up to 2 months.
- May be filed at least five days before scheduled gynecological surgery.
- In emergency, file immediately upon return, but agency should be notified during confinement.
- Medical certificate and clinical summary from proper medical authorities.
- Histopathological report.
- Operative technique used.
- Duration of surgery and peri-operative period.
- Estimated recuperation period.

### Special Emergency / Calamity Leave

- Up to 5 days.
- Maximum of five straight working days or staggered within 30 days from actual calamity/disaster.
- Once per year, not every instance of calamity/disaster.
- Office head is responsible for verifying eligibility.
- Verify residence, calamity area declaration, and other needed proof.

### Monetization Of Leave Credits

- If monetizing 50% or more of accumulated leave credits, require letter request to head of agency with valid and justifiable reasons.

### Terminal Leave

- Require proof of resignation, retirement, or separation from service.

### Adoption Leave

- Authenticated copy of Pre-Adoptive Placement Authority issued by DSWD.

### Clearance Requirement

For leave of absence of 30 calendar days or more, and for terminal leave, require clearance from money, property, and work-related accountabilities.

## Recommended Database Changes

Prefer additive migrations in `server/index.mjs` because the app currently creates/migrates tables at startup.

### Update `leave_types`

Add metadata columns:

- `legal_basis TEXT NULL`
- `is_credit_based TINYINT(1) NOT NULL DEFAULT 1`
- `credit_group VARCHAR(30) NULL`
- `max_days DECIMAL(8,3) NULL`
- `advance_notice_days INT NULL`
- `filing_rule TEXT NULL`
- `requirements_json JSON NULL`
- `detail_schema_json JSON NULL`

Seed all CS Form No. 6 leave types using stable codes:

- `VL`
- `FL`
- `SL`
- `ML`
- `PL`
- `SPL`
- `SP` for Solo Parent Leave, because the current database already uses this code
- `STUDY`
- `VAWC`
- `REHAB`
- `SLBW`
- `CALAMITY`
- `ADOPTION`
- `MONETIZATION`
- `TERMINAL`
- `OTHERS`
- Keep `LWOP` as an internal/system leave type if needed for attendance/payroll, but it is not listed as a main checkbox in CS Form No. 6.

### Update `leave_applications`

Add Form 6 detail fields:

- `salary_snapshot DECIMAL(12,2) NULL`
- `detail_location_type VARCHAR(30) NULL`
- `detail_location_text VARCHAR(255) NULL`
- `detail_sick_type VARCHAR(30) NULL`
- `detail_illness TEXT NULL`
- `detail_study_purpose VARCHAR(50) NULL`
- `detail_other_purpose VARCHAR(50) NULL`
- `detail_other_text TEXT NULL`
- `commutation_requested TINYINT(1) NOT NULL DEFAULT 0`
- `requirements_payload JSON NULL`
- `form_payload JSON NULL`
- `recommendation_status VARCHAR(30) NULL`
- `recommendation_reason TEXT NULL`
- `recommended_by INT UNSIGNED NULL`
- `recommended_at DATETIME NULL`
- `approved_days_with_pay DECIMAL(8,3) NULL`
- `approved_days_without_pay DECIMAL(8,3) NULL`
- `approved_days_other DECIMAL(8,3) NULL`
- `approved_days_other_text TEXT NULL`
- `final_disapproval_reason TEXT NULL`

### Add Attachments Table

Suggested table: `leave_application_attachments`

- `id CHAR(36) PRIMARY KEY`
- `application_id CHAR(36) NOT NULL`
- `requirement_key VARCHAR(120) NOT NULL`
- `label VARCHAR(255) NOT NULL`
- `file_name VARCHAR(255) NULL`
- `file_path TEXT NULL`
- `uploaded_by INT UNSIGNED NULL`
- `uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`
- `verified_by INT UNSIGNED NULL`
- `verified_at DATETIME NULL`
- `status ENUM('Pending','Submitted','Verified','Rejected') NOT NULL DEFAULT 'Pending'`
- `remarks TEXT NULL`

If file upload is too much for the first pass, store requirement checklist status first and add file upload later.

### Add Certification Table

Suggested table: `leave_credit_certifications`

- `id CHAR(36) PRIMARY KEY`
- `application_id CHAR(36) NOT NULL UNIQUE`
- `as_of_date DATE NULL`
- `vl_total_earned DECIMAL(8,3) NOT NULL DEFAULT 0`
- `vl_less_this_application DECIMAL(8,3) NOT NULL DEFAULT 0`
- `vl_balance DECIMAL(8,3) NOT NULL DEFAULT 0`
- `sl_total_earned DECIMAL(8,3) NOT NULL DEFAULT 0`
- `sl_less_this_application DECIMAL(8,3) NOT NULL DEFAULT 0`
- `sl_balance DECIMAL(8,3) NOT NULL DEFAULT 0`
- `certified_by INT UNSIGNED NULL`
- `certified_at DATETIME NULL`

## Recommended API Changes

### Leave Types

Update:

- `GET /api/leave/types`
- `POST /api/leave/types`

Return metadata fields so the frontend can render dynamic instructions and requirements.

### Applications

Update:

- `GET /api/leave/applications`
- `POST /api/leave/applications`
- `GET /api/employees/:id/leave`
- `POST /api/leave/applications/:id/decision`

Add endpoints:

- `GET /api/leave/applications/:id`
- `POST /api/leave/applications/:id/recommendation`
- `POST /api/leave/applications/:id/certification`
- `POST /api/leave/applications/:id/requirements`
- `GET /api/leave/applications/:id/form6`

The `form6` endpoint should eventually export a filled CS Form No. 6 as Excel or PDF.

## Frontend Implementation Plan

### Self-Service Apply Form

Replace the generic leave modal with a Form 6-aware form:

1. Select leave type.
2. Show legal basis and filing rule.
3. Show dynamic details:
   - Location for Vacation/SPL
   - Hospital/outpatient and illness for Sick
   - Illness/surgery detail for SLBW
   - Study purpose for Study Leave
   - Other purpose for Monetization/Terminal/Others
   - Commutation requested/not requested
4. Show requirement checklist based on selected type.
5. Capture dates, days, and reason.
6. Validate max days and common filing requirements.

### HR Leave Management

Upgrade `/leave` from a simple approval table into a review workspace:

- Table/list remains for scanning.
- Detail panel/dialog shows:
  - Applicant details
  - Form 6 details
  - Requirements checklist
  - Leave credit certification
  - Recommendation
  - Final action
- Add actions:
  - Certify credits
  - Recommend approval/disapproval
  - Approve/disapprove/cancel
  - Export CS Form No. 6

### Employee Profile Leave Tab

Show:

- Leave balances
- Applications
- Certification snapshots where available
- Adjustments

Keep credit adjustment for HR/Admin only.

## Export Strategy

The fillable XLSX contains real VML checkbox controls on page 1. It can be used as a template, but editing VML checkboxes directly is fragile.

Recommended phases:

1. First pass: store complete Form 6 data and render the application in-app.
2. Second pass: generate a filled printable document.
3. Export option:
   - Generate XLSX using the official fillable template, writing values into target cells and updating checkbox states.
   - Or generate PDF directly using a controlled server-side layout that matches CS Form No. 6.

For reliability, prefer a server-generated PDF after the data model is stable. Keep the official XLSX as a visual/layout reference.

## Validation Rules To Implement

Initial rules:

- Days requested must be greater than zero.
- Date from and date to are required.
- Date to cannot be before date from.
- The application calendar should lock the earliest selectable start date based on the leave type's advance notice rule. This is now started in self-service and HR filing forms through the leave type `advanceNoticeDays` metadata.
- Days requested should be automatic by default. This is now started with a Monday-Friday working-day calculation in employee self-service and HR filing. HR has an override for half-day, shift, holiday, or special cases.
- Later implementation must replace the first-pass weekday-only day count with a proper working-day engine that reads holidays, employee rest days, schedule overrides, and shift assignments before deducting leave credits.
- Require location for Vacation Leave and Special Privilege Leave.
- Require sick leave details for Sick Leave.
- Require study purpose for Study Leave.
- Require other purpose details for Monetization, Terminal Leave, and Others.
- Warn if Vacation Leave is filed less than 5 days in advance.
- Warn if Special Privilege Leave is filed less than 7 days in advance.
- Warn or require medical certificate when Sick Leave exceeds 5 days or is filed in advance.
- Require clearance flag/checklist for leave of 30 calendar days or more and Terminal Leave.
- Enforce max days where applicable:
  - Maternity: 105 days
  - Paternity: 7 days
  - Special Privilege: 3 days
  - Solo Parent: 7 days
  - Study Leave: up to 6 months
  - VAWC: 10 days
  - Rehabilitation: up to 6 months
  - Special Leave Benefits for Women: up to 2 months
  - Calamity: 5 days

Some rules should be warnings rather than blockers because HR may need discretion.

## Suggested Build Order

1. Add leave type metadata and seed all CS Form No. 6 types.
2. Add Form 6 fields to `leave_applications`.
3. Update row mapping and API types.
4. Update employee self-service apply form with dynamic fields.
5. Update HR leave application form with same dynamic fields.
6. Add requirement checklist storage.
7. Add credit certification and recommendation workflow.
8. Update final approval to store days with pay/without pay/others.
9. Update employee leave tab and request history displays.
10. Add CS Form No. 6 export.
11. Add focused tests or manual verification checklist.

## Files Most Likely To Change

- `server/index.mjs`
- `src/lib/leave-api.ts`
- `src/lib/requests-api.ts`
- `src/routes/self-service.tsx`
- `src/routes/leave.tsx`
- `src/routes/employees.$id.tsx`
- Possibly `src/routes/requests.tsx`
- Possibly SQL dump files only if intentionally refreshing committed database snapshots

## Notes For Future Codex Sessions

- Do not treat current leave type list as complete. It is only a starter set.
- Preserve existing leave data by using additive migrations.
- Keep HR/Admin permissions consistent with existing `requireLeaveRead` and `requireLeaveWrite`.
- Current credit deduction happens only when status becomes `Approved`; preserve that behavior while expanding final action fields.
- Be careful with leave types that are not simple credit deductions. Maternity, paternity, solo parent, VAWC, calamity, rehabilitation, study, adoption, monetization, and terminal leave may need entitlement/checklist logic rather than direct balance deduction.
- The CS Form No. 6 second page is instructions and requirements. It does not need to be entered by users, but the system should display relevant requirements dynamically and track compliance.
