// main.js
const { Client } = require('pg');
const generateTestData = require('./generateTestData');
const User = require('../models/User.js');
const testWritePerformance = require('./testWritePerformance');
const testReadPerformance = require('./testReadPerformance');
const testReadLatencyPerformance = require('./testReadLatencyPerformance');
const testWriteLatencyPerformance = require('./testWriteLatencyPerformance');

const testVolumes = [1000, 10000, 50000]; // Example data volumes for complex query testing

const userData = {
  name: 'Test User',
  email: 'testuser@example.com',
  age: 30
};

// Connect to the PostgreSQL database
const client = new Client({
    connectionString: 'postgresql://postgres:1234@localhost:5432/postgres'
});
client.connect()
  .then(() => console.log('Connected to PostgreSQL database'))
  .catch(err => console.error('Error connecting to PostgreSQL database', err));

async function runScalabilityTests() {
  console.log("Starting scalability tests...\n");
  console.log("\n         S C A L A B I L I T Y");
  console.log("----------------------------------------");

  for (let factor = 1; factor <= 5; factor++) {
    const currentEntries = 1000 * factor;
    console.log(`\n----- Scalability Test with ${currentEntries} entries -----`);
    const testData = generateTestData(currentEntries);
    await User.deleteMany();
    await testWritePerformance(testData);
    await testReadPerformance(currentEntries);
    console.log("\n---------------------------------------------------------------");
  }
}

async function main() {
  try {
    await runScalabilityTests();

    // Run write latency test
    console.log("\n             L A T E N C Y");
    console.log("----------------------------------------");
    await testWriteLatencyPerformance(userData);
    await testReadLatencyPerformance('testuser@example.com');

    console.log("\nTests completed.");
  } catch (err) {
    console.error('Error running tests:', err);
  } finally {
    client.end()
      .then(() => console.log('Closed PostgreSQL database connection'))
      .catch(err => console.error('Error closing PostgreSQL database connection', err));
  }
}

main().then(() => process.exit(0));
