// User.js for Neo4j
const neo4j = require('neo4j-driver');

class User {
  constructor(driver) {
    this.driver = driver;
  }

  async createUser(userData) {
    const session = this.driver.session();
    const query = `
      CREATE (u:User {
        name: $name,
        email: $email,
        age: $age,
        createdAt: $createdAt,
        lastLogin: $lastLogin,
        status: $status,
        country: $country
      })
      RETURN u
    `;
    try {
      const result = await session.run(query, userData);
      return result.records;
    } finally {
      await session.close();
    }
  }

  // Add other methods as needed to manipulate User nodes in your database
}

module.exports = User;
