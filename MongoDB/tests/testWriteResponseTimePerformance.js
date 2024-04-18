const performanceNow = require('performance-now');
const User = require('../models/User');

async function testWriteResponseTime(userData) {
    const start = performanceNow();
    await new User(userData).save();
    const end = performanceNow();
    const responseTime = (end - start).toFixed(3);
    console.log(`Write operation Response Time: ${responseTime} ms`);
  }
  module.exports = testWriteResponseTime;