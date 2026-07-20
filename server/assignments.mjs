import crypto from "node:crypto";

const day = (value) => (value ? new Date(value).toISOString().slice(0, 10) : null);
const today = () => new Date().toISOString().slice(0, 10);

function strictDate(value, label, required = false) {
  if (value === null || value === undefined || String(value).trim() === "") {
    if (required) throw new Error(`${label} is required`);
    return null;
  }
  const text = String(value).trim();
  const parsed = new Date(`${text}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(parsed.getTime()) || day(parsed) !== text) {
    throw new Error(`${label} must be a valid YYYY-MM-DD date`);
  }
  return text;
}

function money(value, label) {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) throw new Error(`${label} must be non-negative`);
  return amount;
}

async function ensureColumn(pool, table, column, definition) {
  const [rows] = await pool.execute(
    `SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = :table AND column_name = :column LIMIT 1`,
    { table, column },
  );
  if (!rows.length)
    await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
}

async function ensureIndex(pool, table, index, columns) {
  const [rows] = await pool.execute(
    `SELECT 1 FROM information_schema.statistics
      WHERE table_schema=DATABASE() AND table_name=:table AND index_name=:index LIMIT 1`,
    { table, index },
  );
  if (!rows.length)
    await pool.query(`ALTER TABLE \`${table}\` ADD INDEX \`${index}\` (${columns})`);
}

export async function initializeAssignmentSchema(pool, employeeIdDefinition) {
  await ensureColumn(
    pool,
    "employees",
    "lifecycle_state",
    "VARCHAR(30) NOT NULL DEFAULT 'Active' AFTER emp_status",
  );
  await ensureColumn(
    pool,
    "employees",
    "current_org_unit_ref_id",
    "INT UNSIGNED NULL AFTER lifecycle_state",
  );
  await ensureIndex(
    pool,
    "employees",
    "idx_employee_assignment_reporting",
    "current_org_unit_ref_id,lifecycle_state",
  );

  await pool.query(`CREATE TABLE IF NOT EXISTS non_plantilla_engagements (
    id CHAR(36) NOT NULL PRIMARY KEY,
    employee_id ${employeeIdDefinition},
    engagement_type ENUM('JO','COS','Casual','Contractual','Other') NOT NULL,
    org_unit_ref_id INT UNSIGNED NOT NULL,
    designation VARCHAR(200) NOT NULL,
    contract_number VARCHAR(160) NULL,
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    rate DECIMAL(12,2) NULL,
    funding_source VARCHAR(200) NULL,
    supervisor VARCHAR(200) NULL,
    remarks TEXT NULL,
    status ENUM('Scheduled','Active','Expired','Terminated','Renewed') NOT NULL,
    previous_engagement_id CHAR(36) NULL,
    created_by INT UNSIGNED NULL,
    ended_by INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ended_at DATETIME NULL,
    active_employee_id ${employeeIdDefinition.replace(/\s+NOT NULL$/i, "")} GENERATED ALWAYS AS
      (CASE WHEN status='Active' THEN employee_id ELSE NULL END) STORED,
    UNIQUE KEY uniq_active_non_plantilla_employee (active_employee_id),
    INDEX idx_engagement_employee_dates (employee_id,date_from,date_to),
    INDEX idx_engagement_status_end (status,date_to),
    INDEX idx_engagement_org_status (org_unit_ref_id,status),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
    FOREIGN KEY (org_unit_ref_id) REFERENCES hr_reference_values(id) ON DELETE RESTRICT,
    FOREIGN KEY (previous_engagement_id) REFERENCES non_plantilla_engagements(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (ended_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB`);

  await pool.query(`CREATE TABLE IF NOT EXISTS temporary_assignments (
    id CHAR(36) NOT NULL PRIMARY KEY,
    employee_id ${employeeIdDefinition},
    movement_id CHAR(36) NOT NULL,
    assignment_type ENUM('Detail','Designation','Reassignment','Job Rotation') NOT NULL,
    org_unit_ref_id INT UNSIGNED NULL,
    position_id INT UNSIGNED NULL,
    assignment_label VARCHAR(200) NULL,
    date_from DATE NOT NULL,
    date_to DATE NULL,
    status ENUM('Scheduled','Active','Ended','Reversed') NOT NULL,
    created_by INT UNSIGNED NULL,
    ended_by INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME NULL,
    INDEX idx_temporary_employee_dates (employee_id,date_from,date_to),
    INDEX idx_temporary_status_dates (status,date_from,date_to),
    UNIQUE KEY uniq_temporary_movement (movement_id),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
    FOREIGN KEY (movement_id) REFERENCES personnel_movements(id) ON DELETE RESTRICT,
    FOREIGN KEY (org_unit_ref_id) REFERENCES hr_reference_values(id) ON DELETE RESTRICT,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (ended_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB`);

  await pool.query(`CREATE TABLE IF NOT EXISTS plantilla_reconciliations (
    id CHAR(36) NOT NULL PRIMARY KEY,
    employee_id ${employeeIdDefinition},
    plantilla_item_id CHAR(36) NOT NULL,
    occupancy_id CHAR(36) NOT NULL,
    effective_from DATE NOT NULL,
    remarks TEXT NOT NULL,
    classification_before VARCHAR(50) NOT NULL,
    before_snapshot_json JSON NOT NULL,
    after_snapshot_json JSON NOT NULL,
    confirmed_by INT UNSIGNED NULL,
    confirmed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_reconciled_employee (employee_id),
    UNIQUE KEY uniq_reconciled_occupancy (occupancy_id),
    INDEX idx_reconciliation_item (plantilla_item_id,confirmed_at),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
    FOREIGN KEY (plantilla_item_id) REFERENCES plantilla_items(id) ON DELETE RESTRICT,
    FOREIGN KEY (occupancy_id) REFERENCES plantilla_occupancies(id) ON DELETE RESTRICT,
    FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB`);
}

