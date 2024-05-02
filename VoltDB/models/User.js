const createUserTable = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    age INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_login TIMESTAMPTZ,
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
      this.id = data.id; // Ensure id is also handled if you're manipulating it elsewhere in your code
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
