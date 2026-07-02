import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@dtt/shared/db/schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

// neon-http: single-shot queries, no interactive transactions — use db.batch()
// for multi-statement writes that must land together.
export const db = drizzle({ client: neon(url), schema });

export { schema };
