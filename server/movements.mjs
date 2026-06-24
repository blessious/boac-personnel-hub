import crypto from "node:crypto";

export const MOVEMENT_ACTION_TYPES = [
  "Original Appointment",
  "Promotion",
  "Transfer",
  "Renewal",
  "Reassignment",
  "Detail",
  "Designation",
  "Job Rotation",
  "Reclassification",
  "Step Increment",
  "Resignation",
  "Retirement",
  "Termination",
  "Death",
  "Other",
];
const ITEM_ACTIONS = new Set([
  "Original Appointment",
  "Promotion",
  "Transfer",
  "Reassignment",
  "Job Rotation",
  "Reclassification",
]);
const PROFILE_ACTIONS = new Set(["Detail", "Designation"]);
const SEPARATION_ACTIONS = new Set(["Resignation", "Retirement", "Termination", "Death"]);
const dateOnly = (value) => (value ? new Date(value).toISOString().slice(0, 10) : null);
const strictDate = (value, label, required = false) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    if (required) throw new Error(`${label} is required`);
    return null;
  }
  const text = String(value).trim();
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(text) ||
    Number.isNaN(new Date(`${text}T00:00:00Z`).getTime()) ||
    dateOnly(`${text}T00:00:00Z`) !== text
  ) {
    throw new Error(`${label} must be a valid YYYY-MM-DD date`);
  }
  return text;
};
const previousDate = (value) => {
  const day = new Date(`${value}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - 1);
  return day.toISOString().slice(0, 10);
};
const positiveId = (value, label, required = false) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    if (required) throw new Error(`${label} is required`);
    return null;
  }
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new Error(`Select a valid ${label}`);
  return id;
};

export async function initializeMovementSchema(pool, employeeIdDefinition) {
  await pool.query(`CREATE TABLE IF NOT EXISTS personnel_movements (
    id CHAR(36) NOT NULL PRIMARY KEY,
    control_number VARCHAR(80) NOT NULL,
    employee_id ${employeeIdDefinition},
    action_type VARCHAR(60) NOT NULL,
    status ENUM('Draft','Submitted','Reviewed','Approved','Posted','Rejected','Reversed') NOT NULL DEFAULT 'Draft',
    effective_date DATE NOT NULL,
    end_date DATE NULL,
    authority_number VARCHAR(160) NULL,
    authority_date DATE NULL,
    target_plantilla_item_id CHAR(36) NULL,
    target_position_id INT UNSIGNED NULL,
    target_salary_grade_id INT UNSIGNED NULL,
    target_department VARCHAR(200) NULL,
    remarks TEXT NULL,
    supporting_documents JSON NULL,
    source_snapshot_json JSON NOT NULL,
    posted_before_snapshot_json JSON NULL,
    posted_after_snapshot_json JSON NULL,
    prepared_by INT UNSIGNED NULL,
    submitted_by INT UNSIGNED NULL,
    reviewed_by INT UNSIGNED NULL,
    approved_by INT UNSIGNED NULL,
    posted_by INT UNSIGNED NULL,
    rejected_by INT UNSIGNED NULL,
    reversed_by INT UNSIGNED NULL,
    submitted_at DATETIME NULL,
    reviewed_at DATETIME NULL,
    approved_at DATETIME NULL,
    posted_at DATETIME NULL,
    rejected_at DATETIME NULL,
    reversed_at DATETIME NULL,
    decision_remarks TEXT NULL,
    reversal_reason TEXT NULL,
    version INT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_personnel_movement_control (control_number),
    INDEX idx_movement_employee_date (employee_id,effective_date),
    INDEX idx_movement_status_date (status,effective_date),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
    FOREIGN KEY (target_plantilla_item_id) REFERENCES plantilla_items(id) ON DELETE RESTRICT,
    FOREIGN KEY (target_position_id) REFERENCES positions(id) ON DELETE RESTRICT,
    FOREIGN KEY (target_salary_grade_id) REFERENCES salary_grades(id) ON DELETE RESTRICT,
    FOREIGN KEY (prepared_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (rejected_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (reversed_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB`);
  await pool.query(`CREATE TABLE IF NOT EXISTS personnel_movement_events (
    id CHAR(36) NOT NULL PRIMARY KEY,
    movement_id CHAR(36) NOT NULL,
    event_type VARCHAR(40) NOT NULL,
    from_status VARCHAR(20) NULL,
    to_status VARCHAR(20) NOT NULL,
    actor_id INT UNSIGNED NULL,
    remarks TEXT NULL,
    snapshot_json JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_movement_events (movement_id,created_at),
    FOREIGN KEY (movement_id) REFERENCES personnel_movements(id) ON DELETE RESTRICT,
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB`);
}

const MOVEMENT_SELECT = `SELECT m.*,
 CONCAT(e.lastname,', ',e.firstname) employee_name,e.employee_no,
 COALESCE(tp.title,ip.title) target_position_title,pi.item_number target_item_number,
 sg.grade target_grade,sg.step target_step,sg.amount target_salary,
 prep.name prepared_by_name,rev.name reviewed_by_name,app.name approved_by_name,post.name posted_by_name
 FROM personnel_movements m JOIN employees e ON e.id=m.employee_id
 LEFT JOIN positions tp ON tp.id=m.target_position_id
 LEFT JOIN plantilla_items pi ON pi.id=m.target_plantilla_item_id
 LEFT JOIN positions ip ON ip.id=pi.position_id
 LEFT JOIN salary_grades sg ON sg.id=m.target_salary_grade_id
 LEFT JOIN users prep ON prep.id=m.prepared_by LEFT JOIN users rev ON rev.id=m.reviewed_by
 LEFT JOIN users app ON app.id=m.approved_by LEFT JOIN users post ON post.id=m.posted_by`;
const parseJson = (value) => (typeof value === "string" ? JSON.parse(value || "null") : value);
const movementRow = (row) => ({
  id: row.id,
  controlNumber: row.control_number,
  employeeId: row.employee_id,
  employeeNo: row.employee_no,
  employeeName: row.employee_name,
  actionType: row.action_type,
  status: row.status,
  effectiveDate: dateOnly(row.effective_date),
  endDate: dateOnly(row.end_date),
  authorityNumber: row.authority_number || "",
  authorityDate: dateOnly(row.authority_date),
  targetPlantillaItemId: row.target_plantilla_item_id,
  targetItemNumber: row.target_item_number || "",
  targetPositionId: row.target_position_id ? Number(row.target_position_id) : null,
  targetPositionTitle: row.target_position_title || "",
  targetSalaryGradeId: row.target_salary_grade_id ? Number(row.target_salary_grade_id) : null,
  targetSalaryGrade: row.target_salary_grade_id
    ? {
        grade: Number(row.target_grade),
        step: Number(row.target_step),
        amount: Number(row.target_salary),
      }
    : null,
  targetDepartment: row.target_department || "",
  remarks: row.remarks || "",
  supportingDocuments: parseJson(row.supporting_documents) || [],
  sourceSnapshot: parseJson(row.source_snapshot_json),
  beforeSnapshot: parseJson(row.posted_before_snapshot_json),
  afterSnapshot: parseJson(row.posted_after_snapshot_json),
  preparedBy: row.prepared_by_name || "",
  reviewedBy: row.reviewed_by_name || "",
  approvedBy: row.approved_by_name || "",
  postedBy: row.posted_by_name || "",
  decisionRemarks: row.decision_remarks || "",
  reversalReason: row.reversal_reason || "",
  submittedAt: row.submitted_at,
  reviewedAt: row.reviewed_at,
  approvedAt: row.approved_at,
  postedAt: row.posted_at,
  rejectedAt: row.rejected_at,
  reversedAt: row.reversed_at,
  version: Number(row.version),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export function createMovementHandlers({
  pool,
  requireEmployeeRead,
  requireEmployeeWrite,
  requireApproval,
  readBody,
  json,
  logAudit,
}) {
  const read = async (id, connection = pool) => {
    const [rows] = await connection.execute(`${MOVEMENT_SELECT} WHERE m.id=:id LIMIT 1`, { id });
    return rows[0] ? movementRow(rows[0]) : null;
  };
  const currentSnapshot = async (employeeId, connection = pool, lock = false) => {
    const [[employee]] = await connection.execute(
      `SELECT id,employee_no,department,position,item_no,emp_status FROM employees WHERE id=:employeeId ${lock ? "FOR UPDATE" : ""}`,
      { employeeId },
    );
    if (!employee) throw new Error("Select a valid employee");
    const [[occupancy]] = await connection.execute(
      `SELECT po.id,po.plantilla_item_id,po.date_from,pi.item_number,pi.position_id,pi.salary_grade_id,pi.authorized_salary FROM plantilla_occupancies po JOIN plantilla_items pi ON pi.id=po.plantilla_item_id WHERE po.employee_id=:employeeId AND po.status='Active' ${lock ? "FOR UPDATE" : ""}`,
      { employeeId },
    );
    return {
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
            dateFrom: dateOnly(occupancy.date_from),
            positionId: Number(occupancy.position_id),
            salaryGradeId: occupancy.salary_grade_id ? Number(occupancy.salary_grade_id) : null,
            authorizedSalary:
              occupancy.authorized_salary === null ? null : Number(occupancy.authorized_salary),
          }
        : null,
    };
  };
  const event = (
    connection,
    movementId,
    eventType,
    fromStatus,
    toStatus,
    actorId,
    remarks,
    snapshot = null,
  ) =>
    connection.execute(
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
  const fail = (res, error) => {
    if (error?.code === "ER_DUP_ENTRY")
      return json(res, 409, {
        error:
          "The control number, employee assignment, or target occupancy conflicts with an existing record",
      });
    if (error instanceof Error && !error.code) return json(res, 400, { error: error.message });
    throw error;
  };
  const validate = async (body) => {
    const employeeId = String(body.employeeId || "").trim();
    if (!employeeId) throw new Error("Employee is required");
    const actionType = String(body.actionType || "").trim();
    if (!MOVEMENT_ACTION_TYPES.includes(actionType)) throw new Error("Select a valid action type");
    const effectiveDate = strictDate(body.effectiveDate, "Effective date", true);
    const endDate = strictDate(body.endDate, "End date");
    const authorityDate = strictDate(body.authorityDate, "Authority date");
    if (endDate && endDate < effectiveDate)
      throw new Error("End date cannot be earlier than effective date");
    const targetPlantillaItemId = String(body.targetPlantillaItemId || "").trim() || null;
    const targetPositionId = positiveId(body.targetPositionId, "target position");
    const targetSalaryGradeId = positiveId(body.targetSalaryGradeId, "target salary grade");
    if (ITEM_ACTIONS.has(actionType) && !targetPlantillaItemId)
      throw new Error(`${actionType} requires a target plantilla item`);
    if (PROFILE_ACTIONS.has(actionType) && !targetPositionId)
      throw new Error(`${actionType} requires a target position`);
    if (actionType === "Step Increment" && !targetSalaryGradeId)
      throw new Error("Step Increment requires a target salary grade and step");
    if (targetPlantillaItemId) {
      const [[item]] = await pool.execute(
        "SELECT id,item_status FROM plantilla_items WHERE id=:targetPlantillaItemId",
        { targetPlantillaItemId },
      );
      if (!item || item.item_status !== "Active")
        throw new Error("Select an active target plantilla item");
    }
    if (
      targetPositionId &&
      !(
        await pool.execute("SELECT id FROM positions WHERE id=:targetPositionId", {
          targetPositionId,
        })
      )[0][0]
    )
      throw new Error("Select a valid target position");
    if (
      targetSalaryGradeId &&
      !(
        await pool.execute("SELECT id FROM salary_grades WHERE id=:targetSalaryGradeId", {
          targetSalaryGradeId,
        })
      )[0][0]
    )
      throw new Error("Select a valid target salary grade");
    const documents = Array.isArray(body.supportingDocuments)
      ? body.supportingDocuments
          .map((x) => ({
            name: String(x.name || "")
              .trim()
              .slice(0, 200),
            reference: String(x.reference || "")
              .trim()
              .slice(0, 500),
          }))
          .filter((x) => x.name || x.reference)
          .slice(0, 20)
      : [];
    return {
      employeeId,
      actionType,
      effectiveDate,
      endDate,
      authorityNumber:
        String(body.authorityNumber || "")
          .trim()
          .slice(0, 160) || null,
      authorityDate,
      targetPlantillaItemId,
      targetPositionId,
      targetSalaryGradeId,
      targetDepartment:
        String(body.targetDepartment || "")
          .trim()
          .slice(0, 200) || null,
      remarks: String(body.remarks || "").trim() || null,
      supportingDocuments: JSON.stringify(documents),
    };
  };

  const handlers = {};
  handlers.list = async (req, res, url) => {
    if (!(await requireEmployeeRead(req, res))) return;
    const q = String(url.searchParams.get("q") || "").trim(),
      status = String(url.searchParams.get("status") || ""),
      actionType = String(url.searchParams.get("actionType") || "");
    const where = [],
      params = {};
    if (q) {
      where.push(
        "(m.control_number LIKE :q OR e.employee_no LIKE :q OR e.firstname LIKE :q OR e.lastname LIKE :q)",
      );
      params.q = `%${q}%`;
    }
    if (status && status !== "all") {
      where.push("m.status=:status");
      params.status = status;
    }
    if (actionType && actionType !== "all") {
      where.push("m.action_type=:actionType");
      params.actionType = actionType;
    }
    const [rows] = await pool.execute(
      MOVEMENT_SELECT +
        (where.length ? " WHERE " + where.join(" AND ") : "") +
        " ORDER BY m.created_at DESC,m.control_number DESC",
      params,
    );
    const [counts] = await pool.query(
      "SELECT status,COUNT(*) total FROM personnel_movements GROUP BY status",
    );
    return json(res, 200, {
      movements: rows.map(movementRow),
      summary: Object.fromEntries(counts.map((x) => [x.status, Number(x.total)])),
      actionTypes: MOVEMENT_ACTION_TYPES,
    });
  };
  handlers.events = async (req, res, id) => {
    if (!(await requireEmployeeRead(req, res))) return;
    const [rows] = await pool.execute(
      "SELECT ev.*,u.name actor_name FROM personnel_movement_events ev LEFT JOIN users u ON u.id=ev.actor_id WHERE movement_id=:id ORDER BY created_at DESC,id DESC",
      { id },
    );
    return json(res, 200, {
      events: rows.map((x) => ({
        id: x.id,
        eventType: x.event_type,
        fromStatus: x.from_status,
        toStatus: x.to_status,
        actor: x.actor_name || "System",
        remarks: x.remarks || "",
        createdAt: x.created_at,
      })),
    });
  };
  handlers.create = async (req, res) => {
    const user = await requireEmployeeWrite(req, res);
    if (!user) return;
    try {
      const body = await readBody(req),
        data = await validate(body),
        source = await currentSnapshot(data.employeeId);
      const id = crypto.randomUUID(),
        controlNumber =
          String(body.controlNumber || "")
            .trim()
            .toUpperCase() ||
          `PA-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      await pool.execute(
        `INSERT INTO personnel_movements(id,control_number,employee_id,action_type,effective_date,end_date,authority_number,authority_date,target_plantilla_item_id,target_position_id,target_salary_grade_id,target_department,remarks,supporting_documents,source_snapshot_json,prepared_by) VALUES(:id,:controlNumber,:employeeId,:actionType,:effectiveDate,:endDate,:authorityNumber,:authorityDate,:targetPlantillaItemId,:targetPositionId,:targetSalaryGradeId,:targetDepartment,:remarks,:supportingDocuments,:sourceSnapshot,:userId)`,
        { id, controlNumber, ...data, sourceSnapshot: JSON.stringify(source), userId: user.id },
      );
      await event(pool, id, "Created", null, "Draft", user.id, data.remarks, source);
      await logAudit(
        user.id,
        "movement.create",
        { id, controlNumber, employeeId: data.employeeId, actionType: data.actionType },
        req,
      );
      return json(res, 201, { movement: await read(id) });
    } catch (error) {
      return fail(res, error);
    }
  };
  handlers.update = async (req, res, id) => {
    const user = await requireEmployeeWrite(req, res);
    if (!user) return;
    const old = await read(id);
    if (!old) return json(res, 404, { error: "Personnel movement not found" });
    if (!["Draft", "Rejected"].includes(old.status))
      return json(res, 409, { error: "Only draft or rejected movements can be edited" });
    try {
      const body = await readBody(req),
        data = await validate(body),
        source = await currentSnapshot(data.employeeId);
      const controlNumber = String(body.controlNumber || old.controlNumber)
        .trim()
        .toUpperCase();
      await pool.execute(
        `UPDATE personnel_movements SET control_number=:controlNumber,employee_id=:employeeId,action_type=:actionType,effective_date=:effectiveDate,end_date=:endDate,authority_number=:authorityNumber,authority_date=:authorityDate,target_plantilla_item_id=:targetPlantillaItemId,target_position_id=:targetPositionId,target_salary_grade_id=:targetSalaryGradeId,target_department=:targetDepartment,remarks=:remarks,supporting_documents=:supportingDocuments,source_snapshot_json=:sourceSnapshot,status='Draft',decision_remarks=NULL,rejected_by=NULL,rejected_at=NULL,version=version+1 WHERE id=:id`,
        { id, controlNumber, ...data, sourceSnapshot: JSON.stringify(source) },
      );
      await event(pool, id, "Updated", old.status, "Draft", user.id, data.remarks, {
        before: old,
        source,
      });
      await logAudit(user.id, "movement.update", { id, controlNumber }, req);
      return json(res, 200, { movement: await read(id) });
    } catch (error) {
      return fail(res, error);
    }
  };
  handlers.transition = async (req, res, id, action) => {
    const approvalActions = new Set(["review", "approve", "reject", "return"]);
    const user = approvalActions.has(action)
      ? await requireApproval(req, res)
      : await requireEmployeeWrite(req, res);
    if (!user) return;
    const body = await readBody(req),
      remarks = String(body.remarks || "").trim();
    const rules = {
      submit: ["Draft", "Submitted"],
      review: ["Submitted", "Reviewed"],
      approve: ["Reviewed", "Approved"],
      reject: [["Submitted", "Reviewed", "Approved"], "Rejected"],
      return: [["Submitted", "Reviewed", "Approved"], "Draft"],
    };
    if (rules[action]) {
      const [fromAllowed, toStatus] = rules[action];
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [[row]] = await connection.execute(
          "SELECT * FROM personnel_movements WHERE id=:id FOR UPDATE",
          { id },
        );
        if (!row) {
          await connection.rollback();
          return json(res, 404, { error: "Personnel movement not found" });
        }
        const allowed = Array.isArray(fromAllowed) ? fromAllowed : [fromAllowed];
        if (!allowed.includes(row.status))
          throw new Error(`A ${row.status} movement cannot be ${action}ed`);
        if (action === "reject" && !remarks) throw new Error("Rejection remarks are required");
        if (action === "return" && !remarks)
          throw new Error("Return-to-draft remarks are required");
        const fields = {
          submit: "submitted",
          review: "reviewed",
          approve: "approved",
          reject: "rejected",
        };
        const source =
          action === "return" ? await currentSnapshot(row.employee_id, connection, true) : null;
        if (action === "return") {
          await connection.execute(
            `UPDATE personnel_movements
             SET status='Draft',
                 source_snapshot_json=:sourceSnapshot,
                 submitted_by=NULL,reviewed_by=NULL,approved_by=NULL,rejected_by=NULL,
                 submitted_at=NULL,reviewed_at=NULL,approved_at=NULL,rejected_at=NULL,
                 decision_remarks=:remarks,
                 version=version+1
             WHERE id=:id`,
            { id, sourceSnapshot: JSON.stringify(source), remarks },
          );
        } else {
          const prefix = fields[action];
          await connection.execute(
            `UPDATE personnel_movements SET status=:toStatus,${prefix}_by=:userId,${prefix}_at=NOW(),decision_remarks=:remarks WHERE id=:id`,
            { id, toStatus, userId: user.id, remarks: remarks || null },
          );
        }
        await event(
          connection,
          id,
          action === "return" ? "Returned to Draft" : action[0].toUpperCase() + action.slice(1),
          row.status,
          toStatus,
          user.id,
          remarks,
          source ? { refreshedSource: source } : null,
        );
        await connection.commit();
        await logAudit(
          user.id,
          `movement.${action}`,
          { id, fromStatus: row.status, toStatus },
          req,
        );
        return json(res, 200, { movement: await read(id) });
      } catch (error) {
        await connection.rollback().catch(() => {});
        return fail(res, error);
      } finally {
        connection.release();
      }
    }
    if (action === "post") return handlers.post(req, res, id, user, remarks);
    if (action === "reverse") return handlers.reverse(req, res, id, user, remarks);
    return json(res, 404, { error: "Unknown movement action" });
  };
  handlers.post = async (req, res, id, user, remarks) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [[movement]] = await connection.execute(
        "SELECT * FROM personnel_movements WHERE id=:id FOR UPDATE",
        { id },
      );
      if (!movement) {
        await connection.rollback();
        return json(res, 404, { error: "Personnel movement not found" });
      }
      if (movement.status !== "Approved") throw new Error("Only approved movements can be posted");
      const before = await currentSnapshot(movement.employee_id, connection, true),
        source = parseJson(movement.source_snapshot_json);
      const sourceMatches =
        ["id", "employeeNo", "department", "position", "itemNo", "empStatus"].every(
          (field) => before.employee[field] === source.employee[field],
        ) && before.occupancy?.id === source.occupancy?.id;
      if (!sourceMatches)
        throw new Error(
          "Employee or occupancy changed after this movement was prepared; return it to Draft and refresh the source record",
        );
      if (
        before.occupancy?.dateFrom &&
        dateOnly(movement.effective_date) < before.occupancy.dateFrom &&
        (ITEM_ACTIONS.has(movement.action_type) || SEPARATION_ACTIONS.has(movement.action_type))
      )
        throw new Error("Effective date cannot be earlier than the current occupancy start date");
      if (movement.action_type === "Original Appointment" && before.occupancy)
        throw new Error(
          "Original Appointment requires an employee without an active plantilla occupancy",
        );
      let postedOccupancyId = null,
        changedItem = null;
      if (ITEM_ACTIONS.has(movement.action_type)) {
        const [[target]] = await connection.execute(
          `SELECT pi.*,p.title position_title,COALESCE(sec.name,divi.name,off.name,s.name) organization_name FROM plantilla_items pi JOIN positions p ON p.id=pi.position_id LEFT JOIN hr_reference_values sec ON sec.id=pi.section_ref_id LEFT JOIN hr_reference_values divi ON divi.id=pi.division_ref_id LEFT JOIN hr_reference_values off ON off.id=pi.office_ref_id LEFT JOIN hr_reference_values s ON s.id=pi.sector_ref_id WHERE pi.id=:targetId FOR UPDATE`,
          { targetId: movement.target_plantilla_item_id },
        );
        if (!target || target.item_status !== "Active")
          throw new Error("Target plantilla item is no longer active");
        const [[busy]] = await connection.execute(
          "SELECT id FROM plantilla_occupancies WHERE plantilla_item_id=:targetId AND status='Active' FOR UPDATE",
          { targetId: target.id },
        );
        if (busy && busy.id !== before.occupancy?.id)
          throw new Error("Target plantilla item is already occupied");
        if (before.occupancy && before.occupancy.itemId !== target.id)
          await connection.execute(
            "UPDATE plantilla_occupancies SET status='Ended',date_to=:dateTo,ended_by=:userId,ended_at=NOW() WHERE id=:occupancyId",
            {
              dateTo: previousDate(dateOnly(movement.effective_date)),
              userId: user.id,
              occupancyId: before.occupancy.id,
            },
          );
        if (!before.occupancy || before.occupancy.itemId !== target.id) {
          postedOccupancyId = crypto.randomUUID();
          await connection.execute(
            "INSERT INTO plantilla_occupancies(id,plantilla_item_id,employee_id,date_from,movement_type,appointment_number,remarks,created_by) VALUES(:oid,:itemId,:employeeId,:dateFrom,:movementType,:authority,:remarks,:userId)",
            {
              oid: postedOccupancyId,
              itemId: target.id,
              employeeId: movement.employee_id,
              dateFrom: dateOnly(movement.effective_date),
              movementType: movement.action_type,
              authority: movement.authority_number,
              remarks: movement.remarks,
              userId: user.id,
            },
          );
        }
        await connection.execute(
          "UPDATE employees SET item_no=:itemNumber,position=:position,department=COALESCE(:department,department),emp_status='Active' WHERE id=:employeeId",
          {
            itemNumber: target.item_number,
            position: target.position_title,
            department: target.organization_name || movement.target_department,
            employeeId: movement.employee_id,
          },
        );
      } else if (SEPARATION_ACTIONS.has(movement.action_type)) {
        if (before.occupancy)
          await connection.execute(
            "UPDATE plantilla_occupancies SET status='Ended',date_to=:dateTo,ended_by=:userId,ended_at=NOW() WHERE id=:occupancyId",
            {
              dateTo: previousDate(dateOnly(movement.effective_date)),
              userId: user.id,
              occupancyId: before.occupancy.id,
            },
          );
        await connection.execute(
          "UPDATE employees SET item_no=NULL,emp_status='Inactive' WHERE id=:employeeId",
          { employeeId: movement.employee_id },
        );
      } else if (PROFILE_ACTIONS.has(movement.action_type)) {
        const [[position]] = await connection.execute("SELECT title FROM positions WHERE id=:id", {
          id: movement.target_position_id,
        });
        if (!position) throw new Error("Target position no longer exists");
        await connection.execute(
          "UPDATE employees SET position=:position,department=COALESCE(:department,department) WHERE id=:employeeId",
          {
            position: position.title,
            department: movement.target_department,
            employeeId: movement.employee_id,
          },
        );
      } else if (movement.action_type === "Step Increment") {
        if (!before.occupancy)
          throw new Error("Step Increment requires an active plantilla occupancy");
        const [[grade]] = await connection.execute(
          "SELECT id,amount FROM salary_grades WHERE id=:id",
          { id: movement.target_salary_grade_id },
        );
        if (!grade) throw new Error("Target salary grade no longer exists");
        changedItem = {
          itemId: before.occupancy.itemId,
          salaryGradeId: before.occupancy.salaryGradeId,
          authorizedSalary: before.occupancy.authorizedSalary,
        };
        await connection.execute(
          "UPDATE plantilla_items SET salary_grade_id=:gradeId,authorized_salary=:amount,updated_by=:userId WHERE id=:itemId",
          {
            gradeId: grade.id,
            amount: grade.amount,
            userId: user.id,
            itemId: before.occupancy.itemId,
          },
        );
      }
      const after = await currentSnapshot(movement.employee_id, connection, false);
      after.postedOccupancyId = postedOccupancyId;
      after.changedItem = changedItem;
      await connection.execute(
        "UPDATE personnel_movements SET status='Posted',posted_by=:userId,posted_at=NOW(),posted_before_snapshot_json=:before,posted_after_snapshot_json=:after,decision_remarks=COALESCE(:remarks,decision_remarks) WHERE id=:id",
        {
          id,
          userId: user.id,
          before: JSON.stringify(before),
          after: JSON.stringify(after),
          remarks: remarks || null,
        },
      );
      await event(connection, id, "Posted", "Approved", "Posted", user.id, remarks, {
        before,
        after,
      });
      await connection.commit();
      await logAudit(
        user.id,
        "movement.post",
        { id, employeeId: movement.employee_id, actionType: movement.action_type },
        req,
      );
      return json(res, 200, { movement: await read(id) });
    } catch (error) {
      await connection.rollback().catch(() => {});
      return fail(res, error);
    } finally {
      connection.release();
    }
  };
  handlers.reverse = async (req, res, id, user, reason) => {
    if (!reason) return json(res, 400, { error: "Reversal reason is required" });
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [[movement]] = await connection.execute(
        "SELECT * FROM personnel_movements WHERE id=:id FOR UPDATE",
        { id },
      );
      if (!movement) {
        await connection.rollback();
        return json(res, 404, { error: "Personnel movement not found" });
      }
      if (movement.status !== "Posted") throw new Error("Only posted movements can be reversed");
      const [[later]] = await connection.execute(
        "SELECT id FROM personnel_movements WHERE employee_id=:employeeId AND status='Posted' AND posted_at>:postedAt LIMIT 1 FOR UPDATE",
        { employeeId: movement.employee_id, postedAt: movement.posted_at },
      );
      if (later) throw new Error("Reverse later posted movements for this employee first");
      const before = parseJson(movement.posted_before_snapshot_json),
        after = parseJson(movement.posted_after_snapshot_json),
        current = await currentSnapshot(movement.employee_id, connection, true);
      const currentMatchesPosted =
        ["id", "employeeNo", "department", "position", "itemNo", "empStatus"].every(
          (field) => current.employee[field] === after.employee[field],
        ) && current.occupancy?.id === after.occupancy?.id;
      if (!currentMatchesPosted)
        throw new Error(
          "Current employee or occupancy no longer matches this posted action; automatic reversal is unsafe",
        );
      if (after.postedOccupancyId)
        await connection.execute(
          "UPDATE plantilla_occupancies SET status='Ended',date_to=CURDATE(),ended_by=:userId,ended_at=NOW(),remarks=CONCAT(COALESCE(remarks,''),' [Reversed]') WHERE id=:id AND status='Active'",
          { id: after.postedOccupancyId, userId: user.id },
        );
      if (before.occupancy && before.occupancy.id !== after.occupancy?.id)
        await connection.execute(
          "UPDATE plantilla_occupancies SET status='Active',date_to=NULL,ended_by=NULL,ended_at=NULL WHERE id=:id",
          { id: before.occupancy.id },
        );
      if (after.changedItem)
        await connection.execute(
          "UPDATE plantilla_items SET salary_grade_id=:salaryGradeId,authorized_salary=:authorizedSalary,updated_by=:userId WHERE id=:itemId",
          { ...after.changedItem, userId: user.id },
        );
      await connection.execute(
        "UPDATE employees SET department=:department,position=:position,item_no=:itemNo,emp_status=:empStatus WHERE id=:employeeId",
        { ...before.employee, employeeId: movement.employee_id },
      );
      await connection.execute(
        "UPDATE personnel_movements SET status='Reversed',reversed_by=:userId,reversed_at=NOW(),reversal_reason=:reason WHERE id=:id",
        { id, userId: user.id, reason },
      );
      await event(connection, id, "Reversed", "Posted", "Reversed", user.id, reason, {
        restored: before,
      });
      await connection.commit();
      await logAudit(
        user.id,
        "movement.reverse",
        { id, employeeId: movement.employee_id, reason },
        req,
      );
      return json(res, 200, { movement: await read(id) });
    } catch (error) {
      await connection.rollback().catch(() => {});
      return fail(res, error);
    } finally {
      connection.release();
    }
  };
  return handlers;
}
