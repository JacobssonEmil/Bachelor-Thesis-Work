const performanceNow = require('performance-now');

async function testReadPerformance(n, client) {
    const start = performanceNow();
    // Example basic read operation, adjust as needed for specific tests
    await client.query('SELECT * FROM users');
    const end = performanceNow();
    const duration = (end - start).toFixed(3);
    return duration;
}

module.exports = testReadPerformance;
