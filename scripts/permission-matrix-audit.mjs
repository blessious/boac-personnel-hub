import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverSource = await readFile(path.join(root, "server", "index.mjs"), "utf8");
const authSource = await readFile(path.join(root, "src", "lib", "auth.tsx"), "utf8");
const routeFiles = [
  "attendance.tsx",
  "employees.references.tsx",
  "leave.tsx",
  "movements.tsx",
  "plantilla.tsx",
  "schedules.tsx",
  "service-records.tsx",
].map((file) => path.join(root, "src", "routes", file));

const permissionsBlock =
  serverSource.match(/const PERMISSIONS = \[(.*?)\];\r?\nconst PERMISSION_KEYS/s)?.[1] || "";
const serverKeys = new Set(
  [...permissionsBlock.matchAll(/key:\s*"([^"]+)"/g)].map((match) => match[1]),
);
const typeBlock =
  authSource.match(/export type PermissionKey =\r?\n(.*?);\r?\n\r?\nexport function/s)?.[1] || "";
const clientKeys = new Set([...typeBlock.matchAll(/"([^"]+)"/g)].map((match) => match[1]));
const missingClientKeys = [...serverKeys].filter((key) => !clientKeys.has(key));
const missingServerKeys = [...clientKeys].filter((key) => !serverKeys.has(key));
if (missingClientKeys.length || missingServerKeys.length) {
  throw new Error(
    `Permission key drift detected. Missing in client: ${missingClientKeys.join(", ") || "none"}; missing in server: ${missingServerKeys.join(", ") || "none"}`,
  );
}

for (const file of routeFiles) {
  const source = await readFile(file, "utf8");
  if (/can(Read|Write)HrRecords\(/.test(source)) {
    throw new Error(`Role-based authorization helper remains in ${path.relative(root, file)}`);
  }
}

console.log(`Permission matrix audit passed: ${serverKeys.size} keys are synchronized.`);
