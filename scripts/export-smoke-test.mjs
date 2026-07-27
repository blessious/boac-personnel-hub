import { access } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

function loadServerEnv() {
  for (const fileName of [".env.local", ".env", ".env.defaults"]) {
    try {
      const text = readFileSync(path.join(process.cwd(), "server", fileName), "utf8");
      for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const index = trimmed.indexOf("=");
        if (index < 1) continue;
        const key = trimmed.slice(0, index).trim();
        const value = trimmed
          .slice(index + 1)
          .trim()
          .replace(/^["']|["']$/g, "");
        if (!(key in process.env)) process.env[key] = value;
      }
    } catch {
      // Host environment can provide values instead.
    }
  }
}

loadServerEnv();

const root = process.cwd();
const python = process.env.HRIS_PYTHON_EXE || process.env.PYTHON_EXE || "python";
const requiredFiles = [
  ["PDS template", path.join(root, "Personal Data Sheet", "CS Form No. 212 Revised 2026 PDS.xlsx")],
  ["WES template", path.join(root, "WES", "Work Experience Sheet.docx")],
  ["DTR template", path.join(root, "server", "templates", "format.xlsx")],
  [
    "Leave Form 6 template",
    path.join(
      root,
      "leave application",
      "CS Form No. 6, Revised 2020 (Application for Leave) (Fillable).xlsx",
    ),
  ],
];
const pythonScripts = [
  "dtr_excel.py",
  "dtr_pdf.py",
  "leave_form6_excel.py",
  "merge_pdfs.py",
  "pds_excel.py",
  "personnel_plantilla_report.py",
  "service_record_export.py",
  "wes_docx.py",
].map((name) => path.join(root, "server", name));

function run(command, args, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, windowsHide: true });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
      child.kill();
      reject(new Error(`${command} ${args.join(" ")} timed out`));
    }, timeoutMs);
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr.trim() || stdout.trim() || `${command} exited with ${code}`));
    });
  });
}

let failed = false;

for (const [label, filePath] of requiredFiles) {
  try {
    await access(filePath);
    console.log(`OK template: ${label}`);
  } catch (error) {
    failed = true;
    console.error(`MISSING template: ${label} (${filePath})`);
    console.error(error.message);
  }
}

try {
  await run(python, ["--version"], 10000);
  console.log(`OK python: ${python}`);
} catch (error) {
  failed = true;
  console.error(`PYTHON unavailable: ${python}`);
  console.error(error.message);
}

for (const script of pythonScripts) {
  try {
    await access(script);
    await run(python, ["-m", "py_compile", script]);
    console.log(`OK compile: ${path.basename(script)}`);
  } catch (error) {
    failed = true;
    console.error(`FAILED compile: ${script}`);
    console.error(error.message);
  }
}

if (failed) process.exit(1);
console.log("Export smoke test passed.");
