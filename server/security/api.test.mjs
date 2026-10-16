import assert from "node:assert/strict";
import { after, test } from "node:test";
import { startHarness, password } from "./harness.mjs";
import crypto from "node:crypto";

const h = await startHarness();
after(async () => h.close());
const call = (role, method, route, body, headers) =>
  h.request(h.cookies[role], method, route, body, headers);
function status(result, expected) {
  assert.equal(result.status, expected, JSON.stringify(result.data));
  return result.data;
}

test("default roles retain their permitted read workflows and reject protected alternatives", async () => {
  const cases = [
    ["/api/employees", ["super-admin", "hr", "approver", "viewer"]],
    ["/api/admin/users", ["super-admin", "admin"]],
    ["/api/admin/audit-logs", ["super-admin", "admin"]],
    ["/api/admin/error-logs", ["super-admin", "admin"]],
    ["/api/admin/role-permissions", ["super-admin", "admin"]],
    ["/api/plantilla", ["super-admin", "hr", "approver", "viewer"]],
    ["/api/movements", ["super-admin", "hr", "approver", "viewer"]],
    ["/api/reports/personnel-plantilla", ["super-admin", "hr", "approver", "viewer"]],
  ];
  for (const [route, allowed] of cases) {
    status(await h.request(null, "GET", route), 401);
    for (const role of ["super-admin", "admin", "hr", "approver", "employee", "viewer"]) {
      const response = await call(role, "GET", route);
      assert.equal(
        response.status,
        allowed.includes(role) ? 200 : 403,
        `${role} ${route}: ${JSON.stringify(response.data)}`,
      );
    }
  }
});

test("invalid, expired and inactive sessions fail; valid session and logout work", async () => {
  status(await h.request("hris_session=invalid", "GET", "/api/employees"), 401);
  const id = await h.user("session-test", "HR");
  let cookie = await h.login("session-test");
  status(await h.request(cookie, "GET", "/api/employees"), 200);
  await h.db.execute(
    "UPDATE sessions SET expires_at=DATE_SUB(NOW(),INTERVAL 1 SECOND) WHERE user_id=?",
    [id],
  );
  status(await h.request(cookie, "GET", "/api/employees"), 401);
  cookie = await h.login("session-test");
  await h.db.execute("UPDATE users SET is_active=0 WHERE id=?", [id]);
  status(await h.request(cookie, "GET", "/api/employees"), 401);
  status(
    await h.request(null, "POST", "/api/auth/login", { username: "session-test", password }),
    401,
  );
  await h.db.execute("UPDATE users SET is_active=1 WHERE id=?", [id]);
  cookie = await h.login("session-test");
  status(await h.request(cookie, "POST", "/api/auth/logout", {}), 200);
  status(await h.request(cookie, "GET", "/api/employees"), 401);
});

test("three failures lock an account; authorized unlock and password reset restore access", async () => {
  const id = await h.user("lock-test", "Viewer");
  const oldCookie = await h.login("lock-test");
  for (const expected of [401, 401, 423])
    status(
      await h.request(null, "POST", "/api/auth/login", {
        username: "lock-test",
        password: "incorrect",
      }),
      expected,
    );
  status(await h.request(oldCookie, "GET", "/api/employees"), 401);
  status(await call("hr", "POST", `/api/admin/users/${id}/unlock`, {}), 403);
  status(await call("admin", "POST", `/api/admin/users/${id}/unlock`, {}), 200);
  const restored = await h.login("lock-test");
  const payload = { newPassword: "Reset-Security-44!", confirmPassword: "Reset-Security-44!" };
  status(await call("employee", "POST", `/api/admin/users/${id}/reset-password`, payload), 403);
  status(await call("admin", "POST", `/api/admin/users/${id}/reset-password`, payload), 200);
  status(await h.request(restored, "GET", "/api/employees"), 401);
  status(
    await h.request(await h.login("lock-test", payload.newPassword), "GET", "/api/employees"),
    200,
  );
});

