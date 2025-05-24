import { defineConfig } from "drizzle-kit";
import { env } from "./src/lib/env";

console.log("DATABASE_URL", env.DATABASE_URL);

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
