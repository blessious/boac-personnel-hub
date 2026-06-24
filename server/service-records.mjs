import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const day = (value) => {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
const strictDate = (v, label, required = false) => {
  if (v == null || String(v).trim() === "") {
    if (required) throw Error(`${label} is required`);
    return null;
  }
  const x = String(v).trim();
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(x) ||
    Number.isNaN(new Date(`${x}T00:00:00Z`).getTime()) ||
    day(`${x}T00:00:00Z`) !== x
  )
    throw Error(`${label} must be a valid YYYY-MM-DD date`);
  return x;
};
const addDays = (v, n) => {
  const d = new Date(`${v}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const jsonValue = (v) => (typeof v === "string" ? JSON.parse(v || "null") : v);
const overlaps = (aFrom, aTo, bFrom, bTo) =>
  aFrom <= (bTo || "9999-12-31") && bFrom <= (aTo || "9999-12-31");

export async function initializeServiceRecordSchema(pool, employeeIdDefinition) {
  await pool.query(`CREATE TABLE IF NOT EXISTS service_record_entries (
  id CHAR(36) NOT NULL PRIMARY KEY, employee_id ${employeeIdDefinition}, service_from DATE NOT NULL, service_to DATE NULL,
  position_title VARCHAR(200) NOT NULL, department VARCHAR(200) NULL, agency VARCHAR(200) NULL,
  appointment_status VARCHAR(80) NULL, annual_salary DECIMAL(12,2) NULL, salary_grade INT UNSIGNED NULL, salary_step INT UNSIGNED NULL,
  item_number VARCHAR(120) NULL, branch VARCHAR(120) NULL, leave_without_pay VARCHAR(120) NULL,
  separation_date DATE NULL, separation_cause VARCHAR(200) NULL, remarks TEXT NULL,
  created_by INT UNSIGNED NULL, updated_by INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_service_record_employee_period(employee_id,service_from,service_to),
  FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE SET NULL
 ) ENGINE=InnoDB`);
}

function stateFrom(snapshot, meta = {}, gradeMap = new Map()) {
  const e = snapshot?.employee || {},
    o = snapshot?.occupancy || {};
  const grade = gradeMap.get(Number(o.salaryGradeId));
  return {
    positionTitle: e.position || "",
    department: e.department || "",
    appointmentStatus: meta.actionType || "",
    annualSalary: o.authorizedSalary ?? null,
    salaryGrade: grade?.grade ?? null,
    salaryStep: grade?.step ?? null,
    itemNumber: e.itemNo || o.itemNumber || "",
    branch: "",
    leaveWithoutPay: "",
    separationDate: null,
    separationCause: "",
    remarks: meta.authorityNumber ? `Authority: ${meta.authorityNumber}` : "",
  };
}
function automaticRows(employee, movements, gradeMap) {
  if (!movements.length) {
    const start = day(employee.date_employed) || day(employee.date_hired);
    return start
      ? [
          {
            id: `auto-current-${employee.id}`,
            employeeId: employee.id,
            serviceFrom: start,
            serviceTo: null,
            positionTitle: employee.position,
            department: employee.department,
            agency: "",
            appointmentStatus: employee.status || "",
            annualSalary: null,
            salaryGrade: null,
            salaryStep: null,
            itemNumber: employee.item_no || "",
            branch: "",
            leaveWithoutPay: "",
            separationDate: null,
            separationCause: "",
            remarks: "Current employee record (no posted movement history)",
            source: "Automatic",
            movementId: null,
          },
        ]
      : [];
  }
  const first = movements[0],
    source = jsonValue(first.source_snapshot_json),
    events = [];
  const baseStart =
    source?.occupancy?.dateFrom ||
    day(employee.date_employed) ||
    day(employee.date_hired) ||
    day(first.effective_date);
  events.push({
    date: baseStart,
    state: stateFrom(source, { actionType: employee.status || "Initial Service" }, gradeMap),
    movementId: null,
  });
  for (const m of movements) {
    const before = jsonValue(m.posted_before_snapshot_json),
      after = jsonValue(m.posted_after_snapshot_json),
      effective = day(m.effective_date),
      separation = ["Resignation", "Retirement", "Termination", "Death"].includes(m.action_type);
    events.push({
      date: effective,
      state: separation
        ? null
        : stateFrom(
            after,
            { actionType: m.action_type, authorityNumber: m.authority_number },
            gradeMap,
          ),
      movementId: m.id,
      separationCause: separation ? m.action_type : "",
    });
    if (["Detail", "Designation"].includes(m.action_type) && m.end_date) {
      events.push({
        date: addDays(day(m.end_date), 1),
        state: stateFrom(before, { actionType: "Resumed Assignment" }, gradeMap),
        movementId: m.id,
      });
    }
  }
  events.sort((a, b) => a.date.localeCompare(b.date));
  const rows = [];
  let current = null;
  for (const ev of events) {
    if (current && current.date < ev.date) {
      const to = addDays(ev.date, -1);
      rows.push({
        ...current.state,
        id: `auto-${current.movementId || "base"}-${current.date}`,
        employeeId: employee.id,
        serviceFrom: current.date,
        serviceTo: to,
        agency: "",
        source: "Automatic",
        movementId: current.movementId,
        separationDate: ev.separationCause ? ev.date : null,
        separationCause: ev.separationCause || "",
      });
    }
    current = ev.state ? { date: ev.date, state: ev.state, movementId: ev.movementId } : null;
  }
  if (current)
    rows.push({
      ...current.state,
      id: `auto-${current.movementId || "base"}-${current.date}`,
      employeeId: employee.id,
      serviceFrom: current.date,
      serviceTo: null,
      agency: "",
      source: "Automatic",
      movementId: current.movementId,
    });
  return rows.filter((r) => !r.serviceTo || r.serviceTo >= r.serviceFrom);
}
const legacyRow = (row) => {
  const payload = jsonValue(row.payload) || {};
  const salary = String(payload.salary || "").replace(/[^0-9.-]/g, "");
  return {
    id: `legacy-${row.id}`,
    employeeId: row.employee_id,
    serviceFrom: day(payload.from),
    serviceTo: day(payload.to),
    positionTitle: String(payload.designation || "Legacy service record"),
    department: String(payload.department || ""),
    agency: String(payload.assignment || ""),
    appointmentStatus: String(payload.status || ""),
    annualSalary: salary && Number.isFinite(Number(salary)) ? Number(salary) : null,
    salaryGrade: null,
    salaryStep: null,
    itemNumber: "",
    branch: String(payload.branch || ""),
    leaveWithoutPay: String(payload.leave || ""),
    separationDate: day(payload.sepDate),
    separationCause: String(payload.sepCause || ""),
    remarks: "Imported from the existing employee Service Record section",
    source: "Legacy",
    movementId: null,
  };
};
const manualRow = (r) => ({
  id: r.id,
  employeeId: r.employee_id,
  serviceFrom: day(r.service_from),
  serviceTo: day(r.service_to),
  positionTitle: r.position_title,
  department: r.department || "",
  agency: r.agency || "",
  appointmentStatus: r.appointment_status || "",
  annualSalary: r.annual_salary == null ? null : Number(r.annual_salary),
  salaryGrade: r.salary_grade == null ? null : Number(r.salary_grade),
  salaryStep: r.salary_step == null ? null : Number(r.salary_step),
  itemNumber: r.item_number || "",
  branch: r.branch || "",
  leaveWithoutPay: r.leave_without_pay || "",
  separationDate: day(r.separation_date),
  separationCause: r.separation_cause || "",
  remarks: r.remarks || "",
  source: "Manual",
  movementId: null,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export function createServiceRecordHandlers({
  pool,
  requireUser,
  requireEmployeeWrite,
  readBody,
  json,
  logAudit,
  runPython,
  previewDir,
  exportScript,
  sendFile,
}) {
  const authorize = async (req, res, employeeId) => {
    const u = await requireUser(req, res);
    if (!u) return null;
    if (!["Super Admin", "HR", "Approver", "Viewer"].includes(u.role) && u.employeeId !== employeeId) {
      json(res, 403, { error: "You can only view your own service record" });
      return null;
    }
    return u;
  };
  const build = async (employeeId) => {
    const [[employee]] = await pool.execute(
      "SELECT * FROM employees WHERE id=:employeeId LIMIT 1",
      { employeeId },
    );
    if (!employee) throw Object.assign(Error("Employee not found"), { statusCode: 404 });
    const [movementRows] = await pool.execute(
      "SELECT * FROM personnel_movements WHERE employee_id=:employeeId AND status='Posted' ORDER BY effective_date,posted_at,id",
      { employeeId },
    );
    const [legacy] = await pool.execute(
      "SELECT id,employee_id,payload FROM employee_service_records WHERE employee_id=:employeeId ORDER BY created_at,id",
      { employeeId },
    );
    const [manual] = await pool.execute(
      "SELECT * FROM service_record_entries WHERE employee_id=:employeeId ORDER BY service_from,id",
      { employeeId },
    );
    const [gradeRows] = await pool.query("SELECT id,grade,step FROM salary_grades");
    const gradeMap = new Map(
      gradeRows.map((row) => [
        Number(row.id),
        { grade: Number(row.grade), step: Number(row.step) },
      ]),
    );
    const automatic = automaticRows(employee, movementRows, gradeMap);
    const manualMapped = manual.map(manualRow);
    const records = [...manualMapped, ...automatic].sort(
      (a, b) => a.serviceFrom.localeCompare(b.serviceFrom) || a.source.localeCompare(b.source),
    );
    const warnings = [];
    for (let i = 0; i < records.length; i++)
      for (let j = i + 1; j < records.length; j++)
        if (
          overlaps(
            records[i].serviceFrom,
            records[i].serviceTo,
            records[j].serviceFrom,
            records[j].serviceTo,
          )
        )
          warnings.push(
            `Overlapping periods: ${records[i].serviceFrom} (${records[i].source}) and ${records[j].serviceFrom} (${records[j].source})`,
          );
    return { employee, records, warnings };
  };
  const payload = (b) => {
    const serviceFrom = strictDate(b.serviceFrom, "Service-from date", true),
      serviceTo = strictDate(b.serviceTo, "Service-to date"),
      separationDate = strictDate(b.separationDate, "Separation date");
    if (serviceTo && serviceTo < serviceFrom)
      throw Error("Service-to date cannot be earlier than service-from date");
    if (separationDate && separationDate < serviceFrom)
      throw Error("Separation date cannot be earlier than service-from date");
    const positionTitle = String(b.positionTitle || "").trim();
    if (!positionTitle) throw Error("Position/designation is required");
    const annualSalary =
      b.annualSalary == null || b.annualSalary === "" ? null : Number(b.annualSalary);
    if (annualSalary !== null && (!Number.isFinite(annualSalary) || annualSalary < 0))
      throw Error("Annual salary must be non-negative");
    const integer = (v, n) =>
      v == null || v === ""
        ? null
        : Number.isInteger(Number(v)) && Number(v) >= 0
          ? Number(v)
          : (() => {
              throw Error(`${n} must be a non-negative whole number`);
            })();
    return {
      serviceFrom,
      serviceTo,
      positionTitle: positionTitle.slice(0, 200),
      department:
        String(b.department || "")
          .trim()
          .slice(0, 200) || null,
      agency:
        String(b.agency || "")
          .trim()
          .slice(0, 200) || null,
      appointmentStatus:
        String(b.appointmentStatus || "")
          .trim()
          .slice(0, 80) || null,
      annualSalary,
      salaryGrade: integer(b.salaryGrade, "Salary grade"),
      salaryStep: integer(b.salaryStep, "Salary step"),
      itemNumber:
        String(b.itemNumber || "")
          .trim()
          .slice(0, 120) || null,
      branch:
        String(b.branch || "")
          .trim()
          .slice(0, 120) || null,
      leaveWithoutPay:
        String(b.leaveWithoutPay || "")
          .trim()
          .slice(0, 120) || null,
      separationDate,
      separationCause:
        String(b.separationCause || "")
          .trim()
          .slice(0, 200) || null,
      remarks: String(b.remarks || "").trim() || null,
    };
  };
  const checkOverlap = async (employeeId, p, excludeId = null) => {
    const data = await build(employeeId);
    const conflict = data.records.find(
      (r) => r.id !== excludeId && overlaps(p.serviceFrom, p.serviceTo, r.serviceFrom, r.serviceTo),
    );
    if (conflict)
      throw Error(
        `Service period overlaps ${conflict.source.toLowerCase()} record beginning ${conflict.serviceFrom}`,
      );
  };
  const handlers = {};
  handlers.list = async (req, res, employeeId) => {
    const u = await authorize(req, res, employeeId);
    if (!u) return;
    try {
      return json(res, 200, await build(employeeId));
    } catch (e) {
      return json(res, e.statusCode || 400, { error: e.message });
    }
  };
  handlers.create = async (req, res, employeeId) => {
    const u = await requireEmployeeWrite(req, res);
    if (!u) return;
    try {
      const p = payload(await readBody(req));
      await checkOverlap(employeeId, p);
      const id = crypto.randomUUID();
      await pool.execute(
        `INSERT INTO service_record_entries(id,employee_id,service_from,service_to,position_title,department,agency,appointment_status,annual_salary,salary_grade,salary_step,item_number,branch,leave_without_pay,separation_date,separation_cause,remarks,created_by,updated_by) VALUES(:id,:employeeId,:serviceFrom,:serviceTo,:positionTitle,:department,:agency,:appointmentStatus,:annualSalary,:salaryGrade,:salaryStep,:itemNumber,:branch,:leaveWithoutPay,:separationDate,:separationCause,:remarks,:userId,:userId)`,
        { id, employeeId, ...p, userId: u.id },
      );
      await logAudit(
        u.id,
        "service_record.create",
        { id, employeeId, period: [p.serviceFrom, p.serviceTo] },
        req,
      );
      return json(res, 201, {
        entry: manualRow(
          (await pool.execute("SELECT * FROM service_record_entries WHERE id=:id", { id }))[0][0],
        ),
      });
    } catch (e) {
      return json(res, 400, { error: e.message });
    }
  };
  handlers.update = async (req, res, id) => {
    const u = await requireEmployeeWrite(req, res);
    if (!u) return;
    const [[old]] = await pool.execute("SELECT * FROM service_record_entries WHERE id=:id", { id });
    if (!old) return json(res, 404, { error: "Manual service record not found" });
    try {
      const p = payload(await readBody(req));
      await checkOverlap(old.employee_id, p, id);
      await pool.execute(
        `UPDATE service_record_entries SET service_from=:serviceFrom,service_to=:serviceTo,position_title=:positionTitle,department=:department,agency=:agency,appointment_status=:appointmentStatus,annual_salary=:annualSalary,salary_grade=:salaryGrade,salary_step=:salaryStep,item_number=:itemNumber,branch=:branch,leave_without_pay=:leaveWithoutPay,separation_date=:separationDate,separation_cause=:separationCause,remarks=:remarks,updated_by=:userId WHERE id=:id`,
        { id, ...p, userId: u.id },
      );
      await logAudit(u.id, "service_record.update", { id, employeeId: old.employee_id }, req);
      return json(res, 200, {
        entry: manualRow(
          (await pool.execute("SELECT * FROM service_record_entries WHERE id=:id", { id }))[0][0],
        ),
      });
    } catch (e) {
      return json(res, 400, { error: e.message });
    }
  };
  handlers.remove = async (req, res, id) => {
    const u = await requireEmployeeWrite(req, res);
    if (!u) return;
    const [[old]] = await pool.execute(
      "SELECT employee_id FROM service_record_entries WHERE id=:id",
      { id },
    );
    if (!old) return json(res, 404, { error: "Manual service record not found" });
    await pool.execute("DELETE FROM service_record_entries WHERE id=:id", { id });
    await logAudit(u.id, "service_record.delete", { id, employeeId: old.employee_id }, req);
    return json(res, 200, { ok: true });
  };
  handlers.export = async (req, res, employeeId, format) => {
    const u = await authorize(req, res, employeeId);
    if (!u) return;
    if (!["xlsx", "pdf"].includes(format)) return json(res, 400, { error: "Unsupported format" });
    try {
      const data = await build(employeeId);
      const [[agency]] = await pool.query("SELECT name,tagline FROM agency_settings WHERE id=1");
      await fs.mkdir(previewDir, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, "-"),
        safe = `${data.employee.lastname}-${data.employee.firstname}`.replace(
          /[^A-Za-z0-9_-]/g,
          "-",
        );
      const fileName = `service-record-${employeeId}-${safe}-${stamp}.${format}`,
        input = path.join(previewDir, `${fileName}.json`),
        output = path.join(previewDir, fileName);
      await fs.writeFile(
        input,
        JSON.stringify({
          agency,
          employee: data.employee,
          records: data.records,
          warnings: data.warnings,
          generatedAt: new Date().toISOString(),
          notice: "GENERIC SERVICE RECORD - NOT THE OFFICIAL STRH TEMPLATE",
        }),
        "utf8",
      );
      try {
        await runPython([exportScript, input, output, format]);
      } finally {
        await fs.rm(input, { force: true }).catch(() => {});
      }
      await logAudit(u.id, `service_record.${format}_generate`, { employeeId, fileName }, req);
      return json(res, 200, {
        fileName,
        downloadUrl: `/api/service-records/files/${encodeURIComponent(fileName)}`,
      });
    } catch (e) {
      return json(res, e.statusCode || 500, { error: e.message });
    }
  };
  handlers.file = async (req, res, fileName) => {
    const decoded = decodeURIComponent(fileName);
    const match = decoded.match(/^service-record-([A-Fa-f0-9-]{36})-[A-Za-z0-9_.-]+\.(xlsx|pdf)$/);
    if (!match) return json(res, 400, { error: "Invalid service-record file name" });
    const u = await authorize(req, res, match[1]);
    if (!u) return;
    const resolved = path.resolve(previewDir, decoded);
    if (!resolved.startsWith(path.resolve(previewDir)))
      return json(res, 400, { error: "Invalid file path" });
    try {
      await fs.access(resolved);
    } catch {
      return json(res, 404, { error: "Service-record file not found" });
    }
    await logAudit(u.id, "service_record.download", { fileName: decoded }, req);
    return sendFile(res, resolved, decoded);
  };
  return handlers;
}
