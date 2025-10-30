import pg from 'pg';
import knex from 'knex';
import dotenv from 'dotenv';
import { createLogger } from '../utils/logger.js';
import knexConfig from '../../knexfile.js';

dotenv.config();

const logger = createLogger('database');

const { Pool } = pg;

// Get environment (test, development, production)
const environment = process.env.NODE_ENV || 'development';

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
let knexInstance = null;

export function getPool() {
  // Don't create PostgreSQL pool for SQLite test environment
  if (environment === 'test' && knexConfig[environment].client === 'sqlite3') {
    logger.warn('PostgreSQL pool not available in SQLite test mode');
    return null;
  }

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

export function getKnex() {
  if (!knexInstance) {
    // Use knexfile configuration based on environment
    knexInstance = knex(knexConfig[environment]);
  }

  return knexInstance;
}

export async function query(text, params) {
  // Use Knex for SQLite test mode
  if (environment === 'test' && knexConfig[environment].client === 'sqlite3') {
    const db = getKnex();
    const start = Date.now();

    try {
      const result = await db.raw(text, params);
      const duration = Date.now() - start;

      logger.debug(
        {
          text,
          duration,
          rows: result.length,
        },
        'Executed database query'
      );

      return { rows: result };
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

  // Use PostgreSQL pool for development/production
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
  const pool = getPool();
  if (!pool) {
    throw new Error('PostgreSQL pool not available in test mode');
  }
  return pool.connect();
}

export async function testConnection() {
  try {
    // Use Knex for SQLite test mode
    if (environment === 'test' && knexConfig[environment].client === 'sqlite3') {
      const db = getKnex();
      await db.raw('SELECT 1');
      logger.info('Database connection successful (SQLite test mode)');
      return true;
    }

    // Use PostgreSQL for development/production
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
  if (knexInstance) {
    await knexInstance.destroy();
    knexInstance = null;
    logger.info('Knex connection closed');
  }
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
