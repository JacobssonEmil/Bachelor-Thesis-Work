// testReadPerformance.js
const { Client } = require('pg');
const { performance } = require('perf_hooks');

// Create a new PostgreSQL client instance
async function testReadPerformance(n) {
    const client = new Client({
        connectionString: 'postgresql://postgres:1234@localhost:5432/postgres'
    });
    client.connect()
      .then(() => console.log('Connected to PostgreSQL database'))
      .catch(err => console.error('Error connecting to PostgreSQL database', err));
    
  const query = 'SELECT * FROM users';
  const start = performance.now();
  try {
    await client.query(query);
    const end = performance.now();
    const duration = end - start;
    console.log(`Read operation for ${n} entries took: ${duration} ms`);
    console.log(`Read Throughput: ${(n / duration).toFixed(3)} operations per ms`);
  } catch (err) {
    console.error('Error performing read operation in PostgreSQL', err);
  } finally {
    client.end()
      .then(() => console.log('Closed PostgreSQL database connection'))
      .catch(err => console.error('Error closing PostgreSQL database connection', err));
  }
}

module.exports = testReadPerformance;