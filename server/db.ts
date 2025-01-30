import postgres from 'pg';
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@db/schema";

const { Pool } = postgres;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

export const db = drizzle(pool, { schema });