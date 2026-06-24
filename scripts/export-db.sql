-- ============================================================
-- SQL EXPORT: Run this in Supabase SQL Editor to dump all data
-- Copy the output and save as a backup.
-- ============================================================

-- Schema: Generate CREATE TABLE statements
-- (run this in psql or use Supabase Dashboard > Database > Backups)

-- Data: Export all rows as CSV via COPY
\copy (SELECT * FROM sales) TO '/tmp/sales.csv' WITH CSV HEADER;
\copy (SELECT * FROM sale_items) TO '/tmp/sale_items.csv' WITH CSV HEADER;
\copy (SELECT * FROM sale_item_modifiers) TO '/tmp/sale_item_modifiers.csv' WITH CSV HEADER;
\copy (SELECT * FROM cash_register) TO '/tmp/cash_register.csv' WITH CSV HEADER;
\copy (SELECT * FROM products) TO '/tmp/products.csv' WITH CSV HEADER;
\copy (SELECT * FROM categories) TO '/tmp/categories.csv' WITH CSV HEADER;
\copy (SELECT * FROM customers) TO '/tmp/customers.csv' WITH CSV HEADER;
\copy (SELECT * FROM expenses) TO '/tmp/expenses.csv' WITH CSV HEADER;
\copy (SELECT * FROM settings) TO '/tmp/settings.csv' WITH CSV HEADER;
\copy (SELECT * FROM profiles) TO '/tmp/profiles.csv' WITH CSV HEADER;
\copy (SELECT * FROM menus) TO '/tmp/menus.csv' WITH CSV HEADER;

-- Alternative: JSON export via Supabase API (use the Node.js script instead)
-- node scripts/export-db.js