test("self-service edits preserve restricted fields; HR editing and attachments still work", async () => {
  const before = status(await call("employee", "GET", `/api/employees/${h.a}`), 200).employee;
  const payload = {
    email: "updated@example.invalid",
    position: "Unauthorized promotion",
    itemNo: "FAKE",
    empStatus: "Inactive",
    role: "Super Admin",
  };
  status(await call("other", "PATCH", `/api/employees/${h.a}`, payload), 403);
  status(await call("employee", "PATCH", `/api/employees/${h.a}`, payload), 200);
  const after = status(await call("employee", "GET", `/api/employees/${h.a}`), 200).employee;
  assert.equal(after.email, payload.email);
  assert.equal(after.position, before.position);
  assert.equal(after.itemNo, before.itemNo);
  assert.equal(after.empStatus, before.empStatus);
  status(
    await call("viewer", "PATCH", `/api/employees/${h.a}`, { email: "hr@example.invalid" }),
    403,
  );
  status(await call("hr", "PATCH", `/api/employees/${h.a}`, { email: "hr@example.invalid" }), 200);
  const [[record]] = await h.db.execute("SELECT email FROM employees WHERE id=?", [h.a]);
  assert.equal(record.email, "hr@example.invalid");
  const attachment = {
    name: "Synthetic training",
    certificate: "proof.txt",
    certificateData: "data:text/plain;base64,c3ludGhldGlj",
    certificateType: "text/plain",
    certificateSize: 9,
  };
  // Seed an attachment payload to test access independently of form validation.
  await h.db.execute(
    "INSERT INTO employee_training_records(id,employee_id,payload) VALUES(UUID(),?,?)",
    [h.a, JSON.stringify(attachment)],
  );
  const own = status(await call("employee", "GET", `/api/employees/${h.a}`), 200);
  assert.ok(JSON.stringify(own).includes("c3ludGhldGlj"));
  const denied = await call("other", "GET", `/api/employees/${h.a}`);
  status(denied, 403);
  assert.ok(!JSON.stringify(denied.data).includes("c3ludGhldGlj"));
});

test("DTR mutation, imports and schedule changes require attendance write and persist for HR", async () => {
  const payload = {
    employeeDbId: h.a,
    workDate: "2026-01-05",
    amIn: "08:05",
    amOut: "12:00",
    pmIn: "13:00",
    pmOut: "17:00",
  };
  for (const role of ["employee", "viewer", "approver", "admin"])
    status(await call(role, "POST", "/api/attendance/dtr", payload), 403);
  const [[empty]] = await h.db.query("SELECT COUNT(*) AS n FROM dtr_entries");
  assert.equal(empty.n, 0);
  status(await call("hr", "POST", "/api/attendance/dtr", payload), 201);
  const [[saved]] = await h.db.execute(
    "SELECT * FROM dtr_entries WHERE employee_id=? AND work_date=?",
    [h.a, payload.workDate],
  );
  assert.equal(saved.am_in, "08:05:00");
  const imp = { rows: [{ ...payload, workDate: "2026-01-06" }], source: "CSV" };
  status(await call("employee", "POST", "/api/attendance/import", imp), 403);
  status(await call("hr", "POST", "/api/attendance/import", imp), 200);
  const schedule = {
    employeeIds: [h.a],
    from: "2026-01-05",
    to: "2026-01-06",
    schedule: { amIn: "08:00", amOut: "12:00", pmIn: "13:00", pmOut: "17:00" },
  };
  status(await call("employee", "POST", "/api/attendance/schedule/bulk", schedule), 403);
  status(await call("hr", "POST", "/api/attendance/schedule/bulk", schedule), 200);
  status(
    await call(
      "other",
      "GET",
      `/api/attendance/dtr?employeeId=${h.a}&from=2026-01-01&to=2026-01-31`,
    ),
    403,
  );
  status(await call("employee", "GET", "/api/attendance/dtr?from=2026-01-01&to=2026-01-31"), 200);
});

