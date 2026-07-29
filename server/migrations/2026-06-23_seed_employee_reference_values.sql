-- Seed starter Employee References for LGU Boac HRIS initial setup.
-- These are editable defaults; refine them with official LGU Boac approved values.

INSERT INTO hr_reference_values (category, code, name, description, sort_order)
VALUES
  ('sectors', 'EXEC_ADMIN', 'Executive and Administrative Governance', 'Office of the mayor, municipal administration, HR, records, ICT, and general services.', 1),
  ('sectors', 'LEGISLATIVE', 'Legislative Services', 'Office of the vice mayor, Sangguniang Bayan, and legislative support services.', 2),
  ('sectors', 'FINANCE', 'Finance and Revenue Services', 'Budget, accounting, treasury, assessment, and revenue administration.', 3),
  ('sectors', 'PLANNING_DEV', 'Planning and Development Services', 'Planning, development coordination, engineering, infrastructure, zoning, and public works.', 4),
  ('sectors', 'SOCIAL_HEALTH', 'Social, Health, and Community Services', 'Municipal health, nutrition, social welfare, civil registration, and community programs.', 5),
  ('sectors', 'ECONOMIC_PUBLIC', 'Economic, Agriculture, and Public Safety Services', 'Agriculture, market, licensing, traffic, disaster risk reduction, waterworks, and public order support.', 6),
  ('sectors', 'ATTACHED_AGENCIES', 'Attached and National Agency Offices', 'National or attached agency offices included in the local HR reference list.', 7),
  ('offices', 'OFFICE_OF_THE_MAYOR', 'Office of the Mayor', 'Chief executive office of the municipal government.', 1),
  ('offices', 'OFFICE_OF_THE_VICE_MAYOR', 'Office of the Vice Mayor', 'Office of the presiding officer of the Sangguniang Bayan.', 2),
  ('offices', 'SB_LEGISLATIVE_OFFICE', 'SB Legislative Office', 'Legislative office and support for municipal council functions.', 3),
  ('offices', 'MUNICIPAL_ADMINISTRATOR_S_OFFICE', 'Municipal Administrator''s Office', 'Municipal administration, coordination, and executive support.', 4),
  ('offices', 'MUNICIPAL_ACCOUNTING_OFFICE', 'Municipal Accounting Office', 'Accounting and financial reporting office.', 5),
  ('offices', 'MUNICIPAL_TREASURER_OFFICE', 'Municipal Treasurer Office', 'Treasury, collections, and revenue administration.', 6),
  ('offices', 'MUNICIPAL_ASSESSOR_OFFICE', 'Municipal Assessor Office', 'Real property assessment and related services.', 7),
  ('offices', 'MUNICIPAL_PLANNING_AND_DEVELOPMENT_OFFICE', 'Municipal Planning and Development Office', 'Planning, development coordination, and project monitoring.', 8),
  ('offices', 'MUNICIPAL_ENGINEERING_OFFICE', 'Municipal Engineering Office', 'Engineering, infrastructure, facilities, roads, and related works.', 9),
  ('offices', 'MUNICIPAL_HEALTH_OFFICE', 'Municipal Health Office', 'Local public health services and community health programs.', 10),
  ('offices', 'MUNICIPAL_SOCIAL_WELFARE_AND_DEVELOPMENT_OFFICE', 'Municipal Social Welfare and Development Office', 'Social welfare and development programs.', 11),
  ('offices', 'MUNICIPAL_CIVIL_REGISTRAR_S_OFFICE', 'Municipal Civil Registrar''s Office', 'Civil registration services.', 12),
  ('offices', 'MUNICIPAL_AGRICULTURE_OFFICE', 'Municipal Agriculture Office', 'Agriculture, fisheries, and livelihood support services.', 13),
  ('offices', 'MUNICIPAL_DISASTER_RISK_REDUCTION_AND_MANAGEMENT_OFFICE', 'Municipal Disaster Risk Reduction and Management Office', 'Disaster risk reduction, preparedness, response, and resilience programs.', 14),
  ('divisions', 'EXEC_ADMIN_DIV', 'Executive and Administrative Division', NULL, 1),
  ('divisions', 'FINANCE_DIV', 'Finance and Revenue Division', NULL, 2),
  ('divisions', 'COMMUNITY_SERVICES_DIV', 'Community Services Division', NULL, 3),
  ('divisions', 'ENGINEERING_WORKS_DIV', 'Engineering and Public Works Division', NULL, 4),
  ('sections', 'HRMO', 'Human Resource Management Section', NULL, 1),
  ('sections', 'RECORDS', 'Records and Archives Section', NULL, 2),
  ('sections', 'ICT', 'Information and Communications Technology Section', NULL, 3),
  ('sections', 'SUPPLY', 'Supply and Property Section', NULL, 4),
  ('sections', 'BUDGET', 'Budget Section', NULL, 5),
  ('sections', 'ACCOUNTING', 'Accounting Section', NULL, 6),
  ('sections', 'CASH', 'Cash and Collection Section', NULL, 7),
  ('sections', 'SOCIAL_WELFARE', 'Social Welfare Services Section', NULL, 8),
  ('sections', 'NUTRITION', 'Nutrition Services Section', NULL, 9),
  ('sections', 'ROADS_BRIDGES', 'Roads and Bridges Section', NULL, 10),
  ('sections', 'SOLID_WASTE', 'Solid Waste and General Services Section', NULL, 11),
  ('eligibilities', 'CSP', 'Career Service Professional', 'Civil Service Professional eligibility.', 1),
  ('eligibilities', 'CSSP', 'Career Service Subprofessional', 'Civil Service Subprofessional eligibility.', 2),
  ('eligibilities', 'RA1080', 'RA 1080 / Board or Bar Eligibility', 'Professional license eligibility under Republic Act No. 1080.', 3),
  ('eligibilities', 'BAR', 'Bar Eligibility', 'Eligibility based on passing the Philippine Bar examination.', 4),
  ('eligibilities', 'BOARD', 'Board / PRC License', 'Eligibility based on a valid professional board or PRC license.', 5),
  ('eligibilities', 'NONE', 'No Eligibility Recorded', 'Temporary value when no eligibility has been encoded yet.', 99),
  ('employment-statuses', 'PERM', 'Permanent', 'Permanent appointment/status.', 1),
  ('employment-statuses', 'TEMP', 'Temporary', 'Temporary appointment/status.', 2),
  ('employment-statuses', 'COTER', 'Coterminous', 'Coterminous appointment/status.', 3),
  ('employment-statuses', 'COTERM', 'Co-term', 'Co-terminous employment status.', 4),
  ('employment-statuses', 'ELECTIVE', 'Elective', 'Elective official or elective appointment status.', 5),
  ('employment-statuses', 'CASUAL', 'Casual', 'Casual employment status.', 6),
  ('employment-statuses', 'CONTRACT', 'Contractual', 'Contractual employment status.', 7),
  ('employment-statuses', 'JO', 'Job Order', 'Job order engagement.', 8),
  ('employment-statuses', 'COS', 'Contract of Service', 'Contract of service engagement.', 9),
  ('job-levels', 'EXEC', 'Executive', 'Executive or head-of-office level.', 1),
  ('job-levels', 'DIVCHIEF', 'Division Chief', 'Division chief or equivalent management level.', 2),
  ('job-levels', 'SUP', 'Supervisory', 'Supervisory personnel.', 3),
  ('job-levels', 'TECH', 'Technical / Professional', 'Licensed, technical, or professional personnel.', 4),
  ('job-levels', 'ADMIN', 'Administrative', 'Administrative and clerical personnel.', 5),
  ('job-levels', 'SUPPORT', 'Support Staff', 'Operational and support staff.', 6),
  ('plantilla-types', 'PLANTILLA', 'Plantilla', 'Regular approved plantilla item.', 1),
  ('plantilla-types', 'ELECTIVE', 'Elective', 'Elective plantilla item.', 2),
  ('plantilla-types', 'COTER', 'Coterminous', 'Coterminous plantilla item.', 3),
  ('plantilla-types', 'NON-PLANTILLA', 'Non-Plantilla', 'Position or engagement not tied to a plantilla item.', 4),
  ('plantilla-types', 'CASUAL', 'Casual', 'Casual item or engagement.', 5),
  ('plantilla-types', 'JO', 'Job Order', 'Job order classification.', 6),
  ('plantilla-types', 'COS', 'Contract of Service', 'Contract of service classification.', 7),
  ('budget-codes', 'PS', 'Personnel Services', 'Personnel Services funding source or allotment.', 1),
  ('budget-codes', 'MOOE', 'Maintenance and Other Operating Expenses', 'MOOE funding source or allotment.', 2),
  ('budget-codes', 'TRUST', 'Trust Fund', 'Trust fund source.', 3),
  ('budget-codes', 'GENERAL-FUND', 'General Fund', 'Municipal general fund source.', 4),
  ('budget-codes', 'SEF', 'Special Education Fund', 'Special Education Fund source, when applicable.', 5)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  is_active = 1,
  sort_order = VALUES(sort_order);

