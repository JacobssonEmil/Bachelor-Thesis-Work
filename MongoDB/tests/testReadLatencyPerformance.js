const performanceNow = require('performance-now');
const User = require('../models/User');

async function testReadLatency(email) {
  const start = performanceNow();
  await User.findOne({ email });
  const end = performanceNow();
  const latency = (end - start).toFixed(3);
  console.log(`Read operation latency: ${latency} ms`);
}
module.exports = testReadLatency;