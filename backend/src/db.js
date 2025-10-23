import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();
const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL || 'postgresql://dq_user:dq_password@localhost:5432/dq_db';

export const pool = new Pool({ connectionString });

export async function runQuery(queryText, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(queryText, params);
    return result.rows;
  } finally {
    client.release();
  }
}
