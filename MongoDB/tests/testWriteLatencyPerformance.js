const performanceNow = require('performance-now');
const User = require('../models/User');

async function testWriteLatency(userData) {
    const start = performanceNow();
    await new User(userData).save();
    const end = performanceNow();
    const latency = (end - start).toFixed(3);
    console.log(`Write operation latency: ${latency} ms`);
  }
  module.exports = testWriteLatency;