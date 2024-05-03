require('dotenv').config(); // Load environment variables
const { Client } = require('pg'); // Import the Client class from the pg module
const os = require('os');

const generateTestData = require('./generateTestData');
const testWritePerformance = require('./testWritePerformance');
const testReadPerformance = require('./testReadPerformance');
const testUpdatePerformance = require('./testUpdatePerformance');
const testDeletePerformance = require('./testDeletePerformance');
const {
  testDemographicStatusDistributionPerformance,
  testInactivityAnalysisPerformance,
  testUserRetentionAnalysisPerformance
} = require('./testComplexQueryPerformance');
const setupDatabase = require('../models/User');

async function warmUpDatabase(client) {
  try {
    console.log('Warming up database...');
    await client.query('DELETE FROM users;');
    
    const smallScale = 10000; // Adjust the scale for warm-up
    const testData = await generateTestData(smallScale);
    const values = testData.map(user => [user.name, user.email, user.age, user.country]);
    await client.query(`
      INSERT INTO users (name, email, age, country, created_at, last_login, status)
      VALUES ${values.map(data => `('${data[0]}', '${data[1]}', ${data[2]}, '${data[3]}', NOW(), NULL, 'active')`).join(',')}
    `);

    console.log('Database warmed up successfully.');
  } catch (error) {
    console.error('Error during warm-up:', error);
  }
}

async function runTests() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: true // Set to true for production using verify-full
    }
  });

  try {
    await client.connect();
    console.log('Connected to CockroachDB');

    // Warm up the database
    await warmUpDatabase(client);

    const scales = [190000]; // Different scales to test

    for (const scale of scales) {
      console.log(`\n\nTesting with ${scale} records...`);
      await client.query('DELETE FROM users;');

      // Generate test data
      const testData = await generateTestData(scale);
      const values = testData.map(user => [user.name, user.email, user.age, user.country]);
      await client.query(`
        INSERT INTO users (name, email, age, country, created_at, last_login, status)
        VALUES ${values.map(data => `('${data[0]}', '${data[1]}', ${data[2]}, '${data[3]}', NOW(), NULL, 'active')`).join(',')}
      `);

      // Test CRUD Performance
      const writeDuration = await testWritePerformance(testData, client);
      console.log(`Write Duration for ${scale} records: ${writeDuration} ms`);

      const points = [Math.floor(scale / 1.5), Math.floor(scale / 2), Math.floor(scale / 3)]; // 67%, 50%, and 33% marks
      let totalReadDuration = 0;
      let totalUpdateDuration = 0;
      let totalDeleteDuration = 0;

      for (const point of points) {
        const sampleUser = testData[point];
    
        const readDuration = await testReadPerformance(sampleUser.email, client);
        totalReadDuration += parseFloat(readDuration);
    
        const updateDuration = await testUpdatePerformance({ originalEmail: sampleUser.email, newEmail: `updated_${sampleUser.email}` }, client);
        totalUpdateDuration += parseFloat(updateDuration);
    
        const deleteDuration = await testDeletePerformance(sampleUser.email, client);
        totalDeleteDuration += parseFloat(deleteDuration);
      }

      const averageReadDuration = totalReadDuration / points.length;
      const averageUpdateDuration = totalUpdateDuration / points.length;
      const averageDeleteDuration = totalDeleteDuration / points.length;

      console.log(`Average Read Duration for ${scale} records: ${averageReadDuration.toFixed(3)} ms`);
      console.log(`Average Update Duration for ${scale} records: ${averageUpdateDuration.toFixed(3)} ms`);
      console.log(`Average Delete Duration for ${scale} records: ${averageDeleteDuration.toFixed(3)} ms`);

      // Test Complex Query Performance
      console.log(`Running complex query tests for ${scale}`);
      await testUserRetentionAnalysisPerformance(client);
      await testDemographicStatusDistributionPerformance(client);
      await testInactivityAnalysisPerformance(client);
    }

    console.log('All tests completed successfully.');
  } catch (error) {
    console.error('An error occurred during the tests:', error);
  } finally {
    // Disconnect from CockroachDB
    await client.query('DELETE FROM users;');
    await client.end();
    console.log('Database connection closed.');
  }
}

runTests();