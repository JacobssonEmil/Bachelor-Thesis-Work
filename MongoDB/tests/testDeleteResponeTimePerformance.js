const performanceNow = require('performance-now');
const User = require('../models/User');

async function testDeleteResponseTime(email) {
  const start = performanceNow();
  await User.findOne({ email });
  const end = performanceNow();
  const responseTime = (end - start).toFixed(3);
  console.log(`Read operation Response Time: ${responseTime} ms`);
}
module.exports = testDeleteResponseTime;