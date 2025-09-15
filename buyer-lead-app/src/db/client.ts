import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

// Use a singleton in dev to avoid creating too many connections during HMR
const globalForDb = globalThis as unknown as {
  __dbClient?: ReturnType<typeof drizzle>;
  __pg?: ReturnType<typeof postgres>;
};

const pg = globalForDb.__pg ?? postgres(databaseUrl, { max: 1, prepare: false });
export const db = globalForDb.__dbClient ?? drizzle(pg);

if (process.env.NODE_ENV !== "production") {
  globalForDb.__pg = pg;
  globalForDb.__dbClient = db;
}


