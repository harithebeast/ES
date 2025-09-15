import type { Config } from "drizzle-kit";

export default {
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
    // DATABASE_URL is required for migrations; generation reads only schema
    url: process.env.DATABASE_URL ?? "",
  },
} satisfies Config;


