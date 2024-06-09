const neo4j = require('neo4j-driver');
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

const uri = "bolt://localhost:7687";
const user = "neo4j";
const password = "12345678";
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

const scales = [100, 1000, 10000, 100000, 1000000];
const numRuns = 10; 

async function clearDatabase(driver) {
    const session = driver.session();
    try {
        await session.run('MATCH (n) DETACH DELETE n');
        console.log('Database cleared successfully.');
    } finally {
        await session.close();
    }
}

async function warmUpDatabase() {
    console.log('Warming up database...');
    const currentEntries = 100; // Adjust the number of entries for warm-up
    const testData = await generateTestData(driver, currentEntries);

    for (let i = 0; i < 3; i++) {
        await testWritePerformance(driver, testData.map(user => ({ ...user, email: `warmup${i}${user.email}` })));
    }
    await testReadPerformance(driver);
    await testUpdatePerformance(driver, { originalEmail: "warmup1user0@example.com", newEmail: "updated_warmup1user0@example.com" });
    await testDeletePerformance(driver, "warmup2user0@example.com");
    await clearDatabase(driver);
    console.log('Warm-up phase completed.');
}

async function runTests() {
    try {
        console.log("Connected to Neo4j");
        await clearDatabase(driver);

        // Warm-up phase
        await warmUpDatabase();

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

            for (const scale of scales) {
                console.log(`Testing with ${scale} records...`);
                await clearDatabase(driver);

                const testData = await generateTestData(driver, scale);
                const writeDuration = await testWritePerformance(driver, testData);
                results[scale].totalWriteDuration += parseFloat(writeDuration);

                const points = [Math.floor(scale / 1.5), Math.floor(scale / 2), Math.floor(scale / 3)];
                for (const point of points) {
                    const sampleUser = testData[point];
                    
                    const readDuration = await testReadPerformance(driver, point);
                    results[scale].totalReadDuration += parseFloat(readDuration);
                    
                    const updateDuration = await testUpdatePerformance(driver, { originalEmail: sampleUser.email, newEmail: `updated_${sampleUser.email}` }, point);
                    results[scale].totalUpdateDuration += parseFloat(updateDuration);
                    
                    const deleteDuration = await testDeletePerformance(driver, sampleUser.email);
                    results[scale].totalDeleteDuration += parseFloat(deleteDuration);
                }

                const userRetentionDuration = await testUserRetentionAnalysisPerformance(driver);
                results[scale].totalUserRetentionAnalysisDuration += parseFloat(userRetentionDuration);

                const demographicDuration = await testDemographicStatusDistributionPerformance(driver);
                results[scale].totalDemographicStatusDistributionDuration += parseFloat(demographicDuration);

                const inactivityDuration = await testInactivityAnalysisPerformance(driver);
                results[scale].totalInactivityAnalysisDuration += parseFloat(inactivityDuration);
            }
        }

        console.log('\nAggregated Test Results:');
        for (const scale of scales) {
            console.log(`Scale: ${scale}`);
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
        await clearDatabase(driver);
        await driver.close();
        console.log('Disconnected from Neo4j.');
    }
}

runTests();