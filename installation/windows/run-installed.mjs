import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import mysql from "mysql2/promise";
import net from "node:net";
import { readHospitalConfig, requireHospitalConfig, root } from "./hospital-config.mjs";

const configFile =
  process.argv[2] === "--config" && process.argv.length === 4 ? process.argv[3] : undefined;
if (process.argv.length > 2 && !configFile)
  throw new Error("Usage: start-installed.bat [--config path]");
const config = requireHospitalConfig(readHospitalConfig(configFile));
const runtime = path.resolve(config.HRIS_RUNTIME_DIR);
await fs.mkdir(runtime, { recursive: true });
const lockPath = path.join(runtime, "hris-installed.pid");
const stopPath = path.join(runtime, "hris-installed.stop");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};
let lock;
try {
  lock = await fs.open(lockPath, "wx");
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  const prior = Number((await fs.readFile(lockPath, "utf8")).trim());
  if (prior > 0 && alive(prior))
    throw new Error(`HRIS installed launcher is already running (PID ${prior})`);
  await fs.rm(lockPath);
  lock = await fs.open(lockPath, "wx");
}
await lock.writeFile(String(process.pid));
await lock.close();
await fs.rm(stopPath, { force: true });
let api;
let frontend;
let stopping = false;
const log = (message) => console.log(`[${new Date().toISOString()}] ${message}`);
async function shutdown() {
  if (stopping) return;
  stopping = true;
  for (const child of [frontend, api]) if (child && child.exitCode === null) child.kill();
  await sleep(500);
  await fs.rm(stopPath, { force: true });
  const owner = Number((await fs.readFile(lockPath, "utf8").catch(() => "0")).trim());
  if (owner === process.pid) await fs.rm(lockPath, { force: true });
}
process.on("SIGINT", () => {
  shutdown().then(() => process.exit(0));
});
process.on("SIGTERM", () => {
  shutdown().then(() => process.exit(0));
});
async function checkDatabase() {
  const db = await mysql.createConnection({
    host: config.HRIS_DB_HOST,
    port: Number(config.HRIS_DB_PORT),
    user: config.HRIS_DB_USER,
    password: config.HRIS_DB_PASSWORD,
    database: config.HRIS_DB_NAME,
    connectTimeout: 5000,
  });
  try {
    await db.query("SELECT 1");
  } finally {
    await db.end();
  }
}
async function requireFreePort(port) {
  await new Promise((resolve, reject) => {
    const listener = net.createServer();
    listener.once("error", () => reject(new Error(`Port ${port} is already in use`)));
    listener.listen(Number(port), "127.0.0.1", () => listener.close(resolve));
  });
}
async function waitForResponse(url, accepted, child) {
  for (let attempt = 0; attempt < 30; attempt++) {
    if (child.exitCode !== null)
      throw new Error(`Process exited with code ${child.exitCode}; inspect runtime logs`);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (accepted(response)) return;
    } catch {
      /* Retry while application initializes. */
    }
    await sleep(1000);
  }
  throw new Error(`No healthy response from ${url}; inspect runtime logs`);
}
async function start(name, args) {
  const out = await fs.open(path.join(runtime, `${name}.log`), "a");
  const err = await fs.open(path.join(runtime, `${name}.err.log`), "a");
  const child = spawn(process.execPath, args, {
    cwd: root,
    windowsHide: true,
    env: {
      ...process.env,
      ...config,
      NODE_ENV: "production",
      HRIS_DEV_AUTO_BOOTSTRAP: "0",
      HRIS_API_PORT: config.HRIS_API_PORT,
      HRIS_BIND_HOST: "127.0.0.1",
    },
    stdio: ["ignore", out.fd, err.fd],
  });
  await out.close();
  await err.close();
  child.on("error", (error) => log(`${name} failed: ${error.message}`));
  return child;
}
try {
  await requireFreePort(config.HRIS_API_PORT);
  await requireFreePort(config.HRIS_CLIENT_PORT);
  log("Waiting for configured MySQL database");
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    if (
      await fs.stat(stopPath).then(
        () => true,
        () => false,
      )
    )
      throw new Error("Startup cancelled");
    try {
      await checkDatabase();
      ready = true;
      break;
    } catch {
      await sleep(10000);
    }
  }
  if (!ready) throw new Error("MySQL did not become available within five minutes");
  log("Database connected; starting API");
  api = await start("api", ["server/index.mjs"]);
  await waitForResponse(
    `http://127.0.0.1:${config.HRIS_API_PORT}/api/health`,
    (response) => response.ok,
    api,
  );
  log("API healthy; starting frontend");
  frontend = await start("frontend", [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    config.HRIS_CLIENT_PORT,
    "--strictPort",
  ]);
  await waitForResponse(
    `http://127.0.0.1:${config.HRIS_CLIENT_PORT}/login`,
    (response) => response.ok,
    frontend,
  );
  await waitForResponse(
    `http://127.0.0.1:${config.HRIS_CLIENT_PORT}/api/auth/me`,
    (response) => response.ok && (response.headers.get("content-type") || "").includes("json"),
    frontend,
  );
  log("HRIS ready on local frontend port");
  while (!stopping) {
    if (
      await fs.stat(stopPath).then(
        () => true,
        () => false,
      )
    )
      break;
    if (api.exitCode !== null || frontend.exitCode !== null)
      throw new Error("HRIS child process stopped unexpectedly");
    await sleep(1000);
  }
} catch (error) {
  log(`Startup/runtime failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await shutdown();
}
