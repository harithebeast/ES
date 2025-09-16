import type { Config } from "drizzle-kit";
import dotenv from "dotenv";

// Load env from .env.local for migrations
dotenv.config({ path: ".env.local" });

export default {
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
    // Prefer explicit envs often provided by Supabase
    // Use NON_POOLING for migrations when available
    url:
      process.env.POSTGRES_URL_NON_POOLING ??
      process.env.POSTGRES_URL ??
      process.env.SUPABASE_DB_URL ??
      process.env.DATABASE_URL ??
      "",
  },
} satisfies Config;


