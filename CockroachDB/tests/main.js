require('dotenv').config(); 
const { Client } = require('pg');
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

const scales = [100, 1000, 10000, 100000, 1000000]; 
const numRuns = 10; 

async function warmUpDatabase(client) {
  console.log('Warming up database...');

  const smallScale = 100; // Adjust the scale for warm-up
  const testData = await generateTestData(smallScale);
  const values = testData.map(user => [user.name, user.email, user.age, user.country]);
  await client.query(`
    INSERT INTO users (name, email, age, country, created_at, last_login, status)
    VALUES ${values.map(data => `('${data[0]}', '${data[1]}', ${data[2]}, '${data[3]}', NOW(), NULL, 'active')`).join(',')}
  `);

  console.log('Database warmed up successfully.');
}

async function runTests() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: true 
    }
  });

  try {
    await client.connect();
    console.log('Connected to CockroachDB');

    const results = {};
    for (const scale of scales) {
      results[scale] = {
        totalWriteDuration: 0,
        totalReadDuration: 0,
        totalUpdateDuration: 0,
        totalDeleteDuration: 0,
        totalUserRetentionAnalysisDuration: 0,
        totalDemographicStatusDistributionDuration: 0,
        totalInactivityAnalysisDuration: 0
      };
    }

    for (let run = 0; run < numRuns; run++) {
      console.log(`Starting run ${run + 1}...`);
      await warmUpDatabase(client);

      for (const scale of scales) {
        console.log(`\nTesting with ${scale} records...`);
        await client.query('DELETE FROM users;');

        const testData = await generateTestData(scale);
        
        const writeDuration = await testWritePerformance(testData, client);
        results[scale].totalWriteDuration += parseFloat(writeDuration);

        const points = [Math.floor(scale / 1.5), Math.floor(scale / 2), Math.floor(scale / 3)];
        for (const point of points) {
          const sampleUser = testData[point];
      
          const readDuration = await testReadPerformance(sampleUser.email, client);
          results[scale].totalReadDuration += parseFloat(readDuration);
      
          const updateDuration = await testUpdatePerformance({ originalEmail: sampleUser.email, newEmail: `updated_${sampleUser.email}` }, client);
          results[scale].totalUpdateDuration += parseFloat(updateDuration);
      
          const deleteDuration = await testDeletePerformance(sampleUser.email, client);
          results[scale].totalDeleteDuration += parseFloat(deleteDuration);
        }

        const userRetentionAnalysisDuration = await testUserRetentionAnalysisPerformance(client);
        const demographicStatusDistributionDuration = await testDemographicStatusDistributionPerformance(client);
        const inactivityAnalysisDuration = await testInactivityAnalysisPerformance(client);

        results[scale].totalUserRetentionAnalysisDuration += parseFloat(userRetentionAnalysisDuration);
        results[scale].totalDemographicStatusDistributionDuration += parseFloat(demographicStatusDistributionDuration);
        results[scale].totalInactivityAnalysisDuration += parseFloat(inactivityAnalysisDuration);
      }
    }

    console.log('\nAggregated Test Results:');
    for (const scale of scales) {
      console.log(`\nScale: ${scale}`);
      console.log(`Average Write Duration: ${(results[scale].totalWriteDuration / numRuns).toFixed(3)} ms`);
      console.log(`Average Read Duration: ${(results[scale].totalReadDuration / (numRuns * 3)).toFixed(3)} ms`);
      console.log(`Average Update Duration: ${(results[scale].totalUpdateDuration / (numRuns * 3)).toFixed(3)} ms`);
      console.log(`Average Delete Duration: ${(results[scale].totalDeleteDuration / (numRuns * 3)).toFixed(3)} ms`);
      console.log(`Average User Retention Analysis Duration: ${(results[scale].totalUserRetentionAnalysisDuration / numRuns).toFixed(3)} ms`);
      console.log(`Average Demographic Status Distribution Duration: ${(results[scale].totalDemographicStatusDistributionDuration / numRuns).toFixed(3)} ms`);
      console.log(`Average Inactivity Analysis Duration: ${(results[scale].totalInactivityAnalysisDuration / numRuns).toFixed(3)} ms`);
    }
  } catch (error) {
    console.error('An error occurred during the tests:', error);
  } finally {
    await client.query('DELETE FROM users;');
    await client.end();
    console.log('Database connection closed.');
  }
}

runTests();