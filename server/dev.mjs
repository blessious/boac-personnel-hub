import { spawn } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const env = { ...process.env };

if (process.platform === "win32" && env.Path && env.PATH) {
  env.PATH = env.Path;
  delete env.Path;
}

const children = [
  spawn(process.execPath, ["server/index.mjs"], { stdio: "inherit", env }),
  spawn(npm, ["run", "dev:client"], {
    stdio: "inherit",
    env,
    shell: process.platform === "win32",
  }),
];

function shutdown(signal) {
  for (const child of children) {
    if (!child.killed) child.kill(signal);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

for (const child of children) {
  child.on("exit", (code) => {
    if (code && code !== 0) {
      shutdown("SIGTERM");
      process.exit(code);
    }
  });
}
