const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const bcrypt = require('bcryptjs');
const { NextRequest } = require('next/server');
const root = path.resolve(__dirname, '../src');
const cache = new Map();
function load(filename) {
  const file = filename.endsWith('.ts') ? filename : `${filename}.ts`;
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const javascript = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const localRequire = name => name === 'server-only' ? {} : name.startsWith('@/') ? load(path.join(root, name.slice(2))) : name.startsWith('.') ? load(path.resolve(path.dirname(file), name)) : require(name);
  new Function('require', 'module', 'exports', javascript)(localRequire, module, module.exports);
  return module.exports;
}

async function run() {
  const session = load(path.join(root, 'lib/server/management-session'));
  const checks = [];
  const key = 'unit-test-session-key-not-for-real-use';
  const now = 1_800_000_000_000;
  const token = session.signSession(7, key, now);
  assert.equal(session.verifySession(token, key, now), 7);
  assert.equal(session.verifySession(token, 'wrong-key', now), null);
  assert.equal(session.verifySession(token, key, now + session.SESSION_SECONDS * 1000), null);
  const [body, signature] = token.split('.');
  const modified = Buffer.from(JSON.stringify({ id: 1, expires: now + 999999 })).toString('base64url');
  assert.equal(session.verifySession(`${modified}.${signature}`, key, now), null);
  for (const invalid of [undefined, '', 'x.y', `${body}.${signature}.extra`, 'x'.repeat(513)]) assert.equal(session.verifySession(invalid, key, now), null);
  checks.push('signed sessions reject tampering, wrong keys, expiry, and malformed cookies');

  const password = 'A test password used only in unit tests';
  const account = { id: '7', name: 'QA administrator', email: 'qa@example.invalid', password: (await bcrypt.hash(password, 10)).replace('$2b$', '$2y$'), role_id: '1', role: 'admin', role_slug: 'quan-tri-vien', status: 'active' };
  let row = account;
  const queries = [];
  const database = { query: async (sql, values) => { queries.push({ sql, values }); return { rows: row ? [row] : [] }; } };
  assert.deepEqual(await session.authenticateAccount(account.email, password, database), { id: 7, name: account.name, email: account.email });
  assert.deepEqual(queries[0].values, [account.email]);
  assert(queries.every(query => query.sql.startsWith('SELECT')));
  await assert.rejects(session.authenticateAccount(account.email, 'wrong', database), error => error.status === 401);
  row = null;
  await assert.rejects(session.authenticateAccount(account.email, password, database), error => error.status === 401);
  row = { ...account, status: 'deactive' };
  await assert.rejects(session.authenticateAccount(account.email, password, database), error => error.status === 401);
  row = { ...account, role_id: '3', role: 'nhan-vien', role_slug: 'nhan-vien' };
  await assert.rejects(session.authenticateAccount(account.email, password, database), error => error.status === 403);
  checks.push('existing Laravel bcrypt hashes work; invalid, missing, inactive, and non-admin accounts are rejected without writes');

  const previousKey = process.env.MANAGEMENT_SESSION_SECRET;
  process.env.MANAGEMENT_SESSION_SECRET = key;
  try {
    const current = session.signSession(7);
    row = account;
    assert.equal((await session.userFromSession(current, database)).id, 7);
    row = { ...account, status: 'deactive' };
    assert.equal(await session.userFromSession(current, database), null);
    row = { ...account, role_id: '3', role: 'nhan-vien', role_slug: 'nhan-vien' };
    assert.equal(await session.userFromSession(current, database), null);
    row = null;
    assert.equal(await session.userFromSession(current, database), null);
  } finally { if (previousKey === undefined) delete process.env.MANAGEMENT_SESSION_SECRET; else process.env.MANAGEMENT_SESSION_SECRET = previousKey; }
  checks.push('sessions re-check account activity, deletion, and administrator permissions');

  const email = 'rate-limit@example.invalid';
  session.clearLoginLimit(email);
  for (let i = 0; i < 10; i++) session.checkLoginLimit(email, now);
  assert.throws(() => session.checkLoginLimit(email.toUpperCase(), now), error => error.status === 429);
  session.checkLoginLimit(email, now + 15 * 60 * 1000);
  session.clearLoginLimit(email);
  session.checkLoginLimit(email, now);
  session.clearLoginLimit(email);
  checks.push('login throttling is case-insensitive and allows retry after the interval');

  const previousEnv = { NODE_ENV: process.env.NODE_ENV, NEXT_PUBLIC_MANAGEMENT_DATA_SOURCE: process.env.NEXT_PUBLIC_MANAGEMENT_DATA_SOURCE, NEXT_PUBLIC_MANAGEMENT_API_MODE: process.env.NEXT_PUBLIC_MANAGEMENT_API_MODE };
  try {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_MANAGEMENT_DATA_SOURCE = 'api';
    process.env.NEXT_PUBLIC_MANAGEMENT_API_MODE = 'supabase-local';
    const request = new NextRequest('http://localhost/api/auth/customers');
    assert.equal((await session.protectDatabaseRequest(request)).status, 404);
    process.env.NODE_ENV = 'development';
    assert.equal((await session.protectDatabaseRequest(request)).status, 401);
    assert.equal((await session.protectDatabaseRequest(new NextRequest('http://localhost/api/auth/customers', { method: 'POST', headers: { Origin: 'https://other.invalid' } }))).status, 403);
    assert.equal(session.sameOrigin(new NextRequest('http://localhost/api/session', { method: 'POST', headers: { Origin: 'http://localhost' } })), true);
    assert.equal(session.sameOrigin(new NextRequest('http://127.0.0.1:3000/api/session', { method: 'POST', headers: { Host: '127.0.0.1:3000', Origin: 'http://127.0.0.1:3000' } })), true);
    assert.equal(session.sameOrigin(new NextRequest('http://127.0.0.1:3000/api/session', { method: 'POST', headers: { Host: '127.0.0.1:3000', Origin: 'http://localhost:3000' } })), false);
    const pool = load(path.join(root, 'lib/server/himoto-database')).himotoPool;
    const queryDescriptor = Object.getOwnPropertyDescriptor(pool, 'query');
    Object.defineProperty(pool, 'query', { configurable: true, value: database.query });
    try {
      const handler = load(path.join(root, 'app/api/session/route'));
      row = account;
      const response = await handler.POST(new NextRequest('http://127.0.0.1:3000/api/session', { method: 'POST', headers: { Host: '127.0.0.1:3000', Origin: 'http://127.0.0.1:3000', 'Content-Type': 'application/json' }, body: JSON.stringify({ email: account.email, password }) }));
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { user: { id: 7, name: account.name, email: account.email } });
      const cookie = response.headers.get('set-cookie');
      assert.match(cookie, /HttpOnly/i); assert.match(cookie, /SameSite=strict/i); assert.match(cookie, /Max-Age=28800/i);
      const authenticated = new NextRequest('http://127.0.0.1:3000/api/session', { headers: { Cookie: cookie.split(';')[0] } });
      assert.equal((await handler.GET(authenticated)).status, 200);
      const logout = await handler.DELETE(new NextRequest('http://127.0.0.1:3000/api/session', { method: 'DELETE', headers: { Host: '127.0.0.1:3000', Origin: 'http://127.0.0.1:3000' } }));
      assert.equal(logout.status, 200); assert.match(logout.headers.get('set-cookie'), /Max-Age=0/i);
      row = { ...account, role_id: '3', role: 'nhan-vien', role_slug: 'nhan-vien' };
      assert.equal((await handler.GET(authenticated)).status, 401);
      checks.push('login handler issues an HttpOnly cookie without password data; session lookup and logout work');
    } finally { Object.defineProperty(pool, 'query', queryDescriptor); }
  } finally { for (const [name, value] of Object.entries(previousEnv)) { if (value === undefined) delete process.env[name]; else process.env[name] = value; } }
  checks.push('production database access stays disabled; anonymous and cross-origin requests are rejected');
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
}
run().catch(error => { console.error(error); process.exitCode = 1; });
