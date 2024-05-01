async function generateTestData(n) {
  let testData = [];
  const statuses = ['active', 'suspended', 'deleted'];
  const countries = ['USA', 'Canada', 'UK', 'Australia', 'Germany', 'France', 'Japan', 'Brazil', 'India', 'China'];

  for (let i = 0; i < n; i++) {
    const daysAgoCreated = Math.floor(Math.random() * 365 * 2); // up to two years ago
    const daysAgoLoggedIn = Math.floor(Math.random() * 90); // up to 90 days ago
    const createdAt = new Date(new Date() - daysAgoCreated * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const lastLogin = new Date(new Date() - daysAgoLoggedIn * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    testData.push({
      name: `User${i}`,
      email: `user${i}@example.com`,
      age: Math.floor(Math.random() * 100),
      createdAt: createdAt,
      lastLogin: lastLogin,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      country: countries[Math.floor(Math.random() * countries.length)]
    });
  }
  return testData;
}

module.exports = generateTestData;
