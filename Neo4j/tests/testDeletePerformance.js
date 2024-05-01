const performanceNow = require('performance-now');
const neo4j = require('neo4j-driver');

async function testDeletePerformance(driver, email) {
    const session = driver.session();
    const start = performanceNow();

    const query = `
        MATCH (u:User {email: $email})
        DELETE u
    `;

    await session.run(query, { email: email });
    const end = performanceNow();
    const duration = (end - start).toFixed(3);

    await session.close();
    return duration;
}

module.exports = testDeletePerformance;
