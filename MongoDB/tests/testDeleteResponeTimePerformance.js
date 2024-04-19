const performanceNow = require('performance-now');
const User = require('../models/User');

async function testDeleteResponseTime(email) {
  const start = performanceNow();
  await User.deleteOne({ email });
  const end = performanceNow();
  const responseTime = (end - start).toFixed(3);
  console.log(`Delete operation Response Time: ${responseTime} ms`);
}
module.exports = testDeleteResponseTime;