/**
 * Export all Supabase tables to JSON files.
 * Usage: node scripts/export-db.js
 * 
 * Requires a .env file with:
 *   SUPABASE_URL=https://xxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...
 */
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPath = path.resolve(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) {
    console.error("No .env file found. Create one with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
  }
}

loadEnv();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

const TABLES = [
  "sales", "sale_items", "sale_item_modifiers", "cash_register",
  "products", "categories", "customers", "expenses", "settings",
  "profiles", "menus", "inventory_items", "recipes",
  "modifier_groups", "modifiers", "product_modifiers",
];

const OUT_DIR = path.resolve(__dirname, "..", "db-export");

async function exportTable(table) {
  console.log(`Exporting ${table}...`);
  const { data, error } = await supabase.from(table).select("*");
  if (error) { console.error(`  SKIP ${table}: ${error.message}`); return null; }
  console.log(`  ${data.length} rows`);
  return data;
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const allData = {};
  for (const table of TABLES) {
    const data = await exportTable(table);
    if (data) {
      allData[table] = data;
      fs.writeFileSync(path.join(OUT_DIR, `${table}.json`), JSON.stringify(data, null, 2));
    }
  }
  fs.writeFileSync(path.join(OUT_DIR, "full-export.json"), JSON.stringify(allData, null, 2));
  const total = Object.values(allData).reduce((s, a) => s + a.length, 0);
  console.log(`\nDone! ${Object.keys(allData).length} tables, ${total} rows -> db-export/`);
}

main().catch(e => { console.error(e); process.exit(1); });
