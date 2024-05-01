const createUserTable = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    age INTEGER,
    created_at TIMESTAMP,
    last_login TIMESTAMP,
    status VARCHAR(50),
    country VARCHAR(100)
  );
`;

async function setupDatabase(client) {
  // Create the users table if it doesn't exist
  await client.query(createUserTable);

  // Define a User class to represent the users table
  class User {
    constructor(data) {
      this.name = data.name;
      this.email = data.email;
      this.age = data.age;
      this.createdAt = data.created_at;
      this.lastLogin = data.last_login;
      this.status = data.status;
      this.country = data.country;
    }
  }

  return User;
}

module.exports = setupDatabase; // Export the setupDatabase function
