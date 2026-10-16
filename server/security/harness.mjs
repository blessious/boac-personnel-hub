import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";
import { once } from "node:events";
import mysql from "mysql2/promise";

export const password = "Security-Test-Only-42!";
export const roles = ["Super Admin", "Admin", "HR", "Approver", "Employee", "Viewer"];

export async function startHarness({ clientPort } = {}) {
  for (const key of ["HOST", "PORT", "USER", "PASSWORD"]) {
    if (process.env[`HRIS_TEST_DB_${key}`] === undefined)
      throw new Error(
        `Set HRIS_TEST_DB_${key} explicitly; working database settings are never used`,
      );
  }
  const host = process.env.HRIS_TEST_DB_HOST;
  assert.ok(
    /^\d+$/.test(process.env.HRIS_TEST_DB_PORT) &&
      Number(process.env.HRIS_TEST_DB_PORT) > 0 &&
      Number(process.env.HRIS_TEST_DB_PORT) <= 65535,
    "Set a valid explicit HRIS_TEST_DB_PORT",
  );
  assert.ok(process.env.HRIS_TEST_DB_USER.trim(), "Set a nonempty explicit HRIS_TEST_DB_USER");
  assert.ok(
    ["127.0.0.1", "localhost", "::1"].includes(host),
    "Tests require a local MySQL instance",
  );
  const config = {
    host,
    port: Number(process.env.HRIS_TEST_DB_PORT),
    user: process.env.HRIS_TEST_DB_USER,
    password: process.env.HRIS_TEST_DB_PASSWORD,
    dateStrings: true,
  };
  const database = `hris_security_${crypto.randomBytes(12).toString("hex")}`;
  const runtime = await fs.mkdtemp(path.join(os.tmpdir(), "hris-security-"));
  const socket = net.createServer();
  socket.listen(0, "127.0.0.1");
  await once(socket, "listening");
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));
  let admin,
    db,
    child,
    created = false,
    output = "";
  async function close() {
    if (child && child.exitCode === null) {
      const ended = once(child, "exit");
      child.kill();
      await ended;
    }
    if (db) await db.end();
    if (admin) {
      if (created && /^hris_security_[a-f0-9]{24}$/.test(database))
        await admin.query(`DROP DATABASE \`${database}\``);
      await admin.end();
    }
    // Only remove the exact temporary directory created by this invocation.
    await fs.rm(runtime, { recursive: true, force: true });
  }
  const origin = `http://127.0.0.1:${port}`;
  async function request(cookie, method, route, body, extraHeaders = {}) {
    const response = await fetch(origin + route, {
      method,
      headers: {
        Origin: origin,
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...extraHeaders,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });
    const raw = await response.text();
    if (response.status === 500) console.error(output.slice(-3500));
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }
    return {
      status: response.status,
      data,
      cookie: response.headers.get("set-cookie")?.split(";")[0],
      headers: response.headers,
    };
  }
  async function login(username, pass = password) {
    const response = await request(null, "POST", "/api/auth/login", { username, password: pass });
    assert.equal(response.status, 200, `Login ${username}: ${JSON.stringify(response.data)}`);
    return response.cookie;
  }
  async function user(username, role, employeeId = null, extras = {}) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = `${salt}:${crypto.pbkdf2Sync(password, salt, 210000, 32, "sha256").toString("hex")}`;
    const [result] = await db.execute(
      `INSERT INTO users(username,password_hash,name,role,employee_id,is_active,must_change_password)
      VALUES(?,?,?,?,?,?,?)`,
      [username, hash, username, role, employeeId, extras.active ?? 1, extras.force ?? 0],
    );
    return result.insertId;
  }
  async function employee(label) {
    const id = crypto.randomUUID();
    await db.execute(
      "INSERT INTO employees(id,employee_no,firstname,lastname,department,position,email) VALUES(?,?,?,?,?,?,?)",
      [id, label, label, "Synthetic", "Test Office", "Test Position", `${label}@example.invalid`],
    );
    return id;
  }
  try {
    admin = await mysql.createConnection(config);
    await admin.query(
      `CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    created = true;
    db = await mysql.createConnection({ ...config, database, multipleStatements: true });
    const env = Object.fromEntries(
      Object.entries(process.env).filter(
        ([key]) => !key.startsWith("HRIS_") && !key.startsWith("PYTHON_") && key !== "NODE_ENV",
      ),
    );
    Object.assign(env, {
      NODE_ENV: "test",
      HRIS_SECURITY_TEST: "1",
      HRIS_DB_HOST: host,
      HRIS_DB_PORT: String(config.port),
      HRIS_DB_USER: config.user,
      HRIS_DB_PASSWORD: config.password,
      HRIS_DB_NAME: database,
      HRIS_API_PORT: String(port),
      HRIS_CLIENT_PORT: String(clientPort || port),
      HRIS_ADMS_PORT: "0",
      HRIS_RUNTIME_DIR: runtime,
    });
    if (process.env.HRIS_TEST_PYTHON_EXE) env.HRIS_PYTHON_EXE = process.env.HRIS_TEST_PYTHON_EXE;
    if (process.env.HRIS_TEST_LIBREOFFICE_EXE)
      env.HRIS_LIBREOFFICE_EXE = process.env.HRIS_TEST_LIBREOFFICE_EXE;
    child = spawn(process.execPath, ["server/index.mjs"], {
      env,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.stderr.on("data", (chunk) => {
      output += chunk;
    });
    let ready = false;
    for (let i = 0; i < 300; i++) {
      if (child.exitCode !== null) throw new Error(`Test API exited: ${output}`);
      if (output.includes("HRIS API listening")) {
        ready = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(ready, `Test API startup timed out: ${output}`);
    // Match the supplied deployment schema's performance indexes. Fresh startup's
    // legacy migration stamping can omit these; repairing that installer is out of scope.
    await db.query(
      await fs.readFile(
        new URL("../migrations/2026-08-10_performance_pagination_indexes.sql", import.meta.url),
        "utf8",
      ),
    );
    const a = await employee("employee-a"),
      b = await employee("employee-b");
    const ids = {},
      cookies = {};
    for (const role of roles) {
      const name = role.toLowerCase().replaceAll(" ", "-");
      ids[name] = await user(name, role, role === "Employee" ? a : null);
      cookies[name] = await login(name);
    }
    ids.other = await user("other", "Employee", b);
    cookies.other = await login("other");
    ids.unlinked = await user("unlinked", "Employee");
    cookies.unlinked = await login("unlinked");
    return {
      db,
      database,
      runtime,
      origin,
      request,
      login,
      user,
      employee,
      ids,
      cookies,
      a,
      b,
      close,
    };
  } catch (error) {
    await close();
    throw error;
  }
}