test("DTR correction approval and reversal preserve the intended permission separation", async () => {
  const payload = {
    workDate: "2026-01-07",
    amIn: "08:00",
    amOut: "12:00",
    pmIn: "13:00",
    pmOut: "17:00",
    reason: "Synthetic missed punch",
  };
  const created = status(
    await call("employee", "POST", "/api/attendance/correction-requests", payload),
    201,
  ).request;
  const route = `/api/attendance/correction-requests/${created.id}`;
  status(await call("other", "POST", `${route}/cancel`, {}), 403);
  status(await call("hr", "POST", `${route}/decision`, { status: "Approved" }), 403);
  status(await call("approver", "POST", `${route}/decision`, { status: "Approved" }), 200);
  const [[saved]] = await h.db.execute(
    "SELECT am_in FROM dtr_entries WHERE employee_id=? AND work_date=?",
    [h.a, payload.workDate],
  );
  assert.equal(saved.am_in, "08:00:00");
  status(await call("employee", "POST", `${route}/reverse`, { reason: "Synthetic reversal" }), 403);
  status(
    await call("approver", "POST", `${route}/reverse`, {
      reason: "Synthetic reversal",
      remarks: "Synthetic reversal",
    }),
    200,
  );
});

test("leave filing, approval, credit ledger and cancellation retain allowed workflows", async () => {
  const [lt] = await h.db.execute(
    "INSERT INTO leave_types(code,name,is_paid,is_credit_based,credit_group,advance_notice_days) VALUES('TEST','Synthetic credit leave',1,1,'TEST',0)",
  );
  const adjustment = { leaveTypeId: lt.insertId, amount: 10, reason: "Synthetic starting credits" };
  status(
    await call("employee", "POST", `/api/employees/${h.a}/leave/adjustments`, adjustment),
    403,
  );
  status(await call("hr", "POST", `/api/employees/${h.a}/leave/adjustments`, adjustment), 200);
  status(await call("other", "GET", `/api/employees/${h.a}/leave`), 403);
  status(await call("employee", "GET", `/api/employees/${h.a}/leave`), 200);
  const payload = {
    employeeId: h.a,
    leaveTypeId: lt.insertId,
    dateFrom: "2026-02-02",
    dateTo: "2026-02-02",
    reason: "Synthetic leave",
  };
  status(await call("other", "POST", "/api/leave/applications", payload), 403);
  const application = status(
    await call("employee", "POST", "/api/leave/applications", payload),
    201,
  ).application;
  const route = `/api/leave/applications/${application.id}`;
  status(
    await call("hr", "POST", `${route}/decision`, { status: "Approved", approvedDaysWithPay: 1 }),
    403,
  );
  status(
    await call("approver", "POST", `${route}/decision`, {
      status: "Approved",
      approvedDaysWithPay: 1,
    }),
    200,
  );
  const [[balance]] = await h.db.execute(
    "SELECT balance FROM leave_balances WHERE employee_id=? AND leave_type_id=?",
    [h.a, lt.insertId],
  );
  assert.equal(Number(balance.balance), 9);
  const [[ledger]] = await h.db.execute(
    "SELECT COUNT(*) AS n FROM leave_credit_ledger WHERE source_id=?",
    [application.id],
  );
  assert.equal(ledger.n, 1);
  status(await call("employee", "POST", `${route}/decision`, { status: "Cancelled" }), 403);
  status(await call("approver", "POST", `${route}/decision`, { status: "Cancelled" }), 200);
  const [[restored]] = await h.db.execute(
    "SELECT balance FROM leave_balances WHERE employee_id=? AND leave_type_id=?",
    [h.a, lt.insertId],
  );
  assert.equal(Number(restored.balance), 10);
  const second = status(
    await call("employee", "POST", "/api/leave/applications", {
      ...payload,
      dateFrom: "2026-02-03",
      dateTo: "2026-02-03",
    }),
    201,
  ).application;
  status(await call("other", "POST", `/api/leave/applications/${second.id}/cancel`, {}), 403);
  status(await call("employee", "POST", `/api/leave/applications/${second.id}/cancel`, {}), 200);
});

