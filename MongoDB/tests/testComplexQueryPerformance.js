const performanceNow = require('performance-now');
const User = require('../models/User');

// Test User Retention Analysis Query Performance
async function testUserRetentionAnalysisPerformance() {
  const start = performanceNow();
  
  await User.aggregate([
    {
      $project: {
        signup_month: { $dateToString: { format: "%Y-%m", date: "$created_at" } },
        active_last_month: {
          $cond: {
            if: { $gte: ["$last_login", { $dateSubtract: { startDate: new Date(), unit: "month", amount: 1 } }] },
            then: 1,
            else: 0
          }
        }
      }
    },
    {
      $group: {
        _id: "$signup_month",
        total_users: { $sum: 1 },
        active_last_month: { $sum: "$active_last_month" }
      }
    },
    { $sort: { _id: -1 } }
  ]);

  const end = performanceNow();
  const duration = (end - start).toFixed(3);
  return duration;
}

// Test Demographic and Status Distribution Query Performance
async function testDemographicStatusDistributionPerformance() {
  const start = performanceNow();
  
  await User.aggregate([
    {
      $match: { status: { $in: ["active", "suspended"] } }
    },
    {
      $group: {
        _id: { country: "$country", status: "$status" },
        average_age: { $avg: "$age" },
        user_count: { $sum: 1 }
      }
    },
    {
      $sort: { "_id.country": 1, user_count: -1 }
    }
  ]);

  const end = performanceNow();
  const duration = (end - start).toFixed(3);
  return duration;
}

// Test Inactivity Analysis for Potential Account Cleanup Performance
async function testInactivityAnalysisPerformance() {
  const start = performanceNow();
  
  await User.aggregate([
    {
      $match: {
        status: "active",
        last_login: { $lt: new Date(new Date() - 180 * 24 * 60 * 60 * 1000) }  // 180 days ago
      }
    },
    {
      $project: {
        name: 1,
        email: 1,
        days_inactive: { $subtract: [new Date(), "$last_login"] }
      }
    },
    {
      $sort: { days_inactive: -1 }
    },
    {
      $limit: 100
    }
  ]);

  const end = performanceNow();
  const duration = (end - start).toFixed(3);
  return duration;
}

module.exports = {testDemographicStatusDistributionPerformance, testInactivityAnalysisPerformance, testUserRetentionAnalysisPerformance};