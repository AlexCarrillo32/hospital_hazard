import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
};

async function createDatabase() {
  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL server');

    const dbName = process.env.DB_NAME || 'waste_compliance';

    // Check if database exists
    const checkResult = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      dbName,
    ]);

    if (checkResult.rows.length === 0) {
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database '${dbName}' created successfully`);
    } else {
      console.log(`ℹ️  Database '${dbName}' already exists`);
    }

    await client.end();
    return true;
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    if (client) {
      await client.end();
    }
    return false;
  }
}

async function runMigrations() {
  const client = new Client({
    ...dbConfig,
    database: process.env.DB_NAME || 'waste_compliance',
  });

  try {
    await client.connect();
    console.log('✅ Connected to waste_compliance database');

    const schemaPath = path.join(__dirname, '..', 'src', 'db', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    await client.query(schemaSql);
    console.log('✅ Database schema applied successfully');

    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📊 Tables created:');
    tablesResult.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });

    await client.end();
    return true;
  } catch (error) {
    console.error('❌ Error running migrations:', error.message);
    if (client) {
      await client.end();
    }
    return false;
  }
}

async function main() {
  console.log('🚀 Initializing waste compliance database...\n');

  const dbCreated = await createDatabase();
  if (!dbCreated) {
    console.error('\n❌ Database initialization failed');
    process.exit(1);
  }

  const migrationsRun = await runMigrations();
  if (!migrationsRun) {
    console.error('\n❌ Migration failed');
    process.exit(1);
  }

  console.log('\n✅ Database initialization complete!');
  process.exit(0);
}

main();