test("administration protects role escalation and last Super Admin while allowing normal user administration", async () => {
  const payload = { username: "created-user", name: "Synthetic user", role: "Viewer" };
  status(await call("hr", "POST", "/api/admin/users", payload), 403);
  const created = status(await call("admin", "POST", "/api/admin/users", payload), 201).user;
  status(
    await call("admin", "POST", "/api/admin/users", {
      ...payload,
      username: "escalated",
      role: "Super Admin",
    }),
    403,
  );
  status(
    await call("admin", "POST", `/api/admin/users/${h.ids["super-admin"]}/reset-password`, {
      newPassword: "Reset-Root-99!",
      confirmPassword: "Reset-Root-99!",
    }),
    403,
  );
  status(await call("super-admin", "DELETE", `/api/admin/users/${h.ids["super-admin"]}`), 400);
  status(
    await call("super-admin", "PATCH", `/api/admin/users/${h.ids["super-admin"]}`, {
      name: "super-admin",
      role: "Admin",
      isActive: true,
    }),
    409,
  );
  status(await call("employee", "DELETE", `/api/admin/users/${created.id}`), 403);
  status(await call("admin", "DELETE", `/api/admin/users/${created.id}`), 200);
});

test("notifications are private; ownership failure does not mark someone else's notification read", async () => {
  const id = crypto.randomUUID();
  await h.db.execute(
    "INSERT INTO notifications(id,user_id,topic,title,message,path) VALUES(?,?,'test','private title','private content','/requests')",
    [id, h.ids.employee],
  );
  assert.ok(
    !JSON.stringify(status(await call("other", "GET", "/api/notifications"), 200)).includes(id),
  );
  status(await call("other", "PATCH", `/api/notifications/${id}/read`, {}), 404);
  const [[before]] = await h.db.execute("SELECT read_at FROM notifications WHERE id=?", [id]);
  assert.equal(before.read_at, null);
  status(await call("employee", "PATCH", `/api/notifications/${id}/read`, {}), 200);
});

test("cross-origin mutation is denied while legitimate same-origin settings update works", async () => {
  status(
    await call(
      "admin",
      "POST",
      "/api/settings/positions",
      { title: "Synthetic Position" },
      { Origin: "https://untrusted.example" },
    ),
    403,
  );
  status(
    await call("employee", "POST", "/api/settings/positions", { title: "Synthetic Position" }),
    403,
  );
  status(
    await call("admin", "POST", "/api/settings/positions", { title: "Synthetic Position" }),
    201,
  );
  for (const route of ["/api/public/agency", "/api/auth/bootstrap-status", "/api/auth/me"])
    status(await h.request(null, "GET", route), 200);
});

test("employee records: own access works; another employee and unlinked account cannot read them", async () => {
  status(await call("employee", "GET", `/api/employees/${h.a}`), 200);
  status(await call("hr", "GET", `/api/employees/${h.b}`), 200);
  status(await call("employee", "GET", `/api/employees/${h.b}`), 403);
  status(await call("unlinked", "GET", `/api/employees/${h.a}`), 403);
  status(await h.request(null, "GET", `/api/employees/${h.a}`), 401);
});

test("forced password change cannot be bypassed through direct API requests", async () => {
  await h.user("forced", "HR", null, { force: 1 });
  const cookie = await h.login("forced");
  status(await h.request(cookie, "GET", "/api/employees"), 403);
  status(
    await h.request(cookie, "POST", "/api/auth/change-password", {
      newPassword: "Changed-Security-43!",
      confirmPassword: "Changed-Security-43!",
    }),
    200,
  );
  status(await h.request(cookie, "GET", "/api/employees"), 200);
});

test("document download allows the subject, denies another employee, and preserves single use", async () => {
  const fileName = "pds-11111111-1111-4111-8111-111111111111.xlsx";
  const { mkdir, writeFile } = await import("node:fs/promises");
  const path = await import("node:path");
  await mkdir(path.join(h.runtime, "previews"), { recursive: true });
  await writeFile(path.join(h.runtime, "previews", fileName), "synthetic export");
  await h.db.execute(
    `INSERT INTO document_export_jobs(id,file_name,export_type,employee_id,created_by,expires_at) VALUES(UUID(),?,'PDS',?,?,DATE_ADD(NOW(),INTERVAL 15 MINUTE))`,
    [fileName, h.a, h.ids.hr],
  );
  // Download URL follows the same route returned by actual generation.
  status(await call("other", "GET", `/api/employees/pds/excel/${fileName}`), 403);
  status(await call("employee", "GET", `/api/employees/pds/excel/${fileName}`), 200);
  assert.ok(
    [403, 404].includes(
      (await call("employee", "GET", `/api/employees/pds/excel/${fileName}`)).status,
    ),
  );
});

