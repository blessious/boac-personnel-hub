import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const serverDir = join(process.cwd(), "dist", "server");
const indexEntry = join(serverDir, "index.js");
const previewEntry = join(serverDir, "server.js");

if (existsSync(indexEntry)) {
  copyFileSync(indexEntry, previewEntry);
}
