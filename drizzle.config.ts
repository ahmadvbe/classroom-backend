import "dotenv/config";
import { defineConfig } from "drizzle-kit";
//3:04:19
if (!process.env.DATABASE_URL) { //setting up the DB url

  throw new Error("DATABASE_URL is not set in .env file");
}

export default defineConfig({ //exporting the config
  schema: "./src/db/schema/index.ts", //modify the path to our schema 3:04:30
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