const orgNameSql = "COALESCE(sec.name,divi.name,off.name,s.name)";
const orgIdSql = "COALESCE(pi.section_ref_id,pi.division_ref_id,pi.office_ref_id,pi.sector_ref_id)";

export async function readCurrentAssignment(pool, employeeId) {
  const [[plantilla]] = await pool.execute(
    `SELECT po.id,po.date_from,po.movement_type,po.appointment_number,
            pi.id plantilla_item_id,pi.item_number,pi.authorized_salary,
            p.title position_title,sg.ordinance,sg.grade,sg.step,
            ${orgIdSql} org_unit_ref_id,${orgNameSql} organization_name,
            s.name sector_name,off.name office_name,divi.name division_name,sec.name section_name
       FROM plantilla_occupancies po
       JOIN plantilla_items pi ON pi.id=po.plantilla_item_id
       JOIN positions p ON p.id=pi.position_id
       LEFT JOIN salary_grades sg ON sg.id=pi.salary_grade_id
       LEFT JOIN hr_reference_values s ON s.id=pi.sector_ref_id
       LEFT JOIN hr_reference_values off ON off.id=pi.office_ref_id
       LEFT JOIN hr_reference_values divi ON divi.id=pi.division_ref_id
       LEFT JOIN hr_reference_values sec ON sec.id=pi.section_ref_id
      WHERE po.employee_id=:employeeId AND po.status='Active' LIMIT 1`,
    { employeeId },
  );
  const [[engagement]] = await pool.execute(
    `SELECT ne.*,ou.name organization_name
       FROM non_plantilla_engagements ne
       JOIN hr_reference_values ou ON ou.id=ne.org_unit_ref_id
      WHERE ne.employee_id=:employeeId AND ne.status='Active' LIMIT 1`,
    { employeeId },
  );
  const [[temporary]] = await pool.execute(
    `SELECT ta.*,ou.name organization_name,p.title position_title
       FROM temporary_assignments ta
       LEFT JOIN hr_reference_values ou ON ou.id=ta.org_unit_ref_id
       LEFT JOIN positions p ON p.id=ta.position_id
      WHERE ta.employee_id=:employeeId AND ta.status='Active'
      ORDER BY ta.date_from DESC,ta.created_at DESC LIMIT 1`,
    { employeeId },
  );
  const substantive = plantilla
    ? {
        kind: "Plantilla",
        id: plantilla.id,
        plantillaItemId: plantilla.plantilla_item_id,
        itemNumber: plantilla.item_number,
        position: plantilla.position_title,
        organizationId: plantilla.org_unit_ref_id ? Number(plantilla.org_unit_ref_id) : null,
        organization: plantilla.organization_name || "",
        organizationPath: [
          plantilla.sector_name,
          plantilla.office_name,
          plantilla.division_name,
          plantilla.section_name,
        ].filter(Boolean),
        salaryGrade: plantilla.grade
          ? {
              ordinance: plantilla.ordinance || "",
              grade: Number(plantilla.grade),
              step: Number(plantilla.step),
              amount: Number(plantilla.authorized_salary || 0),
            }
          : null,
        dateFrom: day(plantilla.date_from),
        appointmentType: plantilla.movement_type || "",
        authorityNumber: plantilla.appointment_number || "",
      }
    : engagement
      ? {
          kind: "Non-Plantilla",
          id: engagement.id,
          engagementType: engagement.engagement_type,
          position: engagement.designation,
          organizationId: Number(engagement.org_unit_ref_id),
          organization: engagement.organization_name,
          organizationPath: [engagement.organization_name],
          dateFrom: day(engagement.date_from),
          dateTo: day(engagement.date_to),
          authorityNumber: engagement.contract_number || "",
          rate: engagement.rate === null ? null : Number(engagement.rate),
          fundingSource: engagement.funding_source || "",
        }
      : null;
  return {
    substantive,
    temporary: temporary
      ? {
          id: temporary.id,
          type: temporary.assignment_type,
          position: temporary.position_title || temporary.assignment_label || "",
          organizationId: temporary.org_unit_ref_id ? Number(temporary.org_unit_ref_id) : null,
          organization: temporary.organization_name || "",
          dateFrom: day(temporary.date_from),
          dateTo: day(temporary.date_to),
        }
      : null,
  };
}

