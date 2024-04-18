const { Client } = require('pg');
const { performance } = require('perf_hooks');

// Create a new PostgreSQL client instance
async function testWritePerformance(testData) {
    const client = new Client({
        connectionString: 'postgresql://postgres:1234@localhost:5432/postgres'
    });
    client.connect()
      .then(() => console.log('Connected to PostgreSQL database'))
      .catch(err => console.error('Error connecting to PostgreSQL database', err));
    
  const query = 'INSERT INTO users (name, email, age) VALUES ($1, $2, $3)';
  const start = performance.now();
  try {
    await Promise.all(testData.map(user => client.query(query, [user.name, user.email, user.age])));
    const end = performance.now();
    const duration = end - start;
    console.log(`Write operation for ${testData.length} entries took: ${duration} ms`);
    console.log(`Write Throughput: ${(testData.length / duration).toFixed(3)} operations per ms`);
  } catch (err) {
    console.error('Error performing write operation in PostgreSQL', err);
  } finally {
    client.end()
      .then(() => console.log('Closed PostgreSQL database connection'))
      .catch(err => console.error('Error closing PostgreSQL database connection', err));
  }
}

module.exports = testWritePerformance;