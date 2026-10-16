import fs from "node:fs/promises";
import path from "node:path";
import { readHospitalConfig, requireHospitalConfig } from "./hospital-config.mjs";

const configFile =
  process.argv[2] === "--config" && process.argv.length === 4 ? process.argv[3] : undefined;
if (process.argv.length > 2 && !configFile)
  throw new Error("Usage: stop-installed.bat [--config path]");
const config = requireHospitalConfig(readHospitalConfig(configFile));
const runtime = path.resolve(config.HRIS_RUNTIME_DIR);
const lockPath = path.join(runtime, "hris-installed.pid");
let pid;
try {
  pid = Number((await fs.readFile(lockPath, "utf8")).trim());
} catch {
  console.log("Installed HRIS is not running.");
  process.exit(0);
}
try {
  process.kill(pid, 0);
} catch {
  console.error("Stale HRIS PID file; launcher is not running.");
  process.exit(1);
}
await fs.writeFile(path.join(runtime, "hris-installed.stop"), String(pid), { flag: "w" });
for (let attempt = 0; attempt < 20; attempt++) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (
    !(await fs.stat(lockPath).then(
      () => true,
      () => false,
    ))
  ) {
    console.log("Installed HRIS stopped.");
    process.exit(0);
  }
}
console.error("HRIS did not stop within ten seconds; inspect launcher and child processes.");
process.exit(1);
