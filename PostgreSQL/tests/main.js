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
  const currentEntries = 100; // Adjust the scale for warm-up
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
  
  
  console.log('Database warmed up successfully.');
}

async function runTests() {
  try {
    const numRuns = 10;
    const scales = [100, 1000, 10000, 100000, 1000000];
    const results = {};

    for (const scale of scales) {
      results[scale] = {
        totalWriteDuration: 0,
        totalReadDuration: 0,
        totalUpdateDuration: 0,
        totalDeleteDuration: 0,
        totalUserRetentionAnalysisDuration: 0,
        totalDemographicStatusDistributionDuration: 0,
        totalInactivityAnalysisDuration: 0,
      };
    }

    for (let run = 0; run < numRuns; run++) {
      console.log(`Starting run ${run + 1}...`);

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

      for (const scale of scales) {
        await client.query('DELETE FROM users');
        // Generate test data
        const testData = await generateTestData(scale);
      

        // Test CRUD Performance
        const writeDuration = await testWritePerformance(testData, client);

        const points = [Math.floor(scale / 1.5), Math.floor(scale / 2), Math.floor(scale / 3)]; // 67%, 50%, and 33% marks

        for (const point of points) {
          const sampleUser = testData[point];
      
          const readDuration = await testReadPerformance(sampleUser.email, client);
          results[scale].totalReadDuration += parseFloat(readDuration);
      
          const updateDuration = await testUpdatePerformance({ originalEmail: sampleUser.email, newEmail: `updated_${sampleUser.email}` }, client);
          results[scale].totalUpdateDuration += parseFloat(updateDuration);
      
          const deleteDuration = await testDeletePerformance(`updated_${sampleUser.email}`, client);
          results[scale].totalDeleteDuration += parseFloat(deleteDuration);
        }

        results[scale].totalWriteDuration += parseFloat(writeDuration);

        // Test Complex Query Performance
        const userRetentionAnalysisDuration = await testUserRetentionAnalysisPerformance(client);
        const demographicStatusDistributionDuration = await testDemographicStatusDistributionPerformance(client);
        const inactivityAnalysisDuration = await testInactivityAnalysisPerformance(client);

        results[scale].totalUserRetentionAnalysisDuration += parseFloat(userRetentionAnalysisDuration);
        results[scale].totalDemographicStatusDistributionDuration += parseFloat(demographicStatusDistributionDuration);
        results[scale].totalInactivityAnalysisDuration += parseFloat(inactivityAnalysisDuration);
      }

      await client.query('DELETE FROM users');
      await client.end();
      console.log(`Run ${run + 1} completed.`);
    }

    // Calculate and log averages
    for (const scale of scales) {
      const averageWriteDuration = results[scale].totalWriteDuration / (numRuns);
      const averageReadDuration = results[scale].totalReadDuration / (numRuns * 3); // 3 points per scale
      const averageUpdateDuration = results[scale].totalUpdateDuration / (numRuns * 3); // 3 points per scale
      const averageDeleteDuration = results[scale].totalDeleteDuration / (numRuns * 3); // 3 points per scale
      const averageUserRetentionAnalysisDuration = results[scale].totalUserRetentionAnalysisDuration / numRuns;
      const averageDemographicStatusDistributionDuration = results[scale].totalDemographicStatusDistributionDuration / numRuns;
      const averageInactivityAnalysisDuration = results[scale].totalInactivityAnalysisDuration / numRuns;

      console.log(`Scale: ${scale}`);
      console.log(`Average Write Duration: ${averageWriteDuration.toFixed(3)} ms`);
      console.log(`Average Read Duration: ${averageReadDuration.toFixed(3)} ms`);
      console.log(`Average Update Duration: ${averageUpdateDuration.toFixed(3)} ms`);
      console.log(`Average Delete Duration: ${averageDeleteDuration.toFixed(3)} ms`);
      console.log(`Average User Retention Analysis Duration: ${averageUserRetentionAnalysisDuration.toFixed(3)} ms`);
      console.log(`Average Demographic Status Distribution Duration: ${averageDemographicStatusDistributionDuration.toFixed(3)} ms`);
      console.log(`Average Inactivity Analysis Duration: ${averageInactivityAnalysisDuration.toFixed(3)} ms`);
      console.log();
    }

    console.log('Tests completed successfully.');
  } catch (error) {
    console.error('An error occurred during the tests:', error);
  }
}

runTests();