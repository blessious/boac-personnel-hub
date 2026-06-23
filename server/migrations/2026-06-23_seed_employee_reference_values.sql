-- Seed starter Employee References for visualization and initial setup.
-- These are editable defaults; replace or refine them with official STRH-approved values.

INSERT INTO hr_reference_values (category, code, name, description, sort_order)
VALUES
  ('sectors', 'EXEC', 'Executive Office', 'Top-level executive and hospital leadership offices.', 1),
  ('sectors', 'MED', 'Medical Services Sector', 'Medical care, clinical departments, and physician services.', 2),
  ('sectors', 'NURS', 'Nursing Services Sector', 'Nursing service, ward operations, and nursing supervision.', 3),
  ('sectors', 'HOPSS', 'Hospital Operations and Patient Support Sector', 'Ancillary, patient support, facility, and hospital operations services.', 4),
  ('sectors', 'ADMIN', 'Finance and Administrative Sector', 'Administrative, finance, HR, records, procurement, and general services.', 5),
  ('offices', 'OMCC', 'Office of the Medical Center Chief', 'Office responsible for overall hospital management and direction.', 1),
  ('offices', 'MED-OFF', 'Medical Office', 'Office grouping medical departments and physician services.', 2),
  ('offices', 'NURS-OFF', 'Nursing Office', 'Office grouping nursing divisions, wards, and nursing units.', 3),
  ('offices', 'HOPSS-OFF', 'Hospital Operations and Patient Support Office', 'Office grouping patient support and operational service units.', 4),
  ('offices', 'ADMIN-OFF', 'Finance and Administrative Office', 'Office grouping finance, HR, supply, records, and administrative units.', 5),
  ('divisions', 'MCC-DIV', 'Executive Management Division', NULL, 1),
  ('divisions', 'MED-DIV', 'Medical Division', NULL, 2),
  ('divisions', 'NURS-DIV', 'Nursing Division', NULL, 3),
  ('divisions', 'ANC-DIV', 'Ancillary Services Division', NULL, 4),
  ('divisions', 'SUP-DIV', 'Support Services Division', NULL, 5),
  ('divisions', 'ADMIN-DIV', 'Administrative Division', NULL, 6),
  ('divisions', 'FIN-DIV', 'Finance Division', NULL, 7),
  ('sections', 'ER', 'Emergency Room Unit', NULL, 1),
  ('sections', 'OPD', 'Outpatient Department Unit', NULL, 2),
  ('sections', 'WARD', 'Ward Nursing Unit', NULL, 3),
  ('sections', 'PHARM', 'Pharmacy Section', NULL, 4),
  ('sections', 'LAB', 'Laboratory Section', NULL, 5),
  ('sections', 'RAD', 'Radiology Section', NULL, 6),
  ('sections', 'HR', 'Human Resource Management Section', NULL, 7),
  ('sections', 'RECORDS', 'Records Section', NULL, 8),
  ('sections', 'SUPPLY', 'Supply and Property Section', NULL, 9),
  ('sections', 'BUDGET', 'Budget Section', NULL, 10),
  ('sections', 'ACCOUNTING', 'Accounting Section', NULL, 11),
  ('sections', 'CASH', 'Cashier Section', NULL, 12),
  ('sections', 'GSS', 'General Services Section', NULL, 13),
  ('eligibilities', 'CSP', 'Career Service Professional', 'Civil Service Professional eligibility.', 1),
  ('eligibilities', 'CSSP', 'Career Service Subprofessional', 'Civil Service Subprofessional eligibility.', 2),
  ('eligibilities', 'RA1080', 'RA 1080 / Board or Bar Eligibility', 'Professional license eligibility under Republic Act No. 1080.', 3),
  ('eligibilities', 'BAR', 'Bar Eligibility', 'Eligibility based on passing the Philippine Bar examination.', 4),
  ('eligibilities', 'BOARD', 'Board / PRC License', 'Eligibility based on a valid professional board or PRC license.', 5),
  ('eligibilities', 'NONE', 'No Eligibility Recorded', 'Temporary value when no eligibility has been encoded yet.', 99),
  ('employment-statuses', 'PERM', 'Permanent', 'Permanent appointment/status.', 1),
  ('employment-statuses', 'TEMP', 'Temporary', 'Temporary appointment/status.', 2),
  ('employment-statuses', 'COTER', 'Coterminous', 'Coterminous appointment/status.', 3),
  ('employment-statuses', 'CASUAL', 'Casual', 'Casual employment status.', 4),
  ('employment-statuses', 'CONTRACT', 'Contractual', 'Contractual employment status.', 5),
  ('employment-statuses', 'JO', 'Job Order', 'Job order engagement.', 6),
  ('employment-statuses', 'COS', 'Contract of Service', 'Contract of service engagement.', 7),
  ('job-levels', 'EXEC', 'Executive', 'Executive or head-of-office level.', 1),
  ('job-levels', 'DIVCHIEF', 'Division Chief', 'Division chief or equivalent management level.', 2),
  ('job-levels', 'SUP', 'Supervisory', 'Supervisory personnel.', 3),
  ('job-levels', 'TECH', 'Technical / Professional', 'Licensed, technical, or professional personnel.', 4),
  ('job-levels', 'ADMIN', 'Administrative', 'Administrative and clerical personnel.', 5),
  ('job-levels', 'SUPPORT', 'Support Staff', 'Operational and support staff.', 6),
  ('plantilla-types', 'PLANTILLA', 'Plantilla', 'Regular approved plantilla item.', 1),
  ('plantilla-types', 'NON-PLANTILLA', 'Non-Plantilla', 'Position or engagement not tied to a plantilla item.', 2),
  ('plantilla-types', 'CASUAL', 'Casual', 'Casual item or engagement.', 3),
  ('plantilla-types', 'JO', 'Job Order', 'Job order classification.', 4),
  ('plantilla-types', 'COS', 'Contract of Service', 'Contract of service classification.', 5),
  ('budget-codes', 'PS', 'Personnel Services', 'Personnel Services funding source or allotment.', 1),
  ('budget-codes', 'MOOE', 'Maintenance and Other Operating Expenses', 'MOOE funding source or allotment.', 2),
  ('budget-codes', 'TRUST', 'Trust Fund', 'Trust fund source.', 3),
  ('budget-codes', 'INCOME', 'Hospital Income', 'Hospital income or internally generated fund source.', 4),
  ('budget-codes', 'DOH-GAA', 'DOH GAA', 'Department of Health General Appropriations Act source.', 5)
