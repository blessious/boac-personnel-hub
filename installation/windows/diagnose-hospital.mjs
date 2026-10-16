import { access, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import net from "node:net";
import mysql from "mysql2/promise";
import { readHospitalConfig, requireHospitalConfig, root } from "./hospital-config.mjs";

let failures = 0;
if (
  process.argv.length > 4 ||
  (process.argv.length > 2 && (process.argv[2] !== "--config" || !process.argv[3]))
) {
  console.error("Usage: diagnose.bat [--config path-to-test-config]");
  process.exit(2);
}
const report = (level, label, detail = "") => {
  console.log(`[${level}] ${label}${detail ? `: ${detail}` : ""}`);
  if (level === "FAIL") failures++;
};
const exists = async (file) =>
  access(file).then(
    () => true,
    () => false,
  );
const probe = async (url) => {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(4000) });
  } catch {
    return null;
  }
};
const portAvailable = (port) =>
  new Promise((resolve) => {
    const listener = net.createServer();
    listener.once("error", () => resolve(false));
    listener.listen(Number(port), "127.0.0.1", () => listener.close(() => resolve(true)));
  });
const run = (command, args) =>
  new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: root,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    const timer = setTimeout(() => child.kill(), 10000);
    child.stdout.on("data", (data) => {
      output += data.toString();
    });
    child.stderr.on("data", (data) => {
      output += data.toString();
    });
    child.on("error", () => {
      clearTimeout(timer);
      resolve(false);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve(code === 0);
    });
  });

console.log("HRIS hospital installation diagnostics (read-only)");
const [nodeMajor, nodeMinor] = process.versions.node.split(".").map(Number);
const supportedNode =
  (nodeMajor === 20 && nodeMinor >= 19) || (nodeMajor === 22 && nodeMinor >= 12) || nodeMajor > 22;
report(supportedNode ? "OK" : "FAIL", "Node.js", process.version);
for (const [label, file] of [
  ["Node dependencies", "node_modules/mysql2/package.json"],
  ["Built frontend", "dist/client"],
  ["Built server bundle", "dist/server/index.js"],
  ["PDS template", "Personal Data Sheet/CS Form No. 212 Revised 2026 PDS.xlsx"],
  ["WES template", "WES/Work Experience Sheet.docx"],
  ["DTR template", "server/templates/format.xlsx"],
  [
    "Form 6 template",
    "leave application/CS Form No. 6, Revised 2020 (Application for Leave) (Fillable).xlsx",
  ],
])
  report((await exists(path.join(root, file))) ? "OK" : "FAIL", label);

let config;
try {
  config = requireHospitalConfig(readHospitalConfig(process.argv[3]));
  report("OK", "Hospital configuration", "required values supplied (secrets hidden)");
} catch (error) {
  report("FAIL", "Hospital configuration", error.message);
}

if (config) {
  const python = config.HRIS_PYTHON_EXE;
  report(
    (await run(python, ["-c", "import openpyxl, reportlab, pypdf, zk, docx"])) ? "OK" : "FAIL",
    "Python export packages",
  );
  report((await run(config.HRIS_LIBREOFFICE_EXE, ["--version"])) ? "OK" : "FAIL", "LibreOffice");
  const runtime = path.resolve(config.HRIS_RUNTIME_DIR);
  try {
    const info = await stat(runtime);
    if (!info.isDirectory()) throw new Error("path is not a directory");
    await access(runtime, constants.W_OK);
    report("OK", "Runtime directory", runtime);
  } catch {
    report("FAIL", "Runtime directory", "missing or not writable by this account");
  }
  let connection;
  try {
    connection = await mysql.createConnection({
      host: config.HRIS_DB_HOST,
      port: Number(config.HRIS_DB_PORT),
      user: config.HRIS_DB_USER,
      password: config.HRIS_DB_PASSWORD,
      database: config.HRIS_DB_NAME,
      connectTimeout: 5000,
    });
    await connection.query("SELECT 1");
    report(
      "OK",
      "MySQL connection",
      `${config.HRIS_DB_HOST}:${config.HRIS_DB_PORT}/${config.HRIS_DB_NAME}`,
    );
    const [rows] = await connection.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_name IN ('users','employees')",
      [config.HRIS_DB_NAME],
    );
    const names = new Set(rows.map((row) => row.TABLE_NAME ?? row.table_name));
    for (const name of ["users", "employees"])
      report(names.has(name) ? "OK" : "FAIL", `Required table ${name}`);
  } catch (error) {
    report(
      "FAIL",
      "MySQL connection",
      `${error.code || "connection failed"}; check credentials, SQL import and MySQL service`,
    );
  } finally {
    await connection?.end();
  }
  const api = `http://127.0.0.1:${config.HRIS_API_PORT}`;
  const client = `http://127.0.0.1:${config.HRIS_CLIENT_PORT}`;
  const apiResponse = await probe(`${api}/api/health`);
  const frontendResponse = await probe(`${client}/login`);
  const proxyResponse = await probe(`${client}/api/auth/me`);
  if (!apiResponse && !frontendResponse && !proxyResponse) {
    const available = await Promise.all([
      portAvailable(config.HRIS_API_PORT),
      portAvailable(config.HRIS_CLIENT_PORT),
    ]);
    report(
      available.every(Boolean) ? "WARN" : "FAIL",
      "Running app",
      available.every(Boolean)
        ? "not started; ports are available for startup"
        : "no HRIS response, but one or more configured ports are occupied",
    );
  } else {
    report(
      apiResponse?.ok ? "OK" : "FAIL",
      "API health",
      apiResponse ? `HTTP ${apiResponse.status}` : "no response",
    );
    report(
      frontendResponse?.ok ? "OK" : "FAIL",
      "Frontend",
      frontendResponse ? `HTTP ${frontendResponse.status}` : "no response",
    );
    const contentType = proxyResponse?.headers.get("content-type") || "";
    report(
      proxyResponse?.status === 200 && contentType.includes("json") ? "OK" : "FAIL",
      "Frontend /api routing",
      proxyResponse ? `HTTP ${proxyResponse.status}` : "no response",
    );
  }
}
console.log(
  failures
    ? `Diagnostics failed: ${failures} required check(s).`
    : "Diagnostics passed (warnings may remain).",
);
process.exitCode = failures ? 1 : 0;
