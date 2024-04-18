const performanceNow = require('performance-now');
const User = require('../models/User');

async function testWriteLatencyPerformance(testData) {
  const start = performanceNow();
  await User.insertMany(testData);
  const end = performanceNow();
  const duration = (end - start).toFixed(3);
  console.log(`Write operation for ${testData.length} entries took: ${duration} ms`);
  console.log(`Write Throughput: ${(testData.length / duration).toFixed(3)} operations per ms`);
}

module.exports = testWriteLatencyPerformance;