UPDATE hr_reference_values child
JOIN hr_reference_values parent ON parent.category = 'sectors' AND parent.code = 'EXEC_ADMIN'
SET child.parent_id = parent.id
WHERE child.category = 'offices'
  AND child.code IN ('OFFICE_OF_THE_MAYOR', 'MUNICIPAL_ADMINISTRATOR_S_OFFICE')
;

UPDATE hr_reference_values child
JOIN hr_reference_values parent ON parent.category = 'sectors' AND parent.code = 'LEGISLATIVE'
SET child.parent_id = parent.id
WHERE child.category = 'offices'
  AND child.code IN ('OFFICE_OF_THE_VICE_MAYOR', 'SB_LEGISLATIVE_OFFICE')
;

UPDATE hr_reference_values child
JOIN hr_reference_values parent ON parent.category = 'sectors' AND parent.code = 'FINANCE'
SET child.parent_id = parent.id
WHERE child.category = 'offices'
  AND child.code IN ('MUNICIPAL_ACCOUNTING_OFFICE', 'MUNICIPAL_TREASURER_OFFICE', 'MUNICIPAL_ASSESSOR_OFFICE')
;

UPDATE hr_reference_values child
JOIN hr_reference_values parent ON parent.category = 'sectors' AND parent.code = 'PLANNING_DEV'
SET child.parent_id = parent.id
WHERE child.category = 'offices'
  AND child.code IN ('MUNICIPAL_PLANNING_AND_DEVELOPMENT_OFFICE', 'MUNICIPAL_ENGINEERING_OFFICE')
