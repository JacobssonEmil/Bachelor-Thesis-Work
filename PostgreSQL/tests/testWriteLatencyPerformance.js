// testWriteLatencyPerformance.js
const { Client } = require('pg');
const { performance } = require('perf_hooks');


// Create a new PostgreSQL client instance
async function testWriteLatency(userData) {
    const client = new Client({
        connectionString: 'postgresql://postgres:1234@localhost:5432/postgres'
    });
    client.connect()
      .then(() => console.log('Connected to PostgreSQL database'))
      .catch(err => console.error('Error connecting to PostgreSQL database', err));
  const query = 'INSERT INTO users (name, email, age) VALUES ($1, $2, $3)';
  const { name, email, age } = userData;
  const start = performance.now();
  try {
    await client.query(query, [name, email, age]);
    const end = performance.now();
    const latency = end - start;
    console.log(`Write operation latency: ${latency} ms`);
  } catch (err) {
    console.error('Error performing write operation in PostgreSQL', err);
  } finally {
    client.end()
      .then(() => console.log('Closed PostgreSQL database connection'))
      .catch(err => console.error('Error closing PostgreSQL database connection', err));
  }
}

module.exports = testWriteLatency;