async function refreshEngagementStates(pool) {
  const current = today();
  const [expired] = await pool.execute(
    `SELECT id,employee_id FROM non_plantilla_engagements
      WHERE status='Active' AND date_to<:current
      ORDER BY date_to,id`,
    { current },
  );
  for (const row of expired) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [[engagement]] = await connection.execute(
        "SELECT id FROM non_plantilla_engagements WHERE id=:id AND status='Active' FOR UPDATE",
        { id: row.id },
      );
      if (!engagement) {
        await connection.rollback();
        continue;
      }
      await connection.execute(
        "UPDATE non_plantilla_engagements SET status='Expired',ended_at=COALESCE(ended_at,NOW()) WHERE id=:id",
        { id: row.id },
      );
      const [[otherAssignment]] = await connection.execute(
        `SELECT
          EXISTS(SELECT 1 FROM plantilla_occupancies WHERE employee_id=:employeeId AND status='Active') AS hasPlantilla,
          EXISTS(SELECT 1 FROM non_plantilla_engagements WHERE employee_id=:employeeId AND status='Active') AS hasEngagement`,
        { employeeId: row.employee_id },
      );
      if (!otherAssignment.hasPlantilla && !otherAssignment.hasEngagement) {
        await connection.execute(
          "UPDATE employees SET emp_status='Inactive',lifecycle_state='Inactive',current_org_unit_ref_id=NULL WHERE id=:employeeId",
          { employeeId: row.employee_id },
        );
        await connection.execute("UPDATE users SET is_active=0 WHERE employee_id=:employeeId", {
          employeeId: row.employee_id,
        });
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback().catch(() => {});
      console.error(`Unable to expire engagement ${row.id}`, error.message);
    } finally {
      connection.release();
    }
  }
  await pool.execute(
    `UPDATE temporary_assignments SET status='Ended',ended_at=COALESCE(ended_at,NOW())
      WHERE status='Active' AND date_to<:current`,
    { current },
  );
  const [due] = await pool.execute(
    `SELECT id,employee_id,org_unit_ref_id,designation
       FROM non_plantilla_engagements
      WHERE status='Scheduled' AND date_from<=:current AND date_to>=:current
      ORDER BY date_from,id`,
    { current },
  );
  for (const row of due) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute("SELECT id FROM employees WHERE id=:employeeId FOR UPDATE", {
        employeeId: row.employee_id,
      });
      const [[active]] = await connection.execute(
        `SELECT
          (SELECT id FROM non_plantilla_engagements WHERE employee_id=:employeeId AND status='Active' LIMIT 1) AS engagementId,
          (SELECT id FROM plantilla_occupancies WHERE employee_id=:employeeId AND status='Active' LIMIT 1) AS occupancyId`,
        { employeeId: row.employee_id },
      );
      if (active?.engagementId || active?.occupancyId)
        throw new Error("Employee already has an active assignment");
      await connection.execute(
        "UPDATE non_plantilla_engagements SET status='Active' WHERE id=:id",
        {
          id: row.id,
        },
      );
      const [[org]] = await connection.execute(
        "SELECT name FROM hr_reference_values WHERE id=:id",
        { id: row.org_unit_ref_id },
      );
      await connection.execute(
        `UPDATE employees SET department=:department,position=:position,emp_status='Active',
          lifecycle_state='Active',current_org_unit_ref_id=:orgId WHERE id=:employeeId`,
        {
          employeeId: row.employee_id,
          department: org?.name || "",
          position: row.designation,
          orgId: row.org_unit_ref_id,
        },
      );
      await connection.execute("UPDATE users SET is_active=1 WHERE employee_id=:employeeId", {
        employeeId: row.employee_id,
      });
      await connection.commit();
    } catch (error) {
      await connection.rollback().catch(() => {});
      console.error(`Unable to activate engagement ${row.id}`, error.message);
    } finally {
      connection.release();
    }
  }
  return { expired: expired.length, activated: due.length };
}

