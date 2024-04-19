const { Client } = require('pg');
const generateTestData = require('./generateTestData');
const User = require('../models/User.js');
const testWritePerformance = require('./testWritePerformance');
const testReadPerformance = require('./testReadPerformance');
const testReadResponseTime = require('./testReadResponseTimePerformance');
const testWriteResponseTime = require('./testWriteResponseTimePerformance');

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

  for(let factor = 0; factor < 11; factor++) {
    const currentEntries = 1000 * Math.pow(2, factor);
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
    console.log("\n        R E S P O N S E  T I M E");
    console.log("----------------------------------------");
    await testReadResponseTime(userData);
    await testWriteResponseTime('testuser@example.com');

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
