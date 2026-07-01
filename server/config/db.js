const { Pool } = require('pg');
require('dotenv/config');

// Enable SSL rejectUnauthorized: false for production environments (like Render)
// while allowing non-SSL connections for local development on localhost
const isProductionOrRemote = process.env.DATABASE_URL && 
  !process.env.DATABASE_URL.includes('localhost') && 
  !process.env.DATABASE_URL.includes('127.0.0.1') &&
  !process.env.DATABASE_URL.includes('@db');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProductionOrRemote ? { rejectUnauthorized: false } : false
});

/**
 * Executes a PostgreSQL database query asynchronously
 * @param {string} text - The SQL query text
 * @param {Array} params - Parameterized values for the query
 * @returns {Promise<Object>} - The query result
 */
const query = async (text, params) => {
  return pool.query(text, params);
};

module.exports = {
  query,
  pool
};
