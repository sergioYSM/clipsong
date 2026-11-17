import 'server-only';
import pg from 'pg';
import { serverEnv } from './env.server';

// Direct Postgres for trusted server work (webhooks, jobs). Bypasses RLS:
// never pass user input as SQL, always as parameters.
let pool: pg.Pool | null = null;
export function db(): pg.Pool {
  return (pool ??= new pg.Pool({ connectionString: serverEnv().DATABASE_URL, max: 3, ssl: serverEnv().DATABASE_URL.includes('localhost') || serverEnv().DATABASE_URL.includes('127.0.0.1') ? undefined : { rejectUnauthorized: false } }));
}
