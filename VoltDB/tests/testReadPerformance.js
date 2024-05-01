const performanceNow = require('performance-now');

async function testReadPerformance(n, client) {
  const start = performanceNow();
  await client.query('SELECT * FROM users');
  const end = performanceNow();
  const duration = (end - start).toFixed(3);
  return duration;
}

module.exports = testReadPerformance;
