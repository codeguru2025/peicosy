const { Pool } = require('pg');
const fs = require('fs');

// Read .env manually since dotenv may not be installed
const envFile = fs.readFileSync('.env', 'utf8');
const dbUrl = envFile.split('\n').find(l => l.startsWith('DATABASE_URL='));
const connectionString = dbUrl ? dbUrl.replace('DATABASE_URL=', '').trim() : '';

if (!connectionString) {
  console.log('ERROR: No DATABASE_URL found in .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    // Check tables
    const tables = await pool.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
    );
    console.log('=== TABLES ===');
    tables.rows.forEach(r => console.log(' -', r.tablename));

    // Check indexes
    const indexes = await pool.query(
      "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname"
    );
    console.log('\n=== INDEXES ===');
    indexes.rows.forEach(r => console.log(' -', r.indexname));

    // Apply performance indexes
    const sql = fs.readFileSync('migrations/add_performance_indexes.sql', 'utf8');
    await pool.query(sql);
    console.log('\nPerformance indexes applied successfully.');

    await pool.end();
  } catch (e) {
    console.error('ERROR:', e.message);
    await pool.end();
    process.exit(1);
  }
}

run();