test("plantilla and engagement management persist assignments without granting employee write access", async () => {
  const [position] = await h.db.execute("INSERT INTO positions(title) VALUES('Fixture position')");
  const itemPayload = {
    itemNumber: "SECURITY-001",
    positionId: position.insertId,
    itemStatus: "Active",
  };
  status(await call("viewer", "POST", "/api/plantilla", itemPayload), 403);
  const item = status(await call("hr", "POST", "/api/plantilla", itemPayload), 201).item;
  assert.ok(item.id);
  status(await call("employee", "DELETE", `/api/plantilla/${item.id}`), 403);
  status(await call("hr", "DELETE", `/api/plantilla/${item.id}`), 200);
  const employeeId = await h.employee("engagement-fixture");
  const [[office]] = await h.db.query(
    "SELECT id FROM hr_reference_values WHERE category='offices' AND is_active=1 LIMIT 1",
  );
  const payload = {
    employeeId,
    engagementType: "JO",
    organizationId: office.id,
    designation: "Fixture worker",
    dateFrom: "2020-01-01",
    dateTo: "2099-12-31",
    rate: 1000,
  };
  status(await call("employee", "POST", "/api/engagements", payload), 403);
  const engagement = status(await call("hr", "POST", "/api/engagements", payload), 201).engagement;
  const [[saved]] = await h.db.execute("SELECT position,status FROM employees WHERE id=?", [
    employeeId,
  ]);
  assert.equal(saved.position, payload.designation);
  assert.equal(saved.status, "JO");
  const renewal = { dateFrom: "2100-01-01", dateTo: "2100-12-31", remarks: "Synthetic renewal" };
  status(await call("approver", "POST", `/api/engagements/${engagement.id}/renew`, renewal), 403);
  const renewed = status(
    await call("hr", "POST", `/api/engagements/${engagement.id}/renew`, renewal),
    201,
  ).engagement;
  status(
    await call("employee", "POST", `/api/engagements/${renewed.id}/terminate`, {
      dateTo: "2100-01-02",
      remarks: "Synthetic termination",
    }),
    403,
  );
  status(
    await call("hr", "POST", `/api/engagements/${renewed.id}/terminate`, {
      dateTo: "2100-01-02",
      remarks: "Synthetic termination",
    }),
    200,
  );
  const [[count]] = await h.db.execute(
    "SELECT COUNT(*) AS n FROM non_plantilla_engagements WHERE employee_id=? AND status='Active'",
    [employeeId],
  );
  assert.equal(count.n, 0);
});

test("movement creation/posting and reversal enforce existing write permissions and preserve snapshots", async () => {
  const employeeId = await h.employee("movement-fixture");
  const payload = {
    employeeId,
    actionType: "Retirement",
    effectiveDate: "2026-01-01",
    remarks: "Synthetic retirement",
  };
  status(await call("approver", "POST", "/api/movements", payload), 403);
  const movement = status(await call("hr", "POST", "/api/movements", payload), 201).movement;
  assert.equal(
    movement.status,
    "Posted",
    "Current create workflow auto-posts; this test does not redesign approvals",
  );
  const [[saved]] = await h.db.execute("SELECT emp_status FROM employees WHERE id=?", [employeeId]);
  assert.equal(saved.emp_status, "Inactive");
  status(await call("viewer", "POST", `/api/movements/${movement.id}/post`, {}), 403);
  status(
    await call("employee", "POST", `/api/movements/${movement.id}/reverse`, {
      remarks: "Synthetic reversal",
      reason: "Synthetic reversal",
    }),
    403,
  );
  status(
    await call("hr", "POST", `/api/movements/${movement.id}/reverse`, {
      remarks: "Synthetic reversal",
      reason: "Synthetic reversal",
    }),
    200,
  );
  const [[restored]] = await h.db.execute("SELECT emp_status FROM employees WHERE id=?", [
    employeeId,
  ]);
  assert.equal(restored.emp_status, "Active");
});

