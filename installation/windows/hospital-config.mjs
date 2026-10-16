import { readFileSync } from "node:fs";
import path from "node:path";

export const root = path.resolve(import.meta.dirname, "..", "..");
export const envPath = path.join(root, "server", ".env.local");

export function readHospitalConfig(filePath = envPath) {
  let source;
  try {
    source = readFileSync(filePath, "utf8");
  } catch {
    throw new Error(
      "server/.env.local is missing. Copy installation/windows/.env.hospital.example and configure it first.",
    );
  }
  const values = {};
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

export function requireHospitalConfig(values) {
  const required = [
    "HRIS_DB_HOST",
    "HRIS_DB_PORT",
    "HRIS_DB_USER",
    "HRIS_DB_PASSWORD",
    "HRIS_DB_NAME",
    "HRIS_API_PORT",
    "HRIS_CLIENT_PORT",
    "HRIS_RUNTIME_DIR",
    "HRIS_PYTHON_EXE",
    "HRIS_LIBREOFFICE_EXE",
  ];
  const missing = required.filter((key) => !values[key] || values[key].startsWith("CHANGE_ME"));
  if (missing.length) throw new Error(`Configure ${missing.join(", ")} in server/.env.local`);
  for (const key of ["HRIS_DB_PORT", "HRIS_API_PORT", "HRIS_CLIENT_PORT"]) {
    const value = Number(values[key]);
    if (!Number.isInteger(value) || value < 1 || value > 65535)
      throw new Error(`${key} must be a valid port`);
  }
  if (values.HRIS_API_PORT === values.HRIS_CLIENT_PORT) {
    throw new Error("HRIS_API_PORT and HRIS_CLIENT_PORT must be different");
  }
  if (values.HRIS_DEV_AUTO_BOOTSTRAP === "1")
    throw new Error("HRIS_DEV_AUTO_BOOTSTRAP must not be 1 for hospital installation");
  if (values.HRIS_DB_NAME === "hris_muni" && values.HRIS_DB_USER === "root") {
    throw new Error(
      "Replace the development database defaults with explicit hospital database settings",
    );
  }
  return values;
}
