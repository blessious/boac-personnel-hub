import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

function loadEnv() {
  const env = {};
  for (const fileName of ["server/.env.local", "server/.env"]) {
    if (!existsSync(fileName)) continue;
    const text = readFileSync(fileName, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index < 1) continue;
      env[trimmed.slice(0, index).trim()] = trimmed
        .slice(index + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

const env = loadEnv();
const database = env.HRIS_DB_NAME || "hris_db";
const connection = await mysql.createConnection({
  host: env.HRIS_DB_HOST || "localhost",
  user: env.HRIS_DB_USER || "root",
  password: env.HRIS_DB_PASSWORD || "",
  database,
  multipleStatements: true,
});

const migrationPath = path.join("server", "migrations", "2026-06-23_seed_employee_reference_values.sql");
const sql = readFileSync(migrationPath, "utf8");
await connection.query(sql);

const [rows] = await connection.query(
  `SELECT category, COUNT(*) AS count
   FROM hr_reference_values
   GROUP BY category
   ORDER BY category`,
);

console.table(rows);
await connection.end();