test("manual service records are writable by HR, readable by subject, and private from other employees", async () => {
  const route = `/api/service-records/${h.a}`;
  const payload = {
    serviceFrom: "2019-01-01",
    serviceTo: "2019-12-31",
    positionTitle: "Synthetic previous work",
  };
  status(await call("employee", "POST", route, payload), 403);
  const entry = status(await call("hr", "POST", route, payload), 201).entry;
  status(await call("other", "GET", route), 403);
  assert.ok(JSON.stringify(status(await call("employee", "GET", route), 200)).includes(entry.id));
});

test("actual document generators preserve allowed exports and reject cross-employee requests", async () => {
  for (const suffix of ["pds/excel", "wes/docx"]) {
    const route = `/api/employees/${h.a}/${suffix}`;
    status(await call("other", "POST", route, {}), 403);
    const result = status(await call("employee", "POST", route, {}), 200);
    status(await call("other", "GET", result.downloadUrl), 403);
    const download = await call("employee", "GET", result.downloadUrl);
    status(download, 200);
    assert.ok(download.data.length > 100, "Expected generated document bytes");
  }
  status(await call("other", "POST", `/api/service-records/${h.a}/export/xlsx`, {}), 403);
  const sr = status(
    await call("employee", "POST", `/api/service-records/${h.a}/export/xlsx`, {}),
    200,
  );
  status(await call("other", "GET", sr.downloadUrl), 403);
  status(await call("employee", "GET", sr.downloadUrl), 200);
  status(await call("employee", "POST", "/api/reports/personnel-plantilla/export/xlsx", {}), 403);
  const report = status(
    await call("hr", "POST", "/api/reports/personnel-plantilla/export/xlsx", {}),
    200,
  );
  status(await call("employee", "GET", report.downloadUrl), 403);
  status(await call("viewer", "GET", report.downloadUrl), 200);
  const [[application]] = await h.db.execute(
    "SELECT id FROM leave_applications WHERE employee_id=? LIMIT 1",
    [h.a],
  );
  const leaveRoute = `/api/leave/applications/${application.id}/form6/excel`;
  status(await call("other", "POST", leaveRoute, {}), 403);
  const leave = status(await call("employee", "POST", leaveRoute, {}), 200);
  status(await call("other", "GET", leave.downloadUrl), 403);
  status(await call("employee", "GET", leave.downloadUrl), 200);
  const dtr = status(
    await call("employee", "POST", "/api/attendance/dtr/excel", {
      employeeId: h.a,
      month: 1,
      year: 2026,
    }),
    200,
  );
  status(await call("other", "GET", dtr.downloadUrl), 403);
  status(await call("employee", "GET", dtr.downloadUrl), 200);
});

test("PDF generation and preview preserve subject and report permissions", async () => {
  const [[application]] = await h.db.execute(
    "SELECT id FROM leave_applications WHERE employee_id=? LIMIT 1",
    [h.a],
  );
  for (const [route, body, allowed, denied, repeat] of [
    [`/api/leave/applications/${application.id}/form6/pdf`, {}, "employee", "other", true],
    [
      "/api/attendance/dtr/pdf",
      { employeeId: h.a, month: 1, year: 2026 },
      "employee",
      "other",
      false,
    ],
    [`/api/service-records/${h.a}/export/pdf`, {}, "employee", "other", false],
    ["/api/reports/personnel-plantilla/export/pdf", {}, "hr", "employee", false],
  ]) {
    if (route === "/api/attendance/dtr/pdf") {
      // Existing self-service behavior ignores an alternate subject and exports the caller.
      const scoped = status(await call(denied, "POST", route, body), 200);
      const [[job]] = await h.db.execute(
        "SELECT employee_id FROM dtr_export_jobs WHERE file_name=?",
        [scoped.fileName],
      );
      assert.equal(job.employee_id, h.b);
    } else {
      status(await call(denied, "POST", route, body), 403);
    }
    const result = status(await call(allowed, "POST", route, body), 200);
    const download = result.previewUrl || result.downloadUrl;
    status(await call(denied, "GET", download), 403);
    const pdf = status(await call(allowed, "GET", download), 200);
    assert.ok(pdf.startsWith("%PDF"));
    if (repeat) status(await call(allowed, "GET", download), 200);
  }
});

