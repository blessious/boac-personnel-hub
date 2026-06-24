import crypto from "node:crypto";

export async function initializePlantillaSchema(pool, employeeIdDefinition) {
  const employeeIdType = employeeIdDefinition.replace(/\s+NOT NULL$/i, "");
  await pool.query(`CREATE TABLE IF NOT EXISTS plantilla_items (
    id CHAR(36) NOT NULL PRIMARY KEY, item_number VARCHAR(120) NOT NULL UNIQUE,
    position_id INT UNSIGNED NOT NULL, salary_grade_id INT UNSIGNED NULL,
    sector_ref_id INT UNSIGNED NULL, office_ref_id INT UNSIGNED NULL, division_ref_id INT UNSIGNED NULL,
    section_ref_id INT UNSIGNED NULL, plantilla_type_ref_id INT UNSIGNED NULL, budget_code_ref_id INT UNSIGNED NULL,
    authorized_salary DECIMAL(12,2) NULL, item_status ENUM('Active','Inactive','Abolished') NOT NULL DEFAULT 'Active',
    effective_from DATE NULL, effective_to DATE NULL, notes TEXT NULL, created_by INT UNSIGNED NULL, updated_by INT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_plantilla_status (item_status),
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE RESTRICT,
    FOREIGN KEY (salary_grade_id) REFERENCES salary_grades(id) ON DELETE RESTRICT,
    FOREIGN KEY (sector_ref_id) REFERENCES hr_reference_values(id) ON DELETE RESTRICT,
    FOREIGN KEY (office_ref_id) REFERENCES hr_reference_values(id) ON DELETE RESTRICT,
    FOREIGN KEY (division_ref_id) REFERENCES hr_reference_values(id) ON DELETE RESTRICT,
    FOREIGN KEY (section_ref_id) REFERENCES hr_reference_values(id) ON DELETE RESTRICT,
    FOREIGN KEY (plantilla_type_ref_id) REFERENCES hr_reference_values(id) ON DELETE RESTRICT,
    FOREIGN KEY (budget_code_ref_id) REFERENCES hr_reference_values(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL, FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB`);
  await pool.query(`CREATE TABLE IF NOT EXISTS plantilla_occupancies (
    id CHAR(36) NOT NULL PRIMARY KEY, plantilla_item_id CHAR(36) NOT NULL, employee_id ${employeeIdDefinition},
    date_from DATE NOT NULL, date_to DATE NULL, status ENUM('Active','Ended') NOT NULL DEFAULT 'Active',
    movement_type VARCHAR(80) NULL, appointment_number VARCHAR(120) NULL, remarks TEXT NULL,
    created_by INT UNSIGNED NULL, ended_by INT UNSIGNED NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, ended_at DATETIME NULL,
    active_item_id CHAR(36) GENERATED ALWAYS AS (CASE WHEN status='Active' THEN plantilla_item_id ELSE NULL END) STORED,
    active_employee_id ${employeeIdType} GENERATED ALWAYS AS (CASE WHEN status='Active' THEN employee_id ELSE NULL END) STORED,
    UNIQUE KEY uniq_active_item (active_item_id), UNIQUE KEY uniq_active_employee (active_employee_id),
    INDEX idx_occupancy_history (plantilla_item_id,date_from,date_to),
    FOREIGN KEY (plantilla_item_id) REFERENCES plantilla_items(id) ON DELETE RESTRICT,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL, FOREIGN KEY (ended_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB`);
  await pool.query(`CREATE TABLE IF NOT EXISTS plantilla_item_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, plantilla_item_id CHAR(36) NOT NULL, action VARCHAR(40) NOT NULL,
    snapshot_json JSON NOT NULL, changed_by INT UNSIGNED NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_item_history (plantilla_item_id,created_at), FOREIGN KEY (plantilla_item_id) REFERENCES plantilla_items(id) ON DELETE RESTRICT,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB`);
}

