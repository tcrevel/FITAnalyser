import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import { users, datasets, fitFiles } from "./schema";

export async function initializeDatabase() {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const db = drizzle(pool);

    // Verify if tables exist
    try {
      await db.select().from(users).limit(1);
    } catch (error: any) {
      if (error.code === '42P01') { // relation does not exist
        console.log('Creating database schema...');
        // Create tables in the correct order
        await db.execute(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
          );

          CREATE TABLE IF NOT EXISTS datasets (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            share_token TEXT,
            CONSTRAINT valid_name CHECK (length(trim(name)) > 0)
          );

          CREATE TABLE IF NOT EXISTS fit_files (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
            file_path TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            CONSTRAINT valid_file_name CHECK (length(trim(name)) > 0),
            CONSTRAINT valid_file_path CHECK (length(trim(file_path)) > 0)
          );
        `);
        console.log('Database schema created successfully');
      } else {
        throw error;
      }
    }

    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}