import { config } from 'dotenv';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  const envConfig = config({ path: '.env.local' });
  if (envConfig.error) throw envConfig.error;
} catch {
  config();
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is not set in .env.local');
  process.exit(1);
}

const migrationFile = process.argv[2] || '001_initial_schema.sql';
const sql = readFileSync(
  path.resolve(__dirname, '../supabase/migrations', migrationFile),
  'utf8'
);

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  console.log(`Applying migration: ${migrationFile}`);
  await client.connect();
  await client.query(sql);
  console.log('Migration applied successfully.');
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