test("expired export jobs and invalid paths cannot be downloaded; creator and privileged access remain", async () => {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const path = await import("node:path");
  await mkdir(path.join(h.runtime, "previews"), { recursive: true });
  for (const [role, expired] of [
    ["hr", false],
    ["viewer", false],
    ["employee", true],
  ]) {
    const name = `pds-${crypto.randomUUID()}.xlsx`;
    await writeFile(path.join(h.runtime, "previews", name), "synthetic");
    await h.db.execute(
      `INSERT INTO document_export_jobs(id,file_name,export_type,employee_id,created_by,expires_at) VALUES(UUID(),?,'PDS',?,?,DATE_ADD(NOW(),INTERVAL ? MINUTE))`,
      [name, h.a, h.ids.hr, expired ? -1 : 15],
    );
    status(await call(role, "GET", `/api/employees/pds/excel/${name}`), expired ? 403 : 200);
  }
  status(await call("employee", "GET", "/api/employees/pds/excel/..%2F..%2Fpackage.json"), 400);
});

test("custom permission changes revoke old sessions, deny removed access, and enable granted actions", async () => {
  const baseline = status(await call("viewer", "GET", "/api/auth/me"), 200).user.permissions;
  const payload = { role: "Viewer", permissions: baseline.filter((p) => p !== "employees.read") };
  status(await call("admin", "PATCH", "/api/admin/role-permissions", payload), 403);
  status(await call("super-admin", "PATCH", "/api/admin/role-permissions", payload), 200);
  status(await call("viewer", "GET", "/api/employees"), 401);
  h.cookies.viewer = await h.login("viewer");
  status(await call("viewer", "GET", "/api/employees"), 403);
  status(
    await call("super-admin", "PATCH", "/api/admin/role-permissions", {
      role: "Viewer",
      permissions: [...baseline, "employees.write"],
    }),
    200,
  );
  h.cookies.viewer = await h.login("viewer");
  status(
    await call("viewer", "PATCH", `/api/employees/${h.a}`, {
      email: "custom-permission@example.invalid",
    }),
    200,
  );
  const [[saved]] = await h.db.execute("SELECT email FROM employees WHERE id=?", [h.a]);
  assert.equal(saved.email, "custom-permission@example.invalid");
  status(
    await call("super-admin", "PATCH", "/api/admin/role-permissions", {
      role: "Viewer",
      permissions: baseline,
    }),
    200,
  );
  h.cookies.viewer = await h.login("viewer");
  status(
    await call("viewer", "PATCH", `/api/employees/${h.a}`, { email: "forbidden@example.invalid" }),
    403,
  );
});

test("realtime refresh does not disclose another employee identifier and stops after logout", async () => {
  const cookie = await h.login("other");
  const controller = new AbortController();
  const stream = await fetch(`${h.origin}/api/realtime/events`, {
    headers: { Cookie: cookie },
    signal: controller.signal,
  });
  assert.equal(stream.status, 200);
  let received = "";
  const consume = (async () => {
    try {
      for await (const chunk of stream.body) received += new TextDecoder().decode(chunk);
    } catch {
      /* aborted by cleanup */
    }
  })();
  try {
    status(
      await call("hr", "PATCH", `/api/employees/${h.a}`, { email: "realtime@example.invalid" }),
      200,
    );
    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.ok(
      received.includes('"topic":"employees"'),
      "Allowed generic refresh should still arrive",
    );
    assert.ok(
      !received.includes(h.a),
      "Broadcast refresh must not expose another employee's identifier",
    );
    status(await h.request(cookie, "POST", "/api/auth/logout", {}), 200);
    await new Promise((resolve) => setTimeout(resolve, 150));
    received = "";
    status(
      await call("hr", "PATCH", `/api/employees/${h.a}`, { email: "after-logout@example.invalid" }),
      200,
    );
    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.ok(!received.includes('"topic":"employees"'), "Revoked stream must receive no events");
  } finally {
    controller.abort();
    await consume;
  }
});

