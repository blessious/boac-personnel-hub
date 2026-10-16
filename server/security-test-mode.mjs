import path from "node:path";
import os from "node:os";

// Validate before loading local environment files or opening any database connection.
export function securityTestMode(env = process.env) {
  if (env.HRIS_SECURITY_TEST !== "1") return false;
  const name = env.HRIS_DB_NAME || "";
  const runtime = path.resolve(env.HRIS_RUNTIME_DIR || ".");
  const relative = path.relative(os.tmpdir(), runtime);
  const validPort = (value) =>
    /^\d+$/.test(value || "") && Number(value) > 0 && Number(value) <= 65535;
  if (
    env.NODE_ENV !== "test" ||
    !/^hris_security_[a-f0-9]{24}$/.test(name) ||
    !["127.0.0.1", "localhost", "::1"].includes(env.HRIS_DB_HOST) ||
    !validPort(env.HRIS_DB_PORT) ||
    !env.HRIS_DB_USER ||
    env.HRIS_DB_PASSWORD === undefined ||
    !validPort(env.HRIS_API_PORT) ||
    Number(env.HRIS_API_PORT) === 47102 ||
    env.HRIS_ADMS_PORT !== "0" ||
    relative.startsWith("..") ||
    path.isAbsolute(relative) ||
    !path.basename(runtime).startsWith("hris-security-")
  )
    throw new Error("Unsafe security-test configuration; refusing server initialization");
  return true;
}