const selectSql = `SELECT pi.*,p.title position_title,sg.ordinance,sg.grade,sg.step,sg.amount salary_amount,
 s.name sector_name,o.name office_name,d.name division_name,se.name section_name,pt.name plantilla_type_name,b.name budget_code_name,
 po.id occupancy_id,po.employee_id,po.date_from occupancy_date_from,po.movement_type,po.appointment_number,
 e.employee_no,CONCAT(e.lastname,', ',e.firstname) employee_name FROM plantilla_items pi
 JOIN positions p ON p.id=pi.position_id LEFT JOIN salary_grades sg ON sg.id=pi.salary_grade_id
 LEFT JOIN hr_reference_values s ON s.id=pi.sector_ref_id LEFT JOIN hr_reference_values o ON o.id=pi.office_ref_id
 LEFT JOIN hr_reference_values d ON d.id=pi.division_ref_id LEFT JOIN hr_reference_values se ON se.id=pi.section_ref_id
 LEFT JOIN hr_reference_values pt ON pt.id=pi.plantilla_type_ref_id LEFT JOIN hr_reference_values b ON b.id=pi.budget_code_ref_id
 LEFT JOIN plantilla_occupancies po ON po.plantilla_item_id=pi.id AND po.status='Active' LEFT JOIN employees e ON e.id=po.employee_id`;
