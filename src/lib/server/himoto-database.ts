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

let pool = globalForDatabase.himotoPool;
function getPool() {
  pool ??= createPool();
  if (process.env.NODE_ENV !== 'production') globalForDatabase.himotoPool = pool;
  return pool;
}

// Resolve credentials only when a permitted local handler uses the database.
// Production handlers return 404 before requesting a connection.
export const himotoPool: Pick<Pool, 'query' | 'connect'> = {
  get query() { return getPool().query.bind(getPool()); },
  get connect() { return getPool().connect.bind(getPool()); },
};
