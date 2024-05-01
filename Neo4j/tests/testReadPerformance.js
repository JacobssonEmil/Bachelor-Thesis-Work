const performanceNow = require('performance-now');
const neo4j = require('neo4j-driver');

async function testReadPerformance(driver) {
    const session = driver.session();
    const start = performanceNow();

    const query = `
        MATCH (u:User)
        RETURN u
    `;

    await session.run(query);
    const end = performanceNow();
    const duration = (end - start).toFixed(3);

    await session.close();
    return duration;
}

module.exports = testReadPerformance;
