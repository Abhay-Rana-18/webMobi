const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

// MySQL connection configuration (initial connection without database)
const initialDbConfig = {
  host: process.env.HOST,
  port: process.env.PORT,
  user: process.env.USER,
  password: process.env.PASS,
  connectTimeout: 10000, // Set connection timeout to 10 seconds
};

// MySQL connection configuration (with database)
const dbConfigWithDatabase = {
  ...initialDbConfig,
  database: "auth_system",
};

const initializeDatabase = (callback) => {
  // Connect to MySQL without specifying the database and create the database if it doesn't exist
  const initialDb = mysql.createConnection(initialDbConfig);

  initialDb.connect((err) => {
    if (err) {
      console.log("Initial database connection failed:", err);
      return callback(err);
    }
    console.log("Connected to MySQL server.");

    // Create database if it doesn't exist
    initialDb.query("CREATE DATABASE IF NOT EXISTS auth_system", (err) => {
      if (err) {
        console.log("Database creation failed:", err);
        initialDb.end();
        return callback(err);
      }
      console.log("Database created or already exists.");

      // Now connect to the newly created database
      const db = mysql.createConnection(dbConfigWithDatabase);

      db.connect((err) => {
        if (err) {
          console.log("Database connection failed:", err);
          return callback(err);
        }
        console.log("Connected to MySQL database.");

        // Create table if it doesn't exist
        const createTableSql = `
                    CREATE TABLE IF NOT EXISTS users (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        username VARCHAR(255) NOT NULL UNIQUE,
                        email VARCHAR(255) NOT NULL UNIQUE,
                        password VARCHAR(255) NOT NULL
                    );
                `;
        db.query(createTableSql, (err, results) => {
          if (err) {
            console.log("Table creation failed:", err);
            return callback(err);
          }
          console.log("Table ensured.");
          db.end(); // Close the connection when done
          callback(null);
        });
      });
    });
  });
};

module.exports = initializeDatabase;