;

UPDATE hr_reference_values child
JOIN hr_reference_values parent ON parent.category = 'sectors' AND parent.code = 'SOCIAL_HEALTH'
SET child.parent_id = parent.id
WHERE child.category = 'offices'
  AND child.code IN ('MUNICIPAL_HEALTH_OFFICE', 'MUNICIPAL_SOCIAL_WELFARE_AND_DEVELOPMENT_OFFICE', 'MUNICIPAL_CIVIL_REGISTRAR_S_OFFICE')
;

UPDATE hr_reference_values child
JOIN hr_reference_values parent ON parent.category = 'sectors' AND parent.code = 'ECONOMIC_PUBLIC'
SET child.parent_id = parent.id
WHERE child.category = 'offices'
  AND child.code IN ('MUNICIPAL_AGRICULTURE_OFFICE', 'MUNICIPAL_DISASTER_RISK_REDUCTION_AND_MANAGEMENT_OFFICE')
;

UPDATE hr_reference_values child
JOIN hr_reference_values parent ON parent.category = 'sectors' AND parent.code = 'EXEC_ADMIN'
SET child.parent_id = parent.id
WHERE child.category = 'offices'
  AND child.code IN ('CAO', 'MO_HUMAN_RESOURCE_AND_MANAGEMENT_SECTION', 'MO_INFORMATION_AND_COMMUNICATIONS_TECHNOLOGY_SECTOR', 'MO_MUNICIPAL_INFORMATION_AND_LIBRARY_SERVICES_SECTION', 'MUNICIPAL_ADMINISTRATOR_S_OFFICE', 'OFFICE_OF_THE_MAYOR');

UPDATE hr_reference_values child
JOIN hr_reference_values parent ON parent.category = 'sectors' AND parent.code = 'LEGISLATIVE'
SET child.parent_id = parent.id
WHERE child.category = 'offices'
  AND child.code IN ('OFFICE_OF_THE_VICE_MAYOR', 'SB_LEGISLATIVE_CAPITOL', 'SB_LEGISLATIVE_OFFICE', 'SB_LEGISLATIVE_OFFICE_LIGA', 'SB_SECRETARIAT_OFFICE');

UPDATE hr_reference_values child
JOIN hr_reference_values parent ON parent.category = 'sectors' AND parent.code = 'FINANCE'
SET child.parent_id = parent.id
WHERE child.category = 'offices'
  AND child.code IN ('BUDGET_OFFICE', 'MUNICIPAL_ACCOUNTING_OFFICE', 'MUNICIPAL_ASSESSOR_OFFICE', 'MUNICIPAL_TREASURER_OFFICE');

UPDATE hr_reference_values child
JOIN hr_reference_values parent ON parent.category = 'sectors' AND parent.code = 'PLANNING_DEV'
SET child.parent_id = parent.id
WHERE child.category = 'offices'
  AND child.code IN ('MEO_PLAZA_PARKS_AND_MONUMENT_SECTION', 'MEO_GARBAGE_COLLECTION_SERVICES', 'MEO_MAINT_OF_ROADS_AND_BRIDGES', 'MEO_STREET_CLEANING_SERVICES', 'MEO_STREET_LIGHTING_SERVICES', 'MUNICIPAL_ENGINEERING_OFFICE', 'MUNICIPAL_PLANNING_AND_DEVELOPMENT_OFFICE', 'OPERATION_OF_WATERWORK_SYSTEM');

