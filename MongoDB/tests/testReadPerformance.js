const performanceNow = require('performance-now');
const User = require('../models/User');

async function testReadPerformance(n) {
  const start = performanceNow();
  await User.find({});
  const end = performanceNow();
  const duration = (end - start).toFixed(3);
  console.log(`Read operation for ${n} entries took: ${duration} ms`);
  console.log(`Read Throughput: ${(n / duration).toFixed(3)} operations per ms`);
}

module.exports = testReadPerformance;