test("section row ownership and salary restrictions preserve legitimate section editing", async () => {
  const route = `/api/employees/${h.a}/sections/children`;
  const body = { payload: { firstname: "Synthetic child", birthday: "2020-01-01" } };
  status(await call("other", "POST", route, body), 403);
  const row = status(await call("employee", "POST", route, body), 201).row;
  status(await call("other", "PATCH", `${route}/${row.id}`, body), 403);
  status(await call("other", "DELETE", `${route}/${row.id}`), 403);
  status(
    await call("other", "PATCH", `/api/employees/${h.b}/sections/children/${row.id}`, body),
    404,
  );
  const [[unchanged]] = await h.db.execute(
    "SELECT payload FROM employee_child_records WHERE id=?",
    [row.id],
  );
  assert.equal(unchanged.payload.firstname, "Synthetic child");
  status(
    await call("employee", "PATCH", `${route}/${row.id}`, {
      payload: { ...body.payload, firstname: "Updated child" },
    }),
    200,
  );
  status(
    await call("employee", "POST", `/api/employees/${h.a}/sections/salary`, {
      payload: { amount: "50000" },
    }),
    403,
  );
  status(
    await call("hr", "POST", `/api/employees/${h.a}/sections/salary`, {
      payload: { amount: "50000" },
    }),
    201,
  );
  status(await call("employee", "DELETE", `${route}/${row.id}`), 200);
  const [[deleted]] = await h.db.execute(
    "SELECT COUNT(*) AS n FROM employee_child_records WHERE id=?",
    [row.id],
  );
  assert.equal(deleted.n, 0);
});

test("manual attendance locks cannot be changed by employees and persist for HR", async () => {
  const [[row]] = await h.db.execute(
    "SELECT * FROM dtr_entries WHERE employee_id=? AND work_date='2026-01-05'",
    [h.a],
  );
  const route = `/api/attendance/dtr/${row.id}`;
  const body = { amIn: "08:10", lockDtr: true };
  status(await call("employee", "PATCH", route, body), 403);
  const [[unchanged]] = await h.db.execute("SELECT * FROM dtr_entries WHERE id=?", [row.id]);
  assert.deepEqual(unchanged, row);
  status(await call("hr", "PATCH", route, body), 200);
  const [[saved]] = await h.db.execute("SELECT * FROM dtr_entries WHERE id=?", [row.id]);
  assert.equal(saved.am_in, "08:10:00");
  assert.equal(saved.am_in_locked, 1);
});

test("synthetic ADMS rejects unconfigured sources and accepts configured loopback device punches", async () => {
  await h.db.execute("UPDATE employees SET biometric_id='SECURITY-BIO' WHERE id=?", [h.a]);
  async function punch(time) {
    const response = await fetch(`${h.origin}/iclock/cdata?table=ATTLOG&SN=SYNTHETIC`, {
      method: "POST",
      body: `SECURITY-BIO\t2026-01-08 ${time}\t0\t1\t0\t0\n`,
    });
    assert.equal(response.status, 200);
    await response.text();
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  await punch("08:00:00");
  let [[count]] = await h.db.query(
    "SELECT COUNT(*) AS n FROM attendance_logs WHERE source='Biometric'",
  );
  assert.equal(count.n, 0);
  const device = { name: "Synthetic loopback", ipAddress: "127.0.0.1", port: 4370, active: true };
  status(await call("employee", "POST", "/api/attendance/biometrics", device), 403);
  status(await call("hr", "POST", "/api/attendance/biometrics", device), 201);
  await punch("08:00:00");
  [[count]] = await h.db.query(
    "SELECT COUNT(*) AS n FROM attendance_logs WHERE source='Biometric'",
  );
  assert.equal(count.n, 1);
  await h.db.query("DELETE FROM biometric_devices");
});
