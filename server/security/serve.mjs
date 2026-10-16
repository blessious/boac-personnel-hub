import { spawn } from "node:child_process";
import { once } from "node:events";
import { startHarness, password } from "./harness.mjs";

const h = await startHarness({ clientPort: 47313 });
const frontend = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "47313", "--strictPort"],
  {
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, HRIS_SECURITY_TEST: "1", HRIS_API_PORT: new URL(h.origin).port },
  },
);
frontend.stdout.pipe(process.stdout);
frontend.stderr.pipe(process.stderr);
console.log(
  `Isolated browser fixture: http://127.0.0.1:47313\nAccounts: super-admin, admin, hr, approver, employee, viewer, other\nSynthetic password: ${password}\nEmployee A: ${h.a}\nEmployee B: ${h.b}\nPress Enter to stop and remove the test database.`,
);
await Promise.race([
  once(process.stdin, "data"),
  once(frontend, "exit"),
  once(process, "SIGINT"),
  once(process, "SIGTERM"),
]);
if (frontend.exitCode === null) {
  const ended = once(frontend, "exit");
  frontend.kill();
  await ended;
}
await h.close();
