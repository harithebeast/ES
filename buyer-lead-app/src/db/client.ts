import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Prefer explicit Supabase/Prisma-style envs, then fall back
let databaseUrl =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or SUPABASE_DB_URL is not set");
}

// Use a singleton in dev to avoid creating too many connections during HMR
const globalForDb = globalThis as unknown as {
  __dbClient?: ReturnType<typeof drizzle>;
  __pg?: ReturnType<typeof postgres>;
};

// Enable SSL when connecting to Supabase / URLs that require sslmode
const connectionOptions: any = { max: 1, prepare: false };
if (
  databaseUrl.includes("supabase.co") ||
  databaseUrl.includes("sslmode=require") ||
  process.env.SUPABASE_DB_SSL === "true"
) {
  connectionOptions.ssl = "require";
}

// Ensure a sane statement timeout for Supabase poolers
if (!/statement_timeout=\d+/i.test(databaseUrl)) {
  databaseUrl += (databaseUrl.includes("?") ? "&" : "?") + "statement_timeout=60000";
}

const pg = globalForDb.__pg ?? postgres(databaseUrl, connectionOptions);
export const db = globalForDb.__dbClient ?? drizzle(pg);

if (process.env.NODE_ENV !== "production") {
  globalForDb.__pg = pg;
  globalForDb.__dbClient = db;
}


