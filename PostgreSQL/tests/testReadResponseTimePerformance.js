const { Client } = require('pg');
const { performance } = require('perf_hooks');

// Create a new PostgreSQL client instance
async function testReadResponseTime(email) {
    const client = new Client({
        connectionString: 'postgresql://postgres:1234@localhost:5432/postgres'
    });
    client.connect()
      .then(() => console.log('Connected to PostgreSQL database'))
      .catch(err => console.error('Error connecting to PostgreSQL database', err));
  const query = 'SELECT * FROM users WHERE email = $1';
  const start = performance.now();
  try {
    await client.query(query, [email]);
    const end = performance.now();
    const responseTime = end - start;
    console.log(`Read operation Response Time: ${responseTime} ms`);
  } catch (err) {
    console.error('Error performing read operation in PostgreSQL', err);
  } finally {
    client.end()
      .then(() => console.log('Closed PostgreSQL database connection'))
      .catch(err => console.error('Error closing PostgreSQL database connection', err));
  }
}

module.exports = testReadResponseTime;