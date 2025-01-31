import postgres from 'pg';
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@db/schema";

const { Pool } = postgres;

// Configure connection pool with proper settings for Replit
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Set max pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  maxUses: 7500, // Close connections after too many uses
});

// Add error handler for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Add connection verification
pool.on('connect', (client) => {
  console.log('New client connected to database');
  client.on('error', (err) => {
    console.error('Database client error:', err);
  });
});

// Export the database instance
export const db = drizzle(pool, { 
  schema,
  logger: true // Enable query logging
});

// Function to test database connection
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to database');
    client.release();
    return true;
  } catch (error) {
    console.error('Error connecting to the database:', error);
    return false;
  }
};

// Test connection on startup
testConnection().catch(console.error);