UPDATE hr_reference_values child
JOIN hr_reference_values parent ON parent.category = 'sectors' AND parent.code = 'SOCIAL_HEALTH'
SET child.parent_id = parent.id
WHERE child.category = 'offices'
  AND child.code IN ('MO_NUTRITION_CENTER', 'MO_SPORTS_AND_GAMES_SECTION', 'MUNICIPAL_CIVIL_REGISTRAR_S_OFFICE', 'MUNICIPAL_HEALTH_OFFICE', 'MUNICIPAL_HEALTH_OFFICE_RHU_II', 'MUNICIPAL_NUTRITION_OFFICE', 'MUNICIPAL_SOCIAL_WELFARE_AND_DEVELOPMENT_OFFICE');

UPDATE hr_reference_values child
JOIN hr_reference_values parent ON parent.category = 'sectors' AND parent.code = 'ECONOMIC_PUBLIC'
SET child.parent_id = parent.id
WHERE child.category = 'offices'
  AND child.code IN ('MO_BUSINESS_PRINTING_AND_LICENSING_SECTION', 'MPOC_TRAFFIC_AIDE', 'MUNICIPAL_AGRICULTURE_OFFICE', 'MUNICIPAL_DISASTER_RISK_REDUCTION_AND_MANAGEMENT_OFFICE', 'OPERATIONS_OF_MARKET', 'SLAUGHTERHOUSE');

UPDATE hr_reference_values child
JOIN hr_reference_values parent ON parent.category = 'sectors' AND parent.code = 'ATTACHED_AGENCIES'
SET child.parent_id = parent.id
WHERE child.category = 'offices'
  AND child.code IN ('COMMISSION_ON_ELECTIONS', 'DEPARTMENT_OF_THE_INTERIOR_AND_LOCAL_GOVERNMENT', 'PNP');

UPDATE plantilla_items pi
JOIN hr_reference_values office_ref ON office_ref.id = pi.office_ref_id
SET pi.sector_ref_id = office_ref.parent_id
WHERE pi.office_ref_id IS NOT NULL
  AND office_ref.parent_id IS NOT NULL;

UPDATE plantilla_items pi
LEFT JOIN hr_reference_values sector_ref ON sector_ref.id = pi.sector_ref_id
SET pi.sector_ref_id = NULL
WHERE pi.office_ref_id IS NULL
  AND sector_ref.category = 'sectors'
  AND sector_ref.code = 'MUNICIPAL';

UPDATE hr_reference_values
SET is_active = 0
WHERE category = 'sectors'
  AND code = 'MUNICIPAL';

UPDATE hr_reference_values child
JOIN hr_reference_values parent ON parent.category = 'offices' AND parent.code = 'OFFICE_OF_THE_MAYOR'
SET child.parent_id = parent.id
WHERE child.category = 'divisions' AND child.code = 'EXEC_ADMIN_DIV';

UPDATE hr_reference_values child
JOIN hr_reference_values parent ON parent.category = 'offices' AND parent.code = 'MUNICIPAL_ACCOUNTING_OFFICE'
SET child.parent_id = parent.id
WHERE child.category = 'divisions' AND child.code = 'FINANCE_DIV';

UPDATE hr_reference_values child
JOIN hr_reference_values parent ON parent.category = 'offices' AND parent.code = 'MUNICIPAL_SOCIAL_WELFARE_AND_DEVELOPMENT_OFFICE'
SET child.parent_id = parent.id
WHERE child.category = 'divisions' AND child.code = 'COMMUNITY_SERVICES_DIV';

UPDATE hr_reference_values child
JOIN hr_reference_values parent ON parent.category = 'offices' AND parent.code = 'MUNICIPAL_ENGINEERING_OFFICE'
SET child.parent_id = parent.id
WHERE child.category = 'divisions' AND child.code = 'ENGINEERING_WORKS_DIV';

UPDATE hr_reference_values child
JOIN hr_reference_values parent ON parent.category = 'divisions' AND parent.code = 'EXEC_ADMIN_DIV'
SET child.parent_id = parent.id
WHERE child.category = 'sections' AND child.code IN ('HRMO', 'RECORDS', 'ICT', 'SUPPLY');

UPDATE hr_reference_values child
JOIN hr_reference_values parent ON parent.category = 'divisions' AND parent.code = 'FINANCE_DIV'
SET child.parent_id = parent.id
WHERE child.category = 'sections' AND child.code IN ('BUDGET', 'ACCOUNTING', 'CASH');

UPDATE hr_reference_values child
JOIN hr_reference_values parent ON parent.category = 'divisions' AND parent.code = 'COMMUNITY_SERVICES_DIV'
SET child.parent_id = parent.id
WHERE child.category = 'sections' AND child.code IN ('SOCIAL_WELFARE', 'NUTRITION');

UPDATE hr_reference_values child
JOIN hr_reference_values parent ON parent.category = 'divisions' AND parent.code = 'ENGINEERING_WORKS_DIV'
SET child.parent_id = parent.id
WHERE child.category = 'sections' AND child.code IN ('ROADS_BRIDGES', 'SOLID_WASTE');
