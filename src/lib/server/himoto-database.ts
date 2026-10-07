import 'server-only';
import { Pool } from 'pg';

const globalForDatabase = globalThis as typeof globalThis & { himotoPool?: Pool };

function createPool() {
  const rawUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
  if (!rawUrl) throw new Error('Thiếu DATABASE_URL cho kết nối Supabase.');

  // sslmode=require means encrypted transport. The supplied Supabase pooler
  // chain is self-signed in this environment, so keep TLS encryption enabled.
  const url = new URL(rawUrl);
  url.searchParams.delete('sslmode');
  return new Pool({
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: false },
    max: 4,
    connectionTimeoutMillis: 8_000,
    idleTimeoutMillis: 30_000,
  });
}

export const himotoPool = globalForDatabase.himotoPool ?? createPool();
if (process.env.NODE_ENV !== 'production') globalForDatabase.himotoPool = himotoPool;