const day = (v) => (v ? new Date(v).toISOString().slice(0, 10) : null);
const directAssignmentActions = new Set([
  "Original Appointment",
  "Promotion",
  "Transfer",
  "Reassignment",
  "Job Rotation",
  "Reclassification",
]);
const directAssignmentAction = (value) => {
  const action = String(value || "").trim();
  return directAssignmentActions.has(action) ? action : "Original Appointment";
};
const movementControlNumber = () =>
  `PA-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
const employeeSnapshot = (employee, occupancy = null) => ({
  employee: {
    id: employee.id,
    employeeNo: employee.employee_no,
    department: employee.department,
    position: employee.position,
    itemNo: employee.item_no,
    empStatus: employee.emp_status,
  },
  occupancy: occupancy
    ? {
        id: occupancy.id,
        itemId: occupancy.plantilla_item_id,
        itemNumber: occupancy.item_number,
        dateFrom: day(occupancy.date_from),
        salaryGradeId: occupancy.salary_grade_id ? Number(occupancy.salary_grade_id) : null,
        authorizedSalary:
          occupancy.authorized_salary === null ? null : Number(occupancy.authorized_salary),
      }
    : null,
});
const date = (v, n, required = false) => {
  if (!v) {
    if (required) throw Error(`${n} is required`);
    return null;
  }
  v = String(v).trim();
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(v) ||
    Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()) ||
    day(`${v}T00:00:00Z`) !== v
  )
    throw Error(`${n} must be a valid YYYY-MM-DD date`);
  return v;
};
const num = (v, n, required = false) => {
  if (v == null || v === "") {
    if (required) throw Error(`${n} is required`);
    return null;
  }
  const x = Number(v);
  if (!Number.isInteger(x) || x < 1) throw Error(`Select a valid ${n}`);
  return x;
};
const map = (r) => ({
  id: r.id,
  itemNumber: r.item_number,
  positionId: Number(r.position_id),
  positionTitle: r.position_title,
  salaryGradeId: r.salary_grade_id ? Number(r.salary_grade_id) : null,
  salaryGrade: r.salary_grade_id
    ? {
        ordinance: r.ordinance,
        grade: Number(r.grade),
        step: Number(r.step),
        amount: Number(r.salary_amount),
      }
    : null,
  sectorId: r.sector_ref_id ? Number(r.sector_ref_id) : null,
  sectorName: r.sector_name || "",
  officeId: r.office_ref_id ? Number(r.office_ref_id) : null,
  officeName: r.office_name || "",
  divisionId: r.division_ref_id ? Number(r.division_ref_id) : null,
  divisionName: r.division_name || "",
  sectionId: r.section_ref_id ? Number(r.section_ref_id) : null,
  sectionName: r.section_name || "",
  plantillaTypeId: r.plantilla_type_ref_id ? Number(r.plantilla_type_ref_id) : null,
  plantillaTypeName: r.plantilla_type_name || "",
  budgetCodeId: r.budget_code_ref_id ? Number(r.budget_code_ref_id) : null,
  budgetCodeName: r.budget_code_name || "",
  authorizedSalary: r.authorized_salary == null ? null : Number(r.authorized_salary),
  itemStatus: r.item_status,
  effectiveFrom: day(r.effective_from),
  effectiveTo: day(r.effective_to),
  notes: r.notes || "",
  occupant: r.occupancy_id
    ? {
        occupancyId: r.occupancy_id,
        employeeId: r.employee_id,
        employeeNo: r.employee_no,
        employeeName: r.employee_name,
        dateFrom: day(r.occupancy_date_from),
        movementType: r.movement_type || "",
        appointmentNumber: r.appointment_number || "",
      }
    : null,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export function createPlantillaHandlers({
  pool,
  requireEmployeeRead,
  requireEmployeeWrite,
  readBody,
  json,
  logAudit,
}) {
  const read = async (id, c = pool) => {
    const [rs] = await c.execute(selectSql + " WHERE pi.id=:id LIMIT 1", { id });
    return rs[0] ? map(rs[0]) : null;
  };
  const history = (c, id, action, snapshot, userId) =>
    c.execute(
      "INSERT INTO plantilla_item_history(plantilla_item_id,action,snapshot_json,changed_by) VALUES(:id,:action,:snapshot,:userId)",
      { id, action, snapshot: JSON.stringify(snapshot), userId },
    );
  const movementEvent = (
    c,
    movementId,
    eventType,
    fromStatus,
    toStatus,
    actorId,
    remarks,
    snapshot,
  ) =>
    c.execute(
      "INSERT INTO personnel_movement_events(id,movement_id,event_type,from_status,to_status,actor_id,remarks,snapshot_json) VALUES(:id,:movementId,:eventType,:fromStatus,:toStatus,:actorId,:remarks,:snapshot)",
      {
        id: crypto.randomUUID(),
        movementId,
        eventType,
        fromStatus,
        toStatus,
        actorId,
        remarks: remarks || null,
        snapshot: snapshot ? JSON.stringify(snapshot) : null,
      },
    );
  const postedMovement = async (c, data) => {
    const movementId = crypto.randomUUID();
    await c.execute(
      `INSERT INTO personnel_movements(id,control_number,employee_id,action_type,status,effective_date,end_date,authority_number,authority_date,target_plantilla_item_id,target_position_id,target_salary_grade_id,target_department,remarks,supporting_documents,source_snapshot_json,posted_before_snapshot_json,posted_after_snapshot_json,prepared_by,submitted_by,reviewed_by,approved_by,posted_by,submitted_at,reviewed_at,approved_at,posted_at,decision_remarks) VALUES(:id,:controlNumber,:employeeId,:actionType,'Posted',:effectiveDate,:endDate,:authorityNumber,NULL,:targetPlantillaItemId,:targetPositionId,:targetSalaryGradeId,:targetDepartment,:remarks,:supportingDocuments,:sourceSnapshot,:beforeSnapshot,:afterSnapshot,:userId,:userId,:userId,:userId,:userId,NOW(),NOW(),NOW(),NOW(),:decisionRemarks)`,
      {
        id: movementId,
        controlNumber: data.controlNumber || movementControlNumber(),
        employeeId: data.employeeId,
        actionType: data.actionType,
        effectiveDate: data.effectiveDate,
        endDate: data.endDate || null,
        authorityNumber: data.authorityNumber || null,
        targetPlantillaItemId: data.targetPlantillaItemId || null,
        targetPositionId: data.targetPositionId || null,
        targetSalaryGradeId: data.targetSalaryGradeId || null,
        targetDepartment: data.targetDepartment || null,
        remarks: data.remarks || null,
        supportingDocuments: JSON.stringify(data.supportingDocuments || []),
        sourceSnapshot: JSON.stringify(data.before),
        beforeSnapshot: JSON.stringify(data.before),
        afterSnapshot: JSON.stringify(data.after),
        userId: data.userId,
        decisionRemarks: data.decisionRemarks || data.remarks || null,
      },
    );
    await movementEvent(c, movementId, "Created", null, "Draft", data.userId, data.remarks, {
      source: data.before,
      createdFrom: "Plantilla direct action",
    });
    await movementEvent(c, movementId, "Posted", "Approved", "Posted", data.userId, data.remarks, {
      before: data.before,
      after: data.after,
      createdFrom: "Plantilla direct action",
    });
    return movementId;
  };
  const fail = (res, e) => {
    if (e?.code === "ER_DUP_ENTRY")
      return json(res, 409, { error: "Duplicate item number or active occupancy conflict" });
    if (e instanceof Error && !e.code) return json(res, 400, { error: e.message });
    throw e;
  };
  const payload = async (body, existing) => {
    const itemNumber = String(body.itemNumber || "")
      .trim()
      .toUpperCase();
    if (!itemNumber || itemNumber.length > 120) throw Error("A valid item number is required");
    const positionId = num(body.positionId, "position", true),
      salaryGradeId = num(body.salaryGradeId, "salary grade");
    if (
      !(await pool.execute("SELECT id FROM positions WHERE id=:positionId", { positionId }))[0][0]
    )
      throw Error("Select a valid position");
    if (
      salaryGradeId &&
      !(
        await pool.execute("SELECT id FROM salary_grades WHERE id=:salaryGradeId", {
          salaryGradeId,
        })
      )[0][0]
    )
      throw Error("Select a valid salary grade");
    const defs = [
        ["sectorId", "sectors", "Sector"],
        ["officeId", "offices", "Office"],
        ["divisionId", "divisions", "Division"],
        ["sectionId", "sections", "Section"],
        ["plantillaTypeId", "plantilla-types", "Plantilla type"],
        ["budgetCodeId", "budget-codes", "Budget code"],
      ],
      refs = {},
      rows = {};
    for (const [f, cat, label] of defs) {
      refs[f] = num(body[f], label);
      if (refs[f]) {
        const [rr] = await pool.execute(
          "SELECT id,parent_id,is_active FROM hr_reference_values WHERE id=:id AND category=:cat",
          { id: refs[f], cat },
        );
        if (!rr[0] || !rr[0].is_active) throw Error(`Select an active ${label}`);
        rows[f] = rr[0];
      }
    }
    if (refs.officeId && Number(rows.officeId.parent_id) !== refs.sectorId)
      throw Error("Office must belong to the selected sector");
    if (refs.divisionId && Number(rows.divisionId.parent_id) !== refs.officeId)
      throw Error("Division must belong to the selected office");
    if (refs.sectionId && Number(rows.sectionId.parent_id) !== refs.divisionId)
      throw Error("Section must belong to the selected division");
    const itemStatus = String(body.itemStatus || "Active");
    if (!["Active", "Inactive", "Abolished"].includes(itemStatus))
      throw Error("Invalid item status");
    if (existing?.occupant && itemStatus !== "Active")
      throw Error("Vacate the item before changing its status");
    const effectiveFrom = date(body.effectiveFrom, "Effective-from date"),
      effectiveTo = date(body.effectiveTo, "Effective-to date");
    if (effectiveFrom && effectiveTo && effectiveTo < effectiveFrom)
      throw Error("Effective-to date cannot be earlier than effective-from date");
    const authorizedSalary =
      body.authorizedSalary == null || body.authorizedSalary === ""
        ? null
        : Number(body.authorizedSalary);
    if (authorizedSalary !== null && (!Number.isFinite(authorizedSalary) || authorizedSalary < 0))
      throw Error("Authorized salary must be non-negative");
    return {
      itemNumber,
      positionId,
      salaryGradeId,
      ...refs,
      authorizedSalary,
      itemStatus,
      effectiveFrom,
      effectiveTo,
      notes: String(body.notes || "").trim() || null,
    };
  };
  const handlers = {};
  handlers.list = async (req, res, url) => {
    if (!(await requireEmployeeRead(req, res))) return;
    const where = [],
      p = {};
    const q = String(url.searchParams.get("q") || "").trim(),
      status = String(url.searchParams.get("status") || ""),
      occ = String(url.searchParams.get("occupancy") || "");
    if (q) {
      where.push(
        "(pi.item_number LIKE :q OR p.title LIKE :q OR e.employee_no LIKE :q OR e.firstname LIKE :q OR e.lastname LIKE :q)",
      );
      p.q = `%${q}%`;
    }
    if (status && status !== "all") {
      where.push("pi.item_status=:status");
      p.status = status;
    }
    if (occ === "occupied") where.push("po.id IS NOT NULL");
    if (occ === "vacant") where.push("po.id IS NULL AND pi.item_status='Active'");
    const [rs] = await pool.execute(
      selectSql +
        (where.length ? " WHERE " + where.join(" AND ") : "") +
        " ORDER BY pi.item_number",
      p,
    );
    const [[s]] = await pool.query(
      "SELECT COUNT(*) authorized,SUM(item_status='Active') active,SUM(item_status<>'Active') inactive,SUM(item_status='Active' AND po.id IS NOT NULL) occupied,SUM(item_status='Active' AND po.id IS NULL) vacant FROM plantilla_items pi LEFT JOIN plantilla_occupancies po ON po.plantilla_item_id=pi.id AND po.status='Active'",
    );
    return json(res, 200, {
      items: rs.map(map),
      summary: Object.fromEntries(Object.entries(s).map(([k, v]) => [k, Number(v || 0)])),
    });
  };
  handlers.create = async (req, res) => {
    const u = await requireEmployeeWrite(req, res);
    if (!u) return;
    try {
      const x = await payload(await readBody(req)),
        id = crypto.randomUUID();
      await pool.execute(
        `INSERT INTO plantilla_items(id,item_number,position_id,salary_grade_id,sector_ref_id,office_ref_id,division_ref_id,section_ref_id,plantilla_type_ref_id,budget_code_ref_id,authorized_salary,item_status,effective_from,effective_to,notes,created_by,updated_by) VALUES(:id,:itemNumber,:positionId,:salaryGradeId,:sectorId,:officeId,:divisionId,:sectionId,:plantillaTypeId,:budgetCodeId,:authorizedSalary,:itemStatus,:effectiveFrom,:effectiveTo,:notes,:userId,:userId)`,
        { id, ...x, userId: u.id },
      );
      const item = await read(id);
      await history(pool, id, "Created", item, u.id);
      await logAudit(u.id, "plantilla.create", { id, itemNumber: x.itemNumber }, req);
      return json(res, 201, { item });
    } catch (e) {
      return fail(res, e);
    }
  };
  handlers.update = async (req, res, id) => {
    const u = await requireEmployeeWrite(req, res);
    if (!u) return;
    const old = await read(id);
    if (!old) return json(res, 404, { error: "Plantilla item not found" });
    try {
      const x = await payload(await readBody(req), old);
      await pool.execute(
        `UPDATE plantilla_items SET item_number=:itemNumber,position_id=:positionId,salary_grade_id=:salaryGradeId,sector_ref_id=:sectorId,office_ref_id=:officeId,division_ref_id=:divisionId,section_ref_id=:sectionId,plantilla_type_ref_id=:plantillaTypeId,budget_code_ref_id=:budgetCodeId,authorized_salary=:authorizedSalary,item_status=:itemStatus,effective_from=:effectiveFrom,effective_to=:effectiveTo,notes=:notes,updated_by=:userId WHERE id=:id`,
        { id, ...x, userId: u.id },
      );
      const item = await read(id);
      await history(pool, id, "Updated", { before: old, after: item }, u.id);
      await logAudit(u.id, "plantilla.update", { id }, req);
      return json(res, 200, { item });
    } catch (e) {
      return fail(res, e);
    }
  };
  handlers.remove = async (req, res, id) => {
    const u = await requireEmployeeWrite(req, res);
    if (!u) return;
    const c = await pool.getConnection();
    try {
      await c.beginTransaction();
      const [[item]] = await c.execute(
        "SELECT id,item_number FROM plantilla_items WHERE id=:id FOR UPDATE",
        { id },
      );
      if (!item) {
        await c.rollback();
        return json(res, 404, { error: "Plantilla item not found" });
      }
      const [[occupancy]] = await c.execute(
        "SELECT COUNT(*) total FROM plantilla_occupancies WHERE plantilla_item_id=:id",
        { id },
      );
      if (Number(occupancy.total || 0) > 0)
        throw Error(
          "This item has occupancy history. Mark it Inactive or Abolished instead of deleting it.",
        );
      const [[movement]] = await c.execute(
        "SELECT COUNT(*) total FROM personnel_movements WHERE target_plantilla_item_id=:id",
        { id },
      );
      if (Number(movement.total || 0) > 0)
        throw Error(
          "This item is referenced by employee movements. Mark it Inactive or Abolished instead of deleting it.",
        );
      await c.execute("DELETE FROM plantilla_item_history WHERE plantilla_item_id=:id", { id });
      await c.execute("DELETE FROM plantilla_items WHERE id=:id", { id });
      await c.commit();
      await logAudit(u.id, "plantilla.delete", { id, itemNumber: item.item_number }, req);
      return json(res, 200, { ok: true });
    } catch (e) {
      await c.rollback().catch(() => {});
      return fail(res, e);
    } finally {
      c.release();
    }
  };
  handlers.assign = async (req, res, id) => {
    const u = await requireEmployeeWrite(req, res);
    if (!u) return;
    const c = await pool.getConnection();
    try {
      const b = await readBody(req),
        employeeId = String(b.employeeId || ""),
        dateFrom = date(b.dateFrom, "Assignment date", true);
      await c.beginTransaction();
      const [[i]] = await c.execute(
        `SELECT pi.*,p.title position_title,COALESCE(sec.name,divi.name,off.name,s.name) organization_name
         FROM plantilla_items pi
         JOIN positions p ON p.id=pi.position_id
         LEFT JOIN hr_reference_values sec ON sec.id=pi.section_ref_id
         LEFT JOIN hr_reference_values divi ON divi.id=pi.division_ref_id
         LEFT JOIN hr_reference_values off ON off.id=pi.office_ref_id
         LEFT JOIN hr_reference_values s ON s.id=pi.sector_ref_id
         WHERE pi.id=:id FOR UPDATE`,
        { id },
      );
      if (!i) throw Error("Plantilla item not found");
      if (i.item_status !== "Active") throw Error("Only active items can be occupied");
      const [[e]] = await c.execute(
        "SELECT id,employee_no,department,position,item_no,emp_status FROM employees WHERE id=:employeeId AND is_hidden=0 FOR UPDATE",
        { employeeId },
      );
      if (!e) throw Error("Select a valid employee");
      if (
        (
          await c.execute(
            "SELECT id FROM plantilla_occupancies WHERE (plantilla_item_id=:id OR employee_id=:employeeId) AND status='Active' FOR UPDATE",
            { id, employeeId },
          )
        )[0][0]
      )
        throw Error("The item or employee already has an active occupancy");
      const assignmentAction = directAssignmentAction(b.movementType);
      const before = employeeSnapshot(e, null);
      const occupancyId = crypto.randomUUID();
      await c.execute(
        `INSERT INTO plantilla_occupancies(id,plantilla_item_id,employee_id,date_from,movement_type,appointment_number,remarks,created_by) VALUES(:occupancyId,:id,:employeeId,:dateFrom,:movementType,:appointmentNumber,:remarks,:userId)`,
        {
          occupancyId,
          id,
          employeeId,
          dateFrom,
          movementType: assignmentAction,
          appointmentNumber: String(b.appointmentNumber || "").trim() || null,
          remarks: String(b.remarks || "").trim() || null,
          userId: u.id,
        },
      );
      await c.execute(
        "UPDATE employees SET item_no=:itemNumber,position=:title,department=COALESCE(:department,department),emp_status='Active' WHERE id=:employeeId",
        {
          itemNumber: i.item_number,
          title: i.position_title,
          department: i.organization_name || null,
          employeeId,
        },
      );
      const [[updatedEmployee]] = await c.execute(
        "SELECT id,employee_no,department,position,item_no,emp_status FROM employees WHERE id=:employeeId",
        { employeeId },
      );
      const after = employeeSnapshot(updatedEmployee, {
        id: occupancyId,
        plantilla_item_id: id,
        item_number: i.item_number,
        date_from: dateFrom,
        salary_grade_id: i.salary_grade_id,
        authorized_salary: i.authorized_salary,
      });
      await postedMovement(c, {
        employeeId,
        actionType: assignmentAction,
        effectiveDate: dateFrom,
        authorityNumber: String(b.appointmentNumber || "").trim() || null,
        targetPlantillaItemId: id,
        targetPositionId: i.position_id,
        targetSalaryGradeId: i.salary_grade_id,
        targetDepartment: i.organization_name || null,
        remarks: String(b.remarks || "").trim() || "Posted from Plantilla direct assignment",
        supportingDocuments: String(b.appointmentNumber || "").trim()
          ? [
              {
                name: "Appointment / authority number",
                reference: String(b.appointmentNumber).trim(),
              },
            ]
          : [],
        before,
        after,
        userId: u.id,
      });
      const item = await read(id, c);
      await history(c, id, "Assigned", item, u.id);
      await c.commit();
      await logAudit(u.id, "plantilla.assign", { id, employeeId }, req);
      return json(res, 200, { item });
    } catch (e) {
      await c.rollback().catch(() => {});
      return fail(res, e);
    } finally {
      c.release();
    }
  };
  handlers.vacate = async (req, res, id) => {
    const u = await requireEmployeeWrite(req, res);
    if (!u) return;
    const c = await pool.getConnection();
    try {
      const b = await readBody(req),
        dateTo = date(b.dateTo, "Vacancy date", true);
      await c.beginTransaction();
      const [[o]] = await c.execute(
        "SELECT po.*,pi.item_number,pi.position_id,pi.salary_grade_id,pi.authorized_salary FROM plantilla_occupancies po JOIN plantilla_items pi ON pi.id=po.plantilla_item_id WHERE po.plantilla_item_id=:id AND po.status='Active' FOR UPDATE",
        { id },
      );
      if (!o) throw Error("This item is already vacant");
      const from = day(o.date_from);
      if (dateTo < from) throw Error("Vacancy date cannot be earlier than assignment date");
      const [[employeeBefore]] = await c.execute(
        "SELECT id,employee_no,department,position,item_no,emp_status FROM employees WHERE id=:employeeId FOR UPDATE",
        { employeeId: o.employee_id },
      );
      const before = employeeSnapshot(employeeBefore, o);
      await c.execute(
        "UPDATE plantilla_occupancies SET status='Ended',date_to=:dateTo,ended_by=:userId,ended_at=NOW(),remarks=COALESCE(:remarks,remarks) WHERE id=:oid",
        { dateTo, userId: u.id, remarks: String(b.remarks || "").trim() || null, oid: o.id },
      );
      await c.execute(
        "UPDATE employees SET item_no=NULL WHERE id=:employeeId AND item_no=:itemNumber",
        { employeeId: o.employee_id, itemNumber: o.item_number },
      );
      const [[employeeAfter]] = await c.execute(
        "SELECT id,employee_no,department,position,item_no,emp_status FROM employees WHERE id=:employeeId",
        { employeeId: o.employee_id },
      );
      const after = employeeSnapshot(employeeAfter, null);
      await postedMovement(c, {
        employeeId: o.employee_id,
        actionType: "Other",
        effectiveDate: dateTo,
        endDate: dateTo,
        authorityNumber: null,
        targetPlantillaItemId: null,
        targetPositionId: null,
        targetSalaryGradeId: null,
        remarks: String(b.remarks || "").trim() || "Plantilla item vacated by direct action",
        before,
        after,
        userId: u.id,
        decisionRemarks: `Direct vacancy effective ${dateTo}`,
      });
      const item = await read(id, c);
      await history(
        c,
        id,
        "Vacated",
        { occupancyId: o.id, employeeId: o.employee_id, dateTo },
        u.id,
      );
      await c.commit();
      await logAudit(u.id, "plantilla.vacate", { id, employeeId: o.employee_id }, req);
      return json(res, 200, { item });
    } catch (e) {
      await c.rollback().catch(() => {});
      return fail(res, e);
    } finally {
      c.release();
    }
  };
  handlers.history = async (req, res, id) => {
    if (!(await requireEmployeeRead(req, res))) return;
    const [rs] = await pool.execute(
      "SELECT h.*,u.name changed_by_name FROM plantilla_item_history h LEFT JOIN users u ON u.id=h.changed_by WHERE plantilla_item_id=:id ORDER BY created_at DESC,id DESC",
      { id },
    );
    return json(res, 200, {
      history: rs.map((r) => ({
        id: Number(r.id),
        action: r.action,
        snapshot:
          typeof r.snapshot_json === "string" ? JSON.parse(r.snapshot_json) : r.snapshot_json,
        changedBy: r.changed_by_name || "",
        createdAt: r.created_at,
      })),
    });
  };
  return handlers;
}
