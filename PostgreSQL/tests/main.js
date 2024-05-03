const os = require('os');
const { Client } = require('pg');
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
const User = require('../models/User');

async function warmUpDatabase() {
  console.log('Warming up database...');
  const currentEntries = 10000; // Adjust the scale for warm-up
  const testData = await generateTestData(currentEntries);
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: '1234',
    port: 5432,
  });
  await client.connect();

  // Insert initial test data multiple times to increase volume
  for (let i = 0; i < 3; i++) {
    const values = testData.map(user => [user.name, user.email, user.age, user.country]);
    await client.query(`
      INSERT INTO users (name, email, age, country)
      VALUES ${values.map(data => `('${data[0]}', '${data[1]}', ${data[2]}, '${data[3]}')`).join(',')}
    `);
  }

  // Additional warm-up operations...
  
  await client.end();
  console.log('Database warmed up successfully.');
}

async function runTests() {
  try {
    console.log('Starting tests...');
    await warmUpDatabase();

    const client = new Client({
      user: 'postgres',
      host: 'localhost',
      database: 'postgres',
      password: '1234',
      port: 5432,
    });
    await client.connect();

    // Clean up existing data
    await client.query('DELETE FROM users');

    const scales = [100, 1000, 10000, 100000, 1000000]; // Different scales to test

    for (const scale of scales) {
      console.log(`\n\nTesting with ${scale} records...`);
      await client.query('DELETE FROM users');
      // Generate test data
      const testData = await generateTestData(scale);
      const values = testData.map(user => [user.name, user.email, user.age, user.country]);
      await client.query(`
        INSERT INTO users (name, email, age, country)
        VALUES ${values.map(data => `('${data[0]}', '${data[1]}', ${data[2]}, '${data[3]}')`).join(',')}
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
    
        const deleteDuration = await testDeletePerformance(`updated_${sampleUser.email}`, client);
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
    await client.query('DELETE FROM users');
    await client.end();
    console.log('Tests completed successfully.');
  } catch (error) {
    console.error('An error occurred during the tests:', error);
  }
}

runTests();