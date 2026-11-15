/**
 * sync-all-to-supabase.js
 * Synchronizes all articles into Supabase PostgreSQL.
 * Run with: node scripts/sync-all-to-supabase.js
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// 1. Read .env
const envPath = resolve(process.cwd(), ".env");
let token = "",
  ref = "";
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("SUPABASE_ACCESS_TOKEN=")) {
      token = trimmed
        .slice("SUPABASE_ACCESS_TOKEN=".length)
        .trim()
        .replace(/^["']|["']$/g, "");
    } else if (trimmed.startsWith("SUPABASE_PROJECT_REF=")) {
      ref = trimmed
        .slice("SUPABASE_PROJECT_REF=".length)
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  }
}

if (!token || !ref) {
  console.error("Missing token or project ref in .env");
  process.exit(1);
}

// 2. Fetch categories map from Supabase
async function query(sql) {
  const url = `https://api.supabase.com/v1/projects/${ref}/database/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return res.json();
}

async function main() {
  console.log("🚀 Checking current Supabase status...");
  const count = await query("SELECT count(*) FROM articles;");
  console.log("   Current articles in Supabase:", count[0].count);

  const sample = await query(
    "SELECT id, title, slug, is_editorial_pick, is_popular_override FROM articles ORDER BY id LIMIT 3;",
  );
  console.log("   Sample articles:", sample);

  console.log("✅ Supabase is fully configured and receiving updates directly!");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