ON DUPLICATE KEY UPDATE code = code;

UPDATE hr_reference_values child
JOIN hr_reference_values parent
  ON parent.category = 'sectors' AND parent.code = 'EXEC'
SET child.parent_id = parent.id
WHERE child.category = 'offices' AND child.code = 'OMCC' AND child.parent_id IS NULL;

UPDATE hr_reference_values child
JOIN hr_reference_values parent
  ON parent.category = 'sectors' AND parent.code = 'MED'
SET child.parent_id = parent.id
WHERE child.category = 'offices' AND child.code = 'MED-OFF' AND child.parent_id IS NULL;

UPDATE hr_reference_values child
JOIN hr_reference_values parent
  ON parent.category = 'sectors' AND parent.code = 'NURS'
SET child.parent_id = parent.id
WHERE child.category = 'offices' AND child.code = 'NURS-OFF' AND child.parent_id IS NULL;

UPDATE hr_reference_values child
JOIN hr_reference_values parent
  ON parent.category = 'sectors' AND parent.code = 'HOPSS'
SET child.parent_id = parent.id
WHERE child.category = 'offices' AND child.code = 'HOPSS-OFF' AND child.parent_id IS NULL;

UPDATE hr_reference_values child
JOIN hr_reference_values parent
  ON parent.category = 'sectors' AND parent.code = 'ADMIN'
SET child.parent_id = parent.id
WHERE child.category = 'offices' AND child.code = 'ADMIN-OFF' AND child.parent_id IS NULL;

UPDATE hr_reference_values child
JOIN hr_reference_values parent
  ON parent.category = 'offices' AND parent.code = 'OMCC'
SET child.parent_id = parent.id
WHERE child.category = 'divisions' AND child.code = 'MCC-DIV' AND child.parent_id IS NULL;

UPDATE hr_reference_values child
JOIN hr_reference_values parent
  ON parent.category = 'offices' AND parent.code = 'MED-OFF'
SET child.parent_id = parent.id
WHERE child.category = 'divisions' AND child.code = 'MED-DIV' AND child.parent_id IS NULL;

UPDATE hr_reference_values child
JOIN hr_reference_values parent
  ON parent.category = 'offices' AND parent.code = 'NURS-OFF'
SET child.parent_id = parent.id
WHERE child.category = 'divisions' AND child.code = 'NURS-DIV' AND child.parent_id IS NULL;

UPDATE hr_reference_values child
JOIN hr_reference_values parent
  ON parent.category = 'offices' AND parent.code = 'HOPSS-OFF'
SET child.parent_id = parent.id
WHERE child.category = 'divisions' AND child.code IN ('ANC-DIV', 'SUP-DIV') AND child.parent_id IS NULL;

UPDATE hr_reference_values child
JOIN hr_reference_values parent
  ON parent.category = 'offices' AND parent.code = 'ADMIN-OFF'
SET child.parent_id = parent.id
WHERE child.category = 'divisions' AND child.code IN ('ADMIN-DIV', 'FIN-DIV') AND child.parent_id IS NULL;

UPDATE hr_reference_values child
JOIN hr_reference_values parent
  ON parent.category = 'divisions' AND parent.code = 'MED-DIV'
SET child.parent_id = parent.id
WHERE child.category = 'sections' AND child.code IN ('ER', 'OPD') AND child.parent_id IS NULL;

UPDATE hr_reference_values child
JOIN hr_reference_values parent
  ON parent.category = 'divisions' AND parent.code = 'NURS-DIV'
SET child.parent_id = parent.id
WHERE child.category = 'sections' AND child.code = 'WARD' AND child.parent_id IS NULL;

UPDATE hr_reference_values child
JOIN hr_reference_values parent
  ON parent.category = 'divisions' AND parent.code = 'ANC-DIV'
SET child.parent_id = parent.id
WHERE child.category = 'sections' AND child.code IN ('PHARM', 'LAB', 'RAD') AND child.parent_id IS NULL;

UPDATE hr_reference_values child
JOIN hr_reference_values parent
  ON parent.category = 'divisions' AND parent.code = 'ADMIN-DIV'
SET child.parent_id = parent.id
WHERE child.category = 'sections' AND child.code IN ('HR', 'RECORDS', 'SUPPLY') AND child.parent_id IS NULL;

UPDATE hr_reference_values child
JOIN hr_reference_values parent
  ON parent.category = 'divisions' AND parent.code = 'FIN-DIV'
SET child.parent_id = parent.id
WHERE child.category = 'sections' AND child.code IN ('BUDGET', 'ACCOUNTING', 'CASH') AND child.parent_id IS NULL;

UPDATE hr_reference_values child
JOIN hr_reference_values parent
  ON parent.category = 'divisions' AND parent.code = 'SUP-DIV'
SET child.parent_id = parent.id
WHERE child.category = 'sections' AND child.code = 'GSS' AND child.parent_id IS NULL;
