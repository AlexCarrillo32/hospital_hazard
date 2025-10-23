import pg from 'pg';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const { Pool } = pg;

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'waste_compliance',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create connection pool
let pool = null;

export function getPool() {
  if (!pool) {
    pool = new Pool(dbConfig);

    pool.on('error', (err) => {
      logger.error({ err }, 'Unexpected error on idle database client');
    });

    pool.on('connect', () => {
      logger.info('New database client connected');
    });
  }

  return pool;
}

export async function query(text, params) {
  const client = getPool();
  const start = Date.now();

  try {
    const result = await client.query(text, params);
    const duration = Date.now() - start;

    logger.debug(
      {
        text,
        duration,
        rows: result.rowCount,
      },
      'Executed database query'
    );

    return result;
  } catch (error) {
    logger.error(
      {
        text,
        params,
        error: error.message,
      },
      'Database query error'
    );
    throw error;
  }
}

export async function getClient() {
  return getPool().connect();
}

export async function testConnection() {
  try {
    const result = await query('SELECT NOW() as now, current_database() as database');
    logger.info(
      {
        database: result.rows[0].database,
        timestamp: result.rows[0].now,
      },
      'Database connection successful'
    );
    return true;
  } catch (error) {
    logger.error({ error: error.message }, 'Database connection failed');
    return false;
  }
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database pool closed');
  }
}

export default {
  query,
  getClient,
  getPool,
  testConnection,
  closePool,
};
