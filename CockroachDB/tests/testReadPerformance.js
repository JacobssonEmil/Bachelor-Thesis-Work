const performanceNow = require('performance-now');

async function testReadPerformance(n, client) {
  const start = performanceNow();
  
  const query = {
    text: 'SELECT * FROM users WHERE email = $1', 
    values: [n],
  };
  await client.query(query);
  const end = performanceNow();
  const duration = (end - start).toFixed(3);
  return duration;
}

module.exports = testReadPerformance;
