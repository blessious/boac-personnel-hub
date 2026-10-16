import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";
import { once } from "node:events";
import mysql from "mysql2/promise";
import { root } from "./hospital-config.mjs";

async function freePort() {
  const server = net.createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

function run(args, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: root, windowsHide: true });
    let output = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`Timed out: ${args[0]}`));
    }, timeout);
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.stderr.on("data", (chunk) => {
      output += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      resolve({ code, output });
    });
  });
}

test(
  "installed launcher, diagnostics, frontend API routing and clean restart",
  { timeout: 180000 },
  async () => {
    for (const key of ["HOST", "PORT", "USER", "PASSWORD"]) {
      assert.notEqual(
        process.env[`HRIS_TEST_DB_${key}`],
        undefined,
        `Set HRIS_TEST_DB_${key} explicitly for a disposable MySQL test`,
      );
    }
    assert.ok(
      ["localhost", "127.0.0.1", "::1"].includes(process.env.HRIS_TEST_DB_HOST),
      "Test MySQL must be local",
    );
    const connection = await mysql.createConnection({
      host: process.env.HRIS_TEST_DB_HOST,
      port: Number(process.env.HRIS_TEST_DB_PORT),
      user: process.env.HRIS_TEST_DB_USER,
      password: process.env.HRIS_TEST_DB_PASSWORD,
    });
    const database = `hris_install_test_${crypto.randomBytes(12).toString("hex")}`;
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "hris-install-test-"));
    const runtime = path.join(directory, "runtime");
    await fs.mkdir(runtime);
    const apiPort = await freePort();
    const clientPort = await freePort();
    assert.notEqual(apiPort, clientPort);
    const python =
      process.env.HRIS_TEST_PYTHON_EXE || path.join(root, ".venv", "Scripts", "python.exe");
    const libreOffice =
      process.env.HRIS_TEST_LIBREOFFICE_EXE ||
      "C:\\Program Files\\LibreOffice\\program\\soffice.com";
    const configPath = path.join(directory, ".env.local");
    const entries = {
      HRIS_DB_HOST: process.env.HRIS_TEST_DB_HOST,
      HRIS_DB_PORT: process.env.HRIS_TEST_DB_PORT,
      HRIS_DB_USER: process.env.HRIS_TEST_DB_USER,
      HRIS_DB_PASSWORD: process.env.HRIS_TEST_DB_PASSWORD,
      HRIS_DB_NAME: database,
      HRIS_API_PORT: String(apiPort),
      HRIS_CLIENT_PORT: String(clientPort),
      HRIS_ADMS_PORT: "0",
      HRIS_RUNTIME_DIR: runtime,
      HRIS_PYTHON_EXE: python,
      HRIS_LIBREOFFICE_EXE: libreOffice,
      HRIS_DEV_AUTO_BOOTSTRAP: "0",
    };
    const writeConfig = (file, values) =>
      fs.writeFile(
        file,
        Object.entries(values)
          .map(([key, value]) => `${key}=${value}`)
          .join("\n"),
      );
    let launcher;
    let created = false;
    async function stop() {
      if (!launcher || launcher.exitCode !== null) return;
      const result = await run(["installation/windows/stop-installed.mjs", "--config", configPath]);
      assert.equal(result.code, 0, result.output);
      if (launcher.exitCode === null) await once(launcher, "exit");
      launcher = null;
    }
    try {
      await connection.query(
        `CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
      );
      created = true;
      await writeConfig(configPath, entries);
      let diagnostic = await run(["installation/windows/diagnose-hospital.mjs", "--config", configPath]);
      assert.equal(diagnostic.code, 1, "Missing imported tables must fail preflight");
      assert.match(diagnostic.output, /Required table users/);

      async function start() {
        launcher = spawn(process.execPath, ["installation/windows/run-installed.mjs", "--config", configPath], {
          cwd: root,
          windowsHide: true,
        });
        let output = "";
        launcher.stdout.on("data", (chunk) => {
          output += chunk;
        });
        launcher.stderr.on("data", (chunk) => {
          output += chunk;
        });
        for (let i = 0; i < 900; i++) {
          if (launcher.exitCode !== null) throw new Error(`Launcher exited: ${output}`);
          if (output.includes("HRIS ready on local frontend port")) return;
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        throw new Error(`Launcher timed out: ${output}`);
      }
      await start();
    diagnostic = await run(["installation/windows/diagnose-hospital.mjs", "--config", configPath]);
      assert.equal(diagnostic.code, 0, diagnostic.output);
      const base = `http://127.0.0.1:${clientPort}`;
      const request = (route, options = {}) =>
        fetch(base + route, { ...options, headers: { Origin: base, ...(options.headers || {}) } });
      const bootstrap = await request("/api/auth/bootstrap-super-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Synthetic Administrator",
          username: "install-test",
          password: "Installation-Test-42!",
          confirmPassword: "Installation-Test-42!",
        }),
      });
      assert.equal(bootstrap.status, 201, await bootstrap.text());
      const login = await request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "install-test", password: "Installation-Test-42!" }),
      });
      assert.equal(login.status, 200, await login.text());
      const cookie = login.headers.get("set-cookie")?.split(";")[0];
      assert.ok(cookie);
      const authenticated = { Cookie: cookie };
      const me = await request("/api/auth/me", { headers: authenticated });
      assert.equal(me.status, 200);
      assert.equal((await me.json()).user.username, "install-test");
      const report = await request("/api/reports/personnel-plantilla", { headers: authenticated });
      assert.equal(report.status, 200, await report.text());
      const exportResponse = await request("/api/reports/personnel-plantilla/export/xlsx", {
        method: "POST",
        headers: authenticated,
      });
      assert.equal(
        exportResponse.status,
        200,
        exportResponse.status === 200 ? "" : await exportResponse.text(),
      );
      const exported = await exportResponse.json();
      const file = await request(exported.downloadUrl, { headers: authenticated });
      assert.equal(file.status, 200);
      assert.ok((await file.arrayBuffer()).byteLength > 100);

      const occupiedConfig = path.join(directory, "occupied.env");
      await writeConfig(occupiedConfig, {
        ...entries,
        HRIS_RUNTIME_DIR: path.join(directory, "other-runtime"),
      });
    const occupied = await run(["installation/windows/run-installed.mjs", "--config", occupiedConfig]);
      assert.equal(occupied.code, 1);
      assert.match(occupied.output, /already in use/);
      await stop();
      await start();
      await stop();

      const badConfig = path.join(directory, "bad.env");
      await writeConfig(badConfig, { ...entries, HRIS_DB_PASSWORD: "deliberately-wrong" });
    const bad = await run(["installation/windows/diagnose-hospital.mjs", "--config", badConfig]);
      assert.equal(bad.code, 1);
      assert.match(bad.output, /MySQL connection/);
      assert.doesNotMatch(bad.output, /deliberately-wrong/);
      const missingPythonConfig = path.join(directory, "missing-python.env");
      await writeConfig(missingPythonConfig, {
        ...entries,
        HRIS_PYTHON_EXE: path.join(directory, "missing-python.exe"),
      });
      const missingPython = await run([
        "installation/windows/diagnose-hospital.mjs",
        "--config",
        missingPythonConfig,
      ]);
      assert.equal(missingPython.code, 1);
      assert.match(missingPython.output, /FAIL.*Python export packages/);
    } finally {
      if (launcher?.exitCode === null) await stop().catch(() => launcher.kill());
      if (created && /^hris_install_test_[a-f0-9]{24}$/.test(database))
        await connection.query(`DROP DATABASE \`${database}\``);
      await connection.end();
      await fs.rm(directory, { recursive: true, force: true });
    }
  },
);
