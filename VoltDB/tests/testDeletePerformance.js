const performanceNow = require('performance-now');

async function testDeletePerformance(email, client) {
    const start = performanceNow();
    // Example delete operation, using parameterized queries for safety
    await client.query('DELETE FROM users WHERE email = $1', [email]);
    const end = performanceNow();
    const duration = (end - start).toFixed(3);
    return duration;
}

module.exports = testDeletePerformance;
