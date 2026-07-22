import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const number = (value) => Number(value || 0);
const text = (value, fallback = "Unspecified") => {
  const trimmed = String(value ?? "").trim();
  return trimmed || fallback;
};

function rowsToSeries(rows, labelKey = "label", valueKey = "total") {
  return rows.map((row) => ({
    label: text(row[labelKey]),
    total: number(row[valueKey]),
  }));
}

function normalizeFileName(value) {
  return String(value || "")
    .replace(/[^A-Za-z0-9_.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function dateStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function tableExists(pool, table) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = :table`,
    { table },
  );
  return number(rows[0]?.total) > 0;
}

async function buildPersonnelPlantillaReport(pool) {
  const hasPlantilla = await tableExists(pool, "plantilla_items");
  const [[employeeTotals]] = await pool.query(`
    SELECT
      COUNT(*) AS total,
      SUM(po.employee_id IS NOT NULL OR ne.employee_id IS NOT NULL) AS active,
      SUM(po.employee_id IS NULL AND ne.employee_id IS NULL) AS inactive,
      SUM(po.employee_id IS NOT NULL) AS regular,
      SUM(ne.employee_id IS NOT NULL) AS nonPlantilla
    FROM employees e
    LEFT JOIN (SELECT DISTINCT employee_id FROM plantilla_occupancies WHERE status='Active') po ON po.employee_id=e.id
    LEFT JOIN (SELECT DISTINCT employee_id FROM non_plantilla_engagements WHERE status='Active') ne ON ne.employee_id=e.id
  `);

  const [byDepartment] = await pool.query(`
    SELECT COALESCE(NULLIF(TRIM(department), ''), 'Unspecified') AS label,
           SUM(emp_status = 'Active') AS active,
           SUM(emp_status <> 'Active') AS inactive,
           COUNT(*) AS total
    FROM employees
    GROUP BY COALESCE(NULLIF(TRIM(department), ''), 'Unspecified')
    ORDER BY total DESC, label ASC
    LIMIT 12
  `);

  const [byEmploymentStatus] = await pool.query(`
    SELECT COALESCE(NULLIF(TRIM(status), ''), 'Unspecified') AS label,
           SUM(emp_status = 'Active') AS active,
           SUM(emp_status <> 'Active') AS inactive,
           COUNT(*) AS total
    FROM employees
    GROUP BY COALESCE(NULLIF(TRIM(status), ''), 'Unspecified')
    ORDER BY total DESC, label ASC
  `);

  const [byLevel] = await pool.query(`
    SELECT COALESCE(NULLIF(TRIM(level), ''), 'Unspecified') AS label,
           COUNT(*) AS total
    FROM employees
    GROUP BY COALESCE(NULLIF(TRIM(level), ''), 'Unspecified')
    ORDER BY total DESC, label ASC
  `);

  const [byGender] = await pool.query(`
    SELECT COALESCE(NULLIF(TRIM(gender), ''), 'Unspecified') AS label,
           COUNT(*) AS total
    FROM employees
    GROUP BY COALESCE(NULLIF(TRIM(gender), ''), 'Unspecified')
    ORDER BY total DESC, label ASC
  `);

  const [byCivilStatus] = await pool.query(`
    SELECT COALESCE(NULLIF(TRIM(civil_status), ''), 'Unspecified') AS label,
           COUNT(*) AS total
    FROM employees
    GROUP BY COALESCE(NULLIF(TRIM(civil_status), ''), 'Unspecified')
    ORDER BY total DESC, label ASC
  `);

  const [byAgeGroup] = await pool.query(`
    SELECT
      CASE
        WHEN birthday IS NULL THEN 'Unspecified'
        WHEN TIMESTAMPDIFF(YEAR, birthday, CURDATE()) < 30 THEN 'Under 30'
        WHEN TIMESTAMPDIFF(YEAR, birthday, CURDATE()) BETWEEN 30 AND 39 THEN '30-39'
        WHEN TIMESTAMPDIFF(YEAR, birthday, CURDATE()) BETWEEN 40 AND 49 THEN '40-49'
        WHEN TIMESTAMPDIFF(YEAR, birthday, CURDATE()) BETWEEN 50 AND 59 THEN '50-59'
        ELSE '60+'
      END AS label,
      COUNT(*) AS total
    FROM employees
    GROUP BY label
    ORDER BY FIELD(label, 'Under 30', '30-39', '40-49', '50-59', '60+', 'Unspecified')
  `);

  const [topPositions] = await pool.query(`
    SELECT COALESCE(NULLIF(TRIM(position), ''), 'Unspecified') AS label,
           COUNT(*) AS total
    FROM employees
    GROUP BY COALESCE(NULLIF(TRIM(position), ''), 'Unspecified')
    ORDER BY total DESC, label ASC
    LIMIT 15
  `);

  let plantillaSummary = {
    authorized: 0,
    active: 0,
    inactive: 0,
    occupied: 0,
    vacant: 0,
    vacancyRate: 0,
  };
  let plantillaByDivision = [];
  let plantillaBySalaryGrade = [];
  let plantillaItems = [];

  if (hasPlantilla) {
    const [[summary]] = await pool.query(`
      SELECT COUNT(*) AS authorized,
             SUM(pi.item_status = 'Active') AS active,
             SUM(pi.item_status <> 'Active') AS inactive,
             SUM(pi.item_status = 'Active' AND po.id IS NOT NULL) AS occupied,
             SUM(pi.item_status = 'Active' AND po.id IS NULL) AS vacant
      FROM plantilla_items pi
      LEFT JOIN plantilla_occupancies po ON po.plantilla_item_id = pi.id AND po.status = 'Active'
    `);
    plantillaSummary = {
      authorized: number(summary.authorized),
      active: number(summary.active),
      inactive: number(summary.inactive),
      occupied: number(summary.occupied),
      vacant: number(summary.vacant),
      vacancyRate: number(summary.active)
        ? Math.round((number(summary.vacant) / number(summary.active)) * 1000) / 10
        : 0,
    };

    const [divisionRows] = await pool.query(`
      SELECT COALESCE(NULLIF(TRIM(d.name), ''), COALESCE(NULLIF(TRIM(pi.notes), ''), 'Unspecified')) AS label,
             SUM(pi.item_status = 'Active') AS active,
             SUM(pi.item_status = 'Active' AND po.id IS NOT NULL) AS occupied,
             SUM(pi.item_status = 'Active' AND po.id IS NULL) AS vacant,
             COUNT(*) AS total
      FROM plantilla_items pi
      LEFT JOIN plantilla_occupancies po ON po.plantilla_item_id = pi.id AND po.status = 'Active'
      LEFT JOIN hr_reference_values d ON d.id = pi.division_ref_id
      GROUP BY COALESCE(NULLIF(TRIM(d.name), ''), COALESCE(NULLIF(TRIM(pi.notes), ''), 'Unspecified'))
      ORDER BY vacant DESC, total DESC, label ASC
      LIMIT 12
    `);
    plantillaByDivision = divisionRows.map((row) => ({
      label: text(row.label),
      active: number(row.active),
      occupied: number(row.occupied),
      vacant: number(row.vacant),
      total: number(row.total),
    }));

    const [salaryRows] = await pool.query(`
      SELECT COALESCE(CAST(sg.grade AS CHAR), 'Unspecified') AS label,
             SUM(pi.item_status = 'Active') AS active,
             SUM(pi.item_status = 'Active' AND po.id IS NOT NULL) AS occupied,
             SUM(pi.item_status = 'Active' AND po.id IS NULL) AS vacant,
             COUNT(*) AS total
      FROM plantilla_items pi
      LEFT JOIN plantilla_occupancies po ON po.plantilla_item_id = pi.id AND po.status = 'Active'
      LEFT JOIN salary_grades sg ON sg.id = pi.salary_grade_id
      GROUP BY COALESCE(CAST(sg.grade AS CHAR), 'Unspecified')
      ORDER BY CAST(label AS UNSIGNED), label
    `);
    plantillaBySalaryGrade = salaryRows.map((row) => ({
      label: text(row.label),
      active: number(row.active),
      occupied: number(row.occupied),
      vacant: number(row.vacant),
      total: number(row.total),
    }));

    const [items] = await pool.query(`
      SELECT pi.item_number AS itemNumber,
             p.title AS positionTitle,
             sg.grade AS salaryGrade,
             sg.step AS salaryStep,
             sg.amount AS salaryAmount,
             COALESCE(d.name, '') AS division,
             COALESCE(se.name, '') AS section,
             COALESCE(pt.name, '') AS plantillaType,
             pi.item_status AS itemStatus,
             CASE WHEN po.id IS NULL THEN 'Vacant' ELSE 'Occupied' END AS occupancyStatus,
             TRIM(CONCAT_WS(' ',
               NULLIF(TRIM(e.firstname), ''),
               CASE
                 WHEN CHAR_LENGTH(TRIM(COALESCE(e.middlename, ''))) = 1
                   THEN CONCAT(UPPER(TRIM(e.middlename)), '.')
                 ELSE NULLIF(TRIM(e.middlename), '')
               END,
               NULLIF(TRIM(e.lastname), ''),
               NULLIF(TRIM(e.name_ext), '')
             )) AS occupantName,
             e.employee_no AS occupantNo
      FROM plantilla_items pi
      INNER JOIN positions p ON p.id = pi.position_id
      LEFT JOIN salary_grades sg ON sg.id = pi.salary_grade_id
      LEFT JOIN hr_reference_values d ON d.id = pi.division_ref_id
      LEFT JOIN hr_reference_values se ON se.id = pi.section_ref_id
      LEFT JOIN hr_reference_values pt ON pt.id = pi.plantilla_type_ref_id
      LEFT JOIN plantilla_occupancies po ON po.plantilla_item_id = pi.id AND po.status = 'Active'
      LEFT JOIN employees e ON e.id = po.employee_id
      ORDER BY pi.item_status, pi.item_number
      LIMIT 500
    `);
    plantillaItems = items.map((item) => ({
      itemNumber: item.itemNumber || "",
      positionTitle: item.positionTitle || "",
      salaryGrade: item.salaryGrade ?? "",
      salaryStep: item.salaryStep ?? "",
      salaryAmount: item.salaryAmount == null ? null : Number(item.salaryAmount),
      division: item.division || "",
      section: item.section || "",
      plantillaType: item.plantillaType || "",
      itemStatus: item.itemStatus || "",
      occupancyStatus: item.occupancyStatus || "",
      occupantName: item.occupantName || "",
      occupantNo: item.occupantNo || "",
    }));
  }

  return {
    generatedAt: new Date().toISOString(),
    scope: "Current encoded HRIS records",
    employeeSummary: {
      total: number(employeeTotals.total),
      active: number(employeeTotals.active),
      inactive: number(employeeTotals.inactive),
      regular: number(employeeTotals.regular),
      nonPlantilla: number(employeeTotals.nonPlantilla),
    },
    plantillaSummary,
    charts: {
      byDepartment: byDepartment.map((row) => ({
        label: text(row.label),
        active: number(row.active),
        inactive: number(row.inactive),
        total: number(row.total),
      })),
      byEmploymentStatus: byEmploymentStatus.map((row) => ({
        label: text(row.label),
        active: number(row.active),
        inactive: number(row.inactive),
        total: number(row.total),
      })),
      byLevel: rowsToSeries(byLevel),
      byGender: rowsToSeries(byGender),
      byCivilStatus: rowsToSeries(byCivilStatus),
      byAgeGroup: rowsToSeries(byAgeGroup),
      topPositions: rowsToSeries(topPositions),
      plantillaByDivision,
      plantillaBySalaryGrade,
    },
    tables: {
      plantillaItems,
    },
  };
}

export function createReportHandlers({
  pool,
  requireEmployeeRead,
  json,
  logAudit,
  runPython,
  previewDir,
  exportScript,
  sendFile,
}) {
  const authorize = async (req, res) => {
    const user = await requireEmployeeRead(req, res);
    return user || null;
  };

  const handlers = {};

  handlers.personnelPlantilla = async (req, res) => {
    const user = await authorize(req, res);
    if (!user) return;
    try {
      const [[agency]] = await pool.query("SELECT name,tagline FROM agency_settings WHERE id=1");
      const report = await buildPersonnelPlantillaReport(pool);
      await logAudit(user.id, "reports.personnel_plantilla_view", {}, req);
      return json(res, 200, { agency, report });
    } catch (error) {
      return json(res, 500, { error: error.message || "Unable to build report" });
    }
  };

  handlers.exportPersonnelPlantilla = async (req, res, format) => {
    const user = await authorize(req, res);
    if (!user) return;
    if (!["xlsx", "pdf"].includes(format)) return json(res, 400, { error: "Unsupported format" });
    try {
      const [[agency]] = await pool.query("SELECT name,tagline FROM agency_settings WHERE id=1");
      const report = await buildPersonnelPlantillaReport(pool);
      await fs.mkdir(previewDir, { recursive: true });
      const fileName = normalizeFileName(`personnel-plantilla-analytics-${dateStamp()}.${format}`);
      const inputPath = path.join(previewDir, `${crypto.randomUUID()}-${fileName}.json`);
      const outputPath = path.join(previewDir, fileName);
      await fs.writeFile(inputPath, JSON.stringify({ agency, report }), "utf8");
      try {
        await runPython([exportScript, inputPath, outputPath, format]);
      } finally {
        await fs.rm(inputPath, { force: true }).catch(() => {});
      }
      await logAudit(user.id, `reports.personnel_plantilla_${format}_generate`, { fileName }, req);
      return json(res, 200, {
        fileName,
        downloadUrl: `/api/reports/files/${encodeURIComponent(fileName)}`,
      });
    } catch (error) {
      return json(res, 500, { error: error.message || "Unable to export report" });
    }
  };

  handlers.file = async (req, res, fileName) => {
    const user = await authorize(req, res);
    if (!user) return;
    const decoded = decodeURIComponent(fileName);
    if (!/^personnel-plantilla-analytics-[A-Za-z0-9_.-]+\.(xlsx|pdf)$/.test(decoded)) {
      return json(res, 400, { error: "Invalid report file name" });
    }
    const resolved = path.resolve(previewDir, decoded);
    if (!resolved.startsWith(path.resolve(previewDir))) {
      return json(res, 400, { error: "Invalid report path" });
    }
    try {
      await fs.access(resolved);
    } catch {
      return json(res, 404, { error: "Report file not found" });
    }
    await logAudit(user.id, "reports.personnel_plantilla_download", { fileName: decoded }, req);
    return sendFile(res, resolved, decoded, { deleteAfterSend: true });
  };

  return handlers;
}
