/**
 * run-migration.js
 * Applies a SQL migration file to the Supabase project using the Management API.
 *
 * Usage:
 *   node scripts/run-migration.js <path-to-sql-file>
 *
 * Requires SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF in .env
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// ── Load .env manually (no dotenv dependency needed) ─────────────────────────
const envPath = resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = val;
  }
}

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const REF = process.env.SUPABASE_PROJECT_REF;

if (!TOKEN || !REF) {
  console.error("❌  SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF must be set in .env");
  process.exit(1);
}

// ── Determine SQL file ────────────────────────────────────────────────────────
const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error("Usage: node scripts/run-migration.js <path-to-sql-file>");
  process.exit(1);
}

const sqlPath = resolve(process.cwd(), sqlFile);
if (!existsSync(sqlPath)) {
  console.error(`❌  File not found: ${sqlPath}`);
  process.exit(1);
}

const sql = readFileSync(sqlPath, "utf8");
console.log(`🚀  Running migration: ${sqlFile}`);
console.log(`    Project : ${REF}`);
console.log(`    Size    : ${sql.length} chars`);

// ── POST to Management API ────────────────────────────────────────────────────
async function run() {
  const url = `https://api.supabase.com/v1/projects/${REF}/database/query`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  const text = await response.text();

  if (!response.ok) {
    let msg = text;
    try {
      msg = JSON.parse(text)?.message ?? text;
    } catch {}
    console.error(`❌  Migration failed (HTTP ${response.status}): ${msg}`);
    process.exit(1);
  }

  // Check if the response contains an error message even with 200 status
  try {
    const result = JSON.parse(text);
    if (result && typeof result === "object" && !Array.isArray(result) && result.message) {
      // Supabase returns { message: "..." } for SQL errors with 200 status sometimes
      console.error(`❌  SQL error: ${result.message}`);
      process.exit(1);
    }
    console.log("✅  Migration applied successfully.");
    if (Array.isArray(result) && result.length) {
      console.log("    Result preview:", JSON.stringify(result.slice(0, 3), null, 2));
    }
  } catch {
    console.log("✅  Migration applied successfully.");
  }
}

run().catch((err) => {
  console.error("❌  Unexpected error:", err.message);
  process.exit(1);
});
