/**
 * Apply missing database migrations via Supabase API.
 * Usage: node scripts/apply-migrations.js
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env
 */
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPath = path.resolve(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) {
    console.error("No .env file found.");
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const eq = line.indexOf("=");
    if (eq > 0) {
      const key = line.slice(0, eq).trim();
      const val = line.slice(eq + 1).trim();
      if (key && val && !key.startsWith("#")) process.env[key] = val;
    }
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

const MIGRATIONS = [
  {
    name: "Add status column",
    sql: `ALTER TABLE sales ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completada';`,
  },
  {
    name: "Fix folio to TEXT",
    sql: `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='folio' AND data_type='integer') THEN ALTER TABLE sales ALTER COLUMN folio TYPE TEXT; END IF; END $$;`,
  },
  {
    name: "Add cancelled columns",
    sql: `
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cancelled BOOLEAN DEFAULT false;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cancelled_by UUID;
`,
  },
];

async function run() {
  console.log("Applying migrations...\n");

  for (const m of MIGRATIONS) {
    console.log(`  ${m.name}...`);
    try {
      const { error } = await supabase.rpc("exec_sql", { sql: m.sql }).single();
      if (error) {
        // exec_sql may not exist, try raw query
        console.log(`    (trying raw query...)`);
        // Fallback: we can't run raw SQL via client JS, user must use SQL Editor
        console.log(`    SKIP - run manually in SQL Editor`);
      } else {
        console.log(`    OK`);
      }
    } catch {
      console.log(`    SKIP - use Supabase SQL Editor instead`);
    }
  }

  console.log("\nIf some migrations were skipped, run this in Supabase SQL Editor:");
  console.log("https://supabase.com/dashboard/project/pssbrtigxkmnpszrgsgr/sql/new");
  console.log("\n--- COPY BELOW ---");
  for (const m of MIGRATIONS) {
    console.log(`\n-- ${m.name}`);
    console.log(m.sql.trim());
  }
  console.log("\n--- END COPY ---");
}

run().catch(e => { console.error(e); process.exit(1); });
