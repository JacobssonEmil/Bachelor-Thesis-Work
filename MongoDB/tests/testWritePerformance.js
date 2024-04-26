const performanceNow = require('performance-now');
const User = require('../models/User');

async function testWritePerformance(testData) {
  const start = performanceNow();
  await User.insertMany(testData);
  const end = performanceNow();
  const duration = (end - start).toFixed(3);
  return duration;
}

module.exports = testWritePerformance;
