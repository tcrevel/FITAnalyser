import postgres from 'pg';
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@db/schema";

const { Pool } = postgres;

const pool = new Pool({
  host: process.env.EXTERNAL_PG_HOST,
  database: process.env.EXTERNAL_PG_DATABASE,
  user: process.env.EXTERNAL_PG_USER,
  password: process.env.EXTERNAL_PG_PASSWORD,
  port: parseInt(process.env.EXTERNAL_PG_PORT || '5432'),
  ssl: {
    rejectUnauthorized: false
  }
});

export const db = drizzle(pool, { schema });