const mapEngagement = (row) => ({
  id: row.id,
  employeeId: row.employee_id,
  employeeNo: row.employee_no || "",
  employeeName: row.employee_name || "",
  engagementType: row.engagement_type,
  organizationId: Number(row.org_unit_ref_id),
  organization: row.organization_name || "",
  designation: row.designation,
  contractNumber: row.contract_number || "",
  dateFrom: day(row.date_from),
  dateTo: day(row.date_to),
  rate: row.rate === null ? null : Number(row.rate),
  fundingSource: row.funding_source || "",
  supervisor: row.supervisor || "",
  remarks: row.remarks || "",
  status: row.status,
  previousEngagementId: row.previous_engagement_id || null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export function createAssignmentHandlers({
  pool,
  requireRead,
  requireReconciliation,
  requireEngagement,
  readBody,
  json,
  logAudit,
}) {
  const fail = (res, error) => {
    if (error?.code === "ER_DUP_ENTRY")
      return json(res, 409, {
        error: "The employee or assignment already has an active conflicting record",
      });
    if (error instanceof Error && !error.code) return json(res, 400, { error: error.message });
    throw error;
  };

  const readEngagement = async (id, connection = pool) => {
    const [[row]] = await connection.execute(
      `SELECT ne.*,ou.name organization_name,e.employee_no,
        TRIM(CONCAT_WS(' ',e.firstname,e.middlename,e.lastname,e.name_ext)) employee_name
       FROM non_plantilla_engagements ne
       JOIN employees e ON e.id=ne.employee_id
       JOIN hr_reference_values ou ON ou.id=ne.org_unit_ref_id
       WHERE ne.id=:id LIMIT 1`,
      { id },
    );
    return row ? mapEngagement(row) : null;
  };

  const engagementPayload = async (body, connection = pool) => {
    const employeeId = String(body.employeeId || "").trim();
    const engagementType = String(body.engagementType || "").trim();
    const allowed = new Set(["JO", "COS", "Casual", "Contractual", "Other"]);
    if (!employeeId) throw new Error("Employee is required");
    if (!allowed.has(engagementType)) throw new Error("Select a valid engagement type");
    const organizationId = Number(body.organizationId);
    if (!Number.isInteger(organizationId) || organizationId < 1)
      throw new Error("Organization is required");
    const [[organization]] = await connection.execute(
      `SELECT id,name,category,is_active FROM hr_reference_values
        WHERE id=:organizationId AND category IN ('sectors','offices','divisions','sections')`,
      { organizationId },
    );
    if (!organization || !organization.is_active) throw new Error("Select an active organization");
    const designation = String(body.designation || "").trim();
    if (!designation) throw new Error("Designation is required");
    const dateFrom = strictDate(body.dateFrom, "Start date", true);
    const dateTo = strictDate(body.dateTo, "End date", true);
    if (dateTo < dateFrom) throw new Error("End date cannot be earlier than start date");
    return {
      employeeId,
      engagementType,
      organizationId,
      organizationName: organization.name,
      designation,
      contractNumber:
        String(body.contractNumber || "")
          .trim()
          .slice(0, 160) || null,
      dateFrom,
      dateTo,
      rate: money(body.rate, "Rate"),
      fundingSource:
        String(body.fundingSource || "")
          .trim()
          .slice(0, 200) || null,
      supervisor:
        String(body.supervisor || "")
          .trim()
          .slice(0, 200) || null,
      remarks: String(body.remarks || "").trim() || null,
      status: dateFrom > today() ? "Scheduled" : dateTo < today() ? "Expired" : "Active",
    };
  };

  const handlers = {};

  handlers.summary = async (req, res) => {
    if (!(await requireRead(req, res))) return;
    await refreshEngagementStates(pool);
    const [[row]] = await pool.query(`SELECT
      (SELECT COUNT(*) FROM employees e LEFT JOIN plantilla_occupancies po ON po.employee_id=e.id AND po.status='Active'
        LEFT JOIN non_plantilla_engagements ne ON ne.employee_id=e.id AND ne.status='Active'
        WHERE e.is_hidden=0 AND po.id IS NULL AND ne.id IS NULL) awaiting_assignment,
      (SELECT COUNT(*) FROM personnel_movements WHERE status='Scheduled') scheduled_movements,
      (SELECT COUNT(*) FROM non_plantilla_engagements WHERE status='Active' AND date_to BETWEEN CURDATE() AND DATE_ADD(CURDATE(),INTERVAL 30 DAY)) expiring_engagements,
      (SELECT COUNT(*) FROM employees e LEFT JOIN hr_reference_values ou ON BINARY ou.name=BINARY TRIM(e.department)
        WHERE e.is_hidden=0 AND NULLIF(TRIM(e.department),'') IS NOT NULL AND ou.id IS NULL) unmapped_organizations`);
    return json(res, 200, {
      awaitingAssignment: Number(row.awaiting_assignment || 0),
      scheduledMovements: Number(row.scheduled_movements || 0),
      expiringEngagements: Number(row.expiring_engagements || 0),
      unmappedOrganizations: Number(row.unmapped_organizations || 0),
    });
  };

  handlers.reconciliationList = async (req, res, url) => {
    if (!(await requireRead(req, res))) return;
    const q = String(url.searchParams.get("q") || "").trim();
    const classification = String(url.searchParams.get("classification") || "all");
    const params = { q: `%${q}%` };
    const [rows] = await pool.execute(
      `SELECT e.id,e.employee_no,e.firstname,e.middlename,e.lastname,e.name_ext,e.status,e.emp_status,
              e.item_no,e.position,e.department,po.id occupancy_id,po.plantilla_item_id active_item_id,
              pi.id matched_item_id,pi.item_number matched_item_number,p.title matched_position,
              ${orgNameSql} matched_organization,
              occupied.employee_id item_occupant_id,
              (SELECT COUNT(*) FROM employees de WHERE de.is_hidden=0 AND NULLIF(TRIM(de.item_no),'')=NULLIF(TRIM(e.item_no),'')) duplicate_count,
              (SELECT COUNT(*) FROM plantilla_items spi JOIN positions sp ON sp.id=spi.position_id
                LEFT JOIN plantilla_occupancies spo ON spo.plantilla_item_id=spi.id AND spo.status='Active'
                WHERE spi.item_status='Active' AND spo.id IS NULL AND BINARY sp.title=BINARY e.position) suggested_count,
              (SELECT MIN(spi.id) FROM plantilla_items spi JOIN positions sp ON sp.id=spi.position_id
                LEFT JOIN plantilla_occupancies spo ON spo.plantilla_item_id=spi.id AND spo.status='Active'
                WHERE spi.item_status='Active' AND spo.id IS NULL AND BINARY sp.title=BINARY e.position) suggested_item_id
       FROM employees e
       LEFT JOIN plantilla_occupancies po ON po.employee_id=e.id AND po.status='Active'
       LEFT JOIN plantilla_items pi ON BINARY pi.item_number=BINARY TRIM(e.item_no)
       LEFT JOIN positions p ON p.id=pi.position_id
       LEFT JOIN hr_reference_values s ON s.id=pi.sector_ref_id
       LEFT JOIN hr_reference_values off ON off.id=pi.office_ref_id
       LEFT JOIN hr_reference_values divi ON divi.id=pi.division_ref_id
       LEFT JOIN hr_reference_values sec ON sec.id=pi.section_ref_id
       LEFT JOIN plantilla_occupancies occupied ON occupied.plantilla_item_id=pi.id AND occupied.status='Active'
       WHERE e.is_hidden=0 AND (:q='%%' OR e.employee_no LIKE :q OR e.firstname LIKE :q OR e.lastname LIKE :q OR e.item_no LIKE :q)
       ORDER BY e.lastname,e.firstname,e.employee_no`,
      params,
    );
    const mapped = rows.map((row) => {
      let kind = "Exact match";
      if (/job order|jo\/cos|contract/i.test(row.status || "")) kind = "Non-Plantilla/JO/COS";
      else if (row.occupancy_id) kind = "Already linked";
      else if (!String(row.item_no || "").trim())
        kind = row.suggested_count === 1 ? "Suggested match" : "Missing item number";
      else if (Number(row.duplicate_count) > 1) kind = "Duplicate item number";
      else if (!row.matched_item_id)
        kind = row.suggested_count === 1 ? "Suggested match" : "Missing Plantilla item";
      else if (row.item_occupant_id && row.item_occupant_id !== row.id)
        kind = "Already occupied item";
      else if (String(row.position || "") !== String(row.matched_position || ""))
        kind = "Position conflict";
      else if (
        row.matched_organization &&
        String(row.department || "") !== String(row.matched_organization)
      )
        kind = "Office conflict";
      return {
        employeeId: row.id,
        employeeNo: row.employee_no,
        employeeName: [row.firstname, row.middlename, row.lastname, row.name_ext]
          .filter(Boolean)
          .join(" "),
        employmentType: row.status || "",
        employeeStatus: row.emp_status || "",
        legacyItemNumber: row.item_no || "",
        legacyPosition: row.position || "",
        legacyOrganization: row.department || "",
        classification: kind,
        matchedItemId:
          row.matched_item_id || (Number(row.suggested_count) === 1 ? row.suggested_item_id : null),
        matchedItemNumber: row.matched_item_number || "",
        matchedPosition: row.matched_position || "",
        matchedOrganization: row.matched_organization || "",
      };
    });
    const filtered =
      classification === "all"
        ? mapped
        : mapped.filter((row) => row.classification === classification);
    const counts = mapped.reduce((result, row) => {
      result[row.classification] = (result[row.classification] || 0) + 1;
      return result;
    }, {});
    return json(res, 200, { records: filtered, summary: counts });
  };

  const confirmOne = async ({ employeeId, plantillaItemId, effectiveFrom, remarks, userId }) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [[employee]] = await connection.execute(
        `SELECT id,employee_no,department,position,item_no,emp_status,lifecycle_state
           FROM employees WHERE id=:employeeId AND is_hidden=0 FOR UPDATE`,
        { employeeId },
      );
      if (!employee) throw new Error("Employee not found");
      if (/job order|jo\/cos|contract/i.test(employee.status || ""))
        throw new Error("Non-Plantilla employees must use the engagement workflow");
      const [[item]] = await connection.execute(
        `SELECT pi.*,p.title position_title,sg.ordinance,sg.grade,sg.step,
                ${orgNameSql} organization_name,${orgIdSql} org_unit_ref_id
           FROM plantilla_items pi JOIN positions p ON p.id=pi.position_id
           LEFT JOIN salary_grades sg ON sg.id=pi.salary_grade_id
           LEFT JOIN hr_reference_values s ON s.id=pi.sector_ref_id
           LEFT JOIN hr_reference_values off ON off.id=pi.office_ref_id
           LEFT JOIN hr_reference_values divi ON divi.id=pi.division_ref_id
           LEFT JOIN hr_reference_values sec ON sec.id=pi.section_ref_id
          WHERE pi.id=:plantillaItemId FOR UPDATE`,
        { plantillaItemId },
      );
      if (!item || item.item_status !== "Active")
        throw new Error("Select an active Plantilla item");
      const [[conflict]] = await connection.execute(
        `SELECT id FROM plantilla_occupancies
          WHERE status='Active' AND (employee_id=:employeeId OR plantilla_item_id=:plantillaItemId) FOR UPDATE`,
        { employeeId, plantillaItemId },
      );
      if (conflict)
        throw new Error("The employee or Plantilla item already has an active occupancy");
      const occupancyId = crypto.randomUUID();
      const reconciliationId = crypto.randomUUID();
      const before = { employee: { ...employee }, occupancy: null };
      await connection.execute(
        `INSERT INTO plantilla_occupancies
          (id,plantilla_item_id,employee_id,date_from,movement_type,remarks,created_by)
         VALUES (:id,:plantillaItemId,:employeeId,:effectiveFrom,'Legacy Reconciliation',:remarks,:userId)`,
        { id: occupancyId, plantillaItemId, employeeId, effectiveFrom, remarks, userId },
      );
      await connection.execute(
        `UPDATE employees SET item_no=:itemNumber,position=:position,department=:department,
          emp_status='Active',lifecycle_state='Active',current_org_unit_ref_id=:orgId WHERE id=:employeeId`,
        {
          employeeId,
          itemNumber: item.item_number,
          position: item.position_title,
          department: item.organization_name || employee.department,
          orgId: item.org_unit_ref_id || null,
        },
      );
      const after = {
        employee: {
          ...before.employee,
          item_no: item.item_number,
          position: item.position_title,
          department: item.organization_name || employee.department,
          emp_status: "Active",
          lifecycle_state: "Active",
        },
        occupancy: {
          id: occupancyId,
          itemId: item.id,
          itemNumber: item.item_number,
          dateFrom: effectiveFrom,
        },
      };
      await connection.execute(
        `INSERT INTO plantilla_reconciliations
          (id,employee_id,plantilla_item_id,occupancy_id,effective_from,remarks,classification_before,before_snapshot_json,after_snapshot_json,confirmed_by)
         VALUES (:id,:employeeId,:plantillaItemId,:occupancyId,:effectiveFrom,:remarks,'HR confirmed',:before,:after,:userId)`,
        {
          id: reconciliationId,
          employeeId,
          plantillaItemId,
          occupancyId,
          effectiveFrom,
          remarks,
          before: JSON.stringify(before),
          after: JSON.stringify(after),
          userId,
        },
      );
      await connection.execute(
        "INSERT INTO plantilla_item_history(plantilla_item_id,action,snapshot_json,changed_by) VALUES(:id,'Legacy Reconciliation',:snapshot,:userId)",
        { id: plantillaItemId, snapshot: JSON.stringify(after), userId },
      );
      await connection.execute(
        `INSERT INTO service_record_entries
          (id,employee_id,service_from,position_title,department,appointment_status,annual_salary,salary_grade,salary_step,item_number,remarks,created_by,updated_by)
         VALUES(:id,:employeeId,:effectiveFrom,:position,:department,'Legacy Reconciliation',:salary,:grade,:step,:itemNumber,:remarks,:userId,:userId)`,
        {
          id: crypto.randomUUID(),
          employeeId,
          effectiveFrom,
          position: item.position_title,
          department: item.organization_name || employee.department,
          salary: item.authorized_salary,
          grade: item.grade,
          step: item.step,
          itemNumber: item.item_number,
          remarks: `Legacy Reconciliation: ${remarks}`,
          userId,
        },
      );
      if (item.salary_grade_id) {
        await connection.execute(
          "INSERT INTO employee_salary_records(id,employee_id,payload) VALUES(:id,:employeeId,:payload)",
          {
            id: crypto.randomUUID(),
            employeeId,
            payload: JSON.stringify({
              date: effectiveFrom,
              description: "Legacy Plantilla reconciliation",
              ordinance: item.ordinance || "",
              grade: Number(item.grade || 0),
              step: Number(item.step || 0),
              amount: Number(item.authorized_salary || 0),
              gross: Number(item.authorized_salary || 0),
              type: "Legacy Reconciliation",
              remarks,
            }),
          },
        );
      }
      await connection.commit();
      return { employeeId, plantillaItemId, occupancyId, reconciliationId };
    } catch (error) {
      await connection.rollback().catch(() => {});
      throw error;
    } finally {
      connection.release();
    }
  };

  handlers.reconcile = async (req, res) => {
    const user = await requireReconciliation(req, res);
    if (!user) return;
    try {
      const body = await readBody(req);
      const effectiveFrom = strictDate(body.effectiveFrom, "Effective-from date", true);
      const remarks = String(body.remarks || "").trim();
      if (!remarks) throw new Error("Reconciliation remarks are required");
      const result = await confirmOne({
        employeeId: String(body.employeeId || "").trim(),
        plantillaItemId: String(body.plantillaItemId || "").trim(),
        effectiveFrom,
        remarks,
        userId: user.id,
      });
      await logAudit(user.id, "plantilla.reconcile", result, req);
      return json(res, 201, {
        result,
        currentAssignment: await readCurrentAssignment(pool, result.employeeId),
      });
    } catch (error) {
      return fail(res, error);
    }
  };

  handlers.reconcileBulk = async (req, res) => {
    const user = await requireReconciliation(req, res);
    if (!user) return;
    const body = await readBody(req);
    const matches = Array.isArray(body.matches) ? body.matches.slice(0, 100) : [];
    if (!matches.length)
      return json(res, 400, { error: "Select at least one reconciliation match" });
    const results = [];
    for (const match of matches) {
      try {
        const remarks = String(match.remarks || body.remarks || "").trim();
        if (!remarks) throw new Error("Reconciliation remarks are required");
        results.push({
          ok: true,
          ...(await confirmOne({
            employeeId: String(match.employeeId || "").trim(),
            plantillaItemId: String(match.plantillaItemId || "").trim(),
            effectiveFrom: strictDate(
              match.effectiveFrom || body.effectiveFrom,
              "Effective-from date",
              true,
            ),
            remarks,
            userId: user.id,
          })),
        });
      } catch (error) {
        results.push({ ok: false, employeeId: match.employeeId || "", error: error.message });
      }
    }
    await logAudit(
      user.id,
      "plantilla.reconcile_bulk",
      {
        succeeded: results.filter((x) => x.ok).length,
        failed: results.filter((x) => !x.ok).length,
      },
      req,
    );
    return json(res, 200, { results });
  };

  handlers.listEngagements = async (req, res, url) => {
    if (!(await requireRead(req, res))) return;
    await refreshEngagementStates(pool);
    const employeeId = String(url.searchParams.get("employeeId") || "").trim();
    const status = String(url.searchParams.get("status") || "all");
    const where = [],
      params = {};
    if (employeeId) {
      where.push("ne.employee_id=:employeeId");
      params.employeeId = employeeId;
    }
    if (status !== "all") {
      where.push("ne.status=:status");
      params.status = status;
    }
    const [rows] = await pool.execute(
      `SELECT ne.*,ou.name organization_name,e.employee_no,
        TRIM(CONCAT_WS(' ',e.firstname,e.middlename,e.lastname,e.name_ext)) employee_name
       FROM non_plantilla_engagements ne JOIN employees e ON e.id=ne.employee_id
       JOIN hr_reference_values ou ON ou.id=ne.org_unit_ref_id
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY ne.date_from DESC,ne.created_at DESC`,
      params,
    );
    return json(res, 200, { engagements: rows.map(mapEngagement) });
  };

  handlers.createEngagement = async (req, res) => {
    const user = await requireEngagement(req, res);
    if (!user) return;
    const connection = await pool.getConnection();
    try {
      const body = await readBody(req);
      await connection.beginTransaction();
      const data = await engagementPayload(body, connection);
      const [[employee]] = await connection.execute(
        "SELECT id FROM employees WHERE id=:employeeId AND is_hidden=0 FOR UPDATE",
        { employeeId: data.employeeId },
      );
      if (!employee) throw new Error("Employee not found");
      const [[plantilla]] = await connection.execute(
        "SELECT id FROM plantilla_occupancies WHERE employee_id=:employeeId AND status='Active' FOR UPDATE",
        { employeeId: data.employeeId },
      );
      if (plantilla)
        throw new Error(
          "An employee with active Plantilla occupancy cannot receive a non-Plantilla engagement",
        );
      const id = crypto.randomUUID();
      await connection.execute(
        `INSERT INTO non_plantilla_engagements
          (id,employee_id,engagement_type,org_unit_ref_id,designation,contract_number,date_from,date_to,rate,funding_source,supervisor,remarks,status,created_by)
         VALUES (:id,:employeeId,:engagementType,:organizationId,:designation,:contractNumber,:dateFrom,:dateTo,:rate,:fundingSource,:supervisor,:remarks,:status,:userId)`,
        { id, ...data, userId: user.id },
      );
      if (data.status === "Active") {
        await connection.execute(
          `UPDATE employees SET department=:department,position=:position,status=:employmentType,
            emp_status='Active',lifecycle_state='Active',current_org_unit_ref_id=:organizationId WHERE id=:employeeId`,
          {
            employeeId: data.employeeId,
            department: data.organizationName,
            position: data.designation,
            employmentType: data.engagementType === "Casual" ? "Casual" : "JO/COS",
            organizationId: data.organizationId,
          },
        );
        await connection.execute("UPDATE users SET is_active=1 WHERE employee_id=:employeeId", {
          employeeId: data.employeeId,
        });
      }
      await connection.commit();
      await logAudit(
        user.id,
        "engagement.create",
        { id, employeeId: data.employeeId, status: data.status },
        req,
      );
      return json(res, 201, { engagement: await readEngagement(id) });
    } catch (error) {
      await connection.rollback().catch(() => {});
      return fail(res, error);
    } finally {
      connection.release();
    }
  };

  handlers.updateEngagement = async (req, res, id) => {
    const user = await requireEngagement(req, res);
    if (!user) return;
    const current = await readEngagement(id);
    if (!current) return json(res, 404, { error: "Engagement not found" });
    if (!["Scheduled"].includes(current.status))
      return json(res, 409, {
        error: "Only scheduled engagements can be edited; renew or terminate an active engagement",
      });
    try {
      const data = await engagementPayload(await readBody(req));
      await pool.execute(
        `UPDATE non_plantilla_engagements SET employee_id=:employeeId,engagement_type=:engagementType,
          org_unit_ref_id=:organizationId,designation=:designation,contract_number=:contractNumber,
          date_from=:dateFrom,date_to=:dateTo,rate=:rate,funding_source=:fundingSource,
          supervisor=:supervisor,remarks=:remarks,status=:status WHERE id=:id`,
        { id, ...data },
      );
      await logAudit(user.id, "engagement.update", { id }, req);
      return json(res, 200, { engagement: await readEngagement(id) });
    } catch (error) {
      return fail(res, error);
    }
  };

  handlers.renewEngagement = async (req, res, id) => {
    const user = await requireEngagement(req, res);
    if (!user) return;
    const previous = await readEngagement(id);
    if (!previous) return json(res, 404, { error: "Engagement not found" });
    if (!["Active", "Expired"].includes(previous.status))
      return json(res, 409, { error: "Only an active or expired engagement can be renewed" });
    const body = await readBody(req);
    try {
      const data = await engagementPayload({
        ...previous,
        ...body,
        employeeId: previous.employeeId,
      });
      const newId = crypto.randomUUID();
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        if (previous.status === "Active" && data.status === "Active")
          throw new Error("A renewal must start after the current active engagement ends");
        await connection.execute(
          "UPDATE non_plantilla_engagements SET status='Renewed',ended_at=NOW(),ended_by=:userId WHERE id=:id",
          { id, userId: user.id },
        );
        await connection.execute(
          `INSERT INTO non_plantilla_engagements
            (id,employee_id,engagement_type,org_unit_ref_id,designation,contract_number,date_from,date_to,rate,funding_source,supervisor,remarks,status,previous_engagement_id,created_by)
           VALUES (:id,:employeeId,:engagementType,:organizationId,:designation,:contractNumber,:dateFrom,:dateTo,:rate,:fundingSource,:supervisor,:remarks,:status,:previousId,:userId)`,
          { id: newId, ...data, previousId: id, userId: user.id },
        );
        await connection.commit();
      } catch (error) {
        await connection.rollback().catch(() => {});
        throw error;
      } finally {
        connection.release();
      }
      await logAudit(user.id, "engagement.renew", { id, renewalId: newId }, req);
      return json(res, 201, { engagement: await readEngagement(newId) });
    } catch (error) {
      return fail(res, error);
    }
  };

  handlers.terminateEngagement = async (req, res, id) => {
    const user = await requireEngagement(req, res);
    if (!user) return;
    const body = await readBody(req);
    const remarks = String(body.remarks || "").trim();
    if (!remarks) return json(res, 400, { error: "Termination remarks are required" });
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [[engagement]] = await connection.execute(
        "SELECT * FROM non_plantilla_engagements WHERE id=:id FOR UPDATE",
        { id },
      );
      if (!engagement) throw new Error("Engagement not found");
      if (!["Active", "Scheduled"].includes(engagement.status))
        throw new Error("Only an active or scheduled engagement can be terminated");
      const dateTo = strictDate(body.dateTo || today(), "Termination date", true);
      if (dateTo < day(engagement.date_from))
        throw new Error("Termination date cannot be before the engagement start");
      await connection.execute(
        `UPDATE non_plantilla_engagements SET status='Terminated',date_to=:dateTo,
          remarks=CONCAT_WS('\n',NULLIF(remarks,''),:remarks),ended_by=:userId,ended_at=NOW() WHERE id=:id`,
        { id, dateTo, remarks, userId: user.id },
      );
      if (engagement.status === "Active") {
        await connection.execute(
          `UPDATE employees SET emp_status='Inactive',lifecycle_state='Inactive',current_org_unit_ref_id=NULL
            WHERE id=:employeeId`,
          { employeeId: engagement.employee_id },
        );
        await connection.execute("UPDATE users SET is_active=0 WHERE employee_id=:employeeId", {
          employeeId: engagement.employee_id,
        });
      }
      await connection.commit();
      await logAudit(
        user.id,
        "engagement.terminate",
        { id, employeeId: engagement.employee_id, dateTo },
        req,
      );
      return json(res, 200, { engagement: await readEngagement(id) });
    } catch (error) {
      await connection.rollback().catch(() => {});
      return fail(res, error);
    } finally {
      connection.release();
    }
  };

  handlers.processDue = () => refreshEngagementStates(pool);
  handlers.currentAssignment = (employeeId) => readCurrentAssignment(pool, employeeId);
  return handlers;
}
