import { spawn } from "node:child_process";
import path from "node:path";

const env = { ...process.env };
const npmCli =
  env.npm_execpath ||
  (process.platform === "win32"
    ? path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js")
    : "npm");
const runNpmThroughNode = Boolean(env.npm_execpath) || process.platform === "win32";
const npmCommand = runNpmThroughNode ? process.execPath : npmCli;
const npmArgs = runNpmThroughNode ? [npmCli, "run", "dev:client"] : ["run", "dev:client"];

if (process.platform === "win32" && env.Path && env.PATH) {
  env.PATH = env.Path;
  delete env.Path;
}

const children = [
  spawn(process.execPath, ["server/index.mjs"], { stdio: "inherit", env }),
  spawn(npmCommand, npmArgs, {
    stdio: "inherit",
    env,
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
