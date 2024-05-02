require('dotenv').config(); // Load environment variables
const { Client } = require('pg'); // Import the Client class from the pg module
const os = require('os');

const generateTestData = require('./generateTestData');
const testWritePerformance = require('./testWritePerformance');
const testReadPerformance = require('./testReadPerformance');
const testUpdatePerformance = require('./testUpdatePerformance');
const testDeletePerformance = require('./testDeletePerformance');
const {
  testUserRetentionAnalysisPerformance,
  testDemographicStatusDistributionPerformance,
  testInactivityAnalysisPerformance
} = require('./testComplexQueryPerformance');
const setupDatabase = require('../models/User');

// Create a new client instance using connection details from .env file
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true // Set to true for production using verify-full
  }
});

async function warmUpDatabase(testData, client) {
  await client.query('DELETE FROM users;');
  // Insert initial test data multiple times to increase volume
  for (let i = 0; i < 3; i++) {
      const currentEntries = 100;
      const testData = await generateTestData(currentEntries);
      
      // Ensure unique email for each entry to prevent violation of the unique constraint
      const values = testData.map((user, index) => [
          user.email + i + index, // Append 'i' and 'index' to make email unique
          user.name,
          user.age,
          user.country
      ]);

      const insertQuery = `
      INSERT INTO users (email, name, age, country, created_at, last_login, status)
      VALUES ${values.map(data => `('${data[0]}', '${data[1]}', ${data[2]}, '${data[3]}', NOW(), NULL, 'active')`).join(',')}
      `;
      
      await client.query(insertQuery);
  }

  console.log('Warm-up phase completed.');
  await client.query('DELETE FROM users;');
}

async function simulateUserRequests(threads, client) {
  const currentEntries = 1000;
  const testData = await generateTestData(currentEntries);
  console.log(`\n----- Simulating user requests with ${threads} threads -----`);

  await client.query('DELETE FROM users');

  const writePromises = [];
  const readPromises = [];
  const updatePromises = [];
  const deletePromises = [];

  for (let i = 0; i < threads; i++) {
    writePromises.push(testWritePerformance(testData, client));
    readPromises.push(testReadPerformance(currentEntries, client));
    updatePromises.push(testUpdatePerformance({ originalEmail: `user${currentEntries / 2}@example.com`, newEmail: `updated@example.com` }, client));
    deletePromises.push(testDeletePerformance('updated@example.com', client));
    await client.query('DELETE FROM users');
  }

  const writeDurations = await Promise.all(writePromises).then(durations => durations.map(parseFloat));
  const readDurations = await Promise.all(readPromises).then(durations => durations.map(parseFloat));
  const updateDurations = await Promise.all(updatePromises).then(durations => durations.map(parseFloat));
  const deleteDurations = await Promise.all(deletePromises).then(durations => durations.map(parseFloat));

  const getAverageDuration = (durations) => {
    if (durations.length === 0) return 0; // Handle empty durations array
    const sum = durations.reduce((acc, curr) => acc + curr, 0);
    return sum / durations.length;
  };

  const averageWriteDuration = getAverageDuration(writeDurations);
  const averageReadDuration = getAverageDuration(readDurations);
  const averageUpdateDuration = getAverageDuration(updateDurations);
  const averageDeleteDuration = getAverageDuration(deleteDurations);

  console.log(`Average Write Operation Duration: ${averageWriteDuration.toFixed(3)} ms`);
  console.log(`Average Read Operation Duration: ${averageReadDuration.toFixed(3)} ms`);
  console.log(`Average Update Operation Duration: ${averageUpdateDuration.toFixed(3)} ms`);
  console.log(`Average Delete Operation Duration: ${averageDeleteDuration.toFixed(3)} ms`);

  console.log(`\n---------------------------------------------------------------`);
  return [averageWriteDuration, averageReadDuration, averageUpdateDuration, averageDeleteDuration];
}

async function runComplexQueryTests(client) {
  const currentEntries = 10000;
  const testData = await generateTestData(currentEntries);
  const values = testData.map(user => [user.email, user.name, user.age, user.country]);
  await client.query(`
  INSERT INTO users (name, email, age, created_at, last_login, status, country)
  VALUES ${testData.map(data => `('${data.name}', '${data.email}', ${data.age}, '${data.createdAt}', '${data.lastLogin}', '${data.status}', '${data.country}')`).join(',')}
`);
  console.log('\nStarting complex query tests...');
  await testUserRetentionAnalysisPerformance(client);
  await testDemographicStatusDistributionPerformance(client);
  await testInactivityAnalysisPerformance(client);
  console.log('Complex query tests completed.');
  await client.query('DELETE FROM users');
}

async function main() {
  try {
    await client.connect();
    console.log('Connected to CockroachDB');
    const User = await setupDatabase(client); // Assume setupDatabase correctly initializes the User table and returns a User class

    // Example: Perform database operations like warm-up and tests
    const testData = await generateTestData(1000); // Generate or load test data
    const numCPUs = os.cpus().length;
    const maxThreads = numCPUs > 1 ? numCPUs - 1 : 1;
    const averageDurationsByThreads = [];
    await warmUpDatabase(testData, client);
    console.log('Database has been warmed up.');

    // Optionally, run performance tests
    console.log('Starting performance tests...');
    
    for (let threads = 1; threads <= maxThreads; threads++) {
      const averageDurations = await simulateUserRequests(threads, client);
      averageDurationsByThreads.push(averageDurations);
    }
    console.log("\nUser requests simulation completed.");
    // Calculate overall average durations
    const totalAverageDurations = averageDurationsByThreads.reduce((acc, curr) => {
      return acc.map((value, index) => value + curr[index]);
    }, [0, 0, 0, 0]);

    const overallAverageDurations = totalAverageDurations.map(value => value / maxThreads);

    console.log(`\nOverall Average Write Operation Duration: ${overallAverageDurations[0].toFixed(3)} ms`);
    console.log(`Overall Average Read Operation Duration: ${overallAverageDurations[1].toFixed(3)} ms`);
    console.log(`Overall Average Update Operation Duration: ${overallAverageDurations[2].toFixed(3)} ms`);
    console.log(`Overall Average Delete Operation Duration: ${overallAverageDurations[3].toFixed(3)} ms`);

    await runComplexQueryTests(client);
    //await client.query('DELETE FROM users');
    await client.end();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error during database operations:', error);
    await client.end();
  }
  
  

 

  

  await client.end();
}

main().catch(error => console.error(error));
