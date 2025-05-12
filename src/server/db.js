const { Pool } = require('pg');

const config = {
  user: process.env.SUPABASE_DB_USER,
  host: process.env.SUPABASE_DB_HOST,
  database: process.env.SUPABASE_DB_NAME,
  password: process.env.SUPABASE_DB_PASSWORD,
  port: 5432,
  // Adjust pool size as needed
  max: 10,
  idleTimeoutMillis: 30000,
};

const pool = new Pool(config);

pool.on('connect', () => {
  console.log('Connected to the database pool');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = async function query(text, params) {
  const client = await pool.connect();
  return client.query(text, params).finally(() => client.release());
}