const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'testdb',
  password: '1234',
  port: 5432,
});

pool.on('connect', () => {
  console.log('PostgreSQL Connected');
});

module.exports = pool;
