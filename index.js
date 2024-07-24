const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");
const initializeDatabase = require("./db.js");
const dotenv = require("dotenv");
const authenticateJWT = require("./middleware.js");

dotenv.config();

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// MySQL connection configuration (with database)
const dbConfigWithDatabase = {
  host: process.env.HOST,
  port: process.env.PORT,
  user: process.env.USER,
  password: process.env.PASS,
  database: process.env.DB,
};

// Create a connection to the MySQL database
const db = mysql.createConnection(dbConfigWithDatabase);

// Register a new user
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  // Check if user already exists
  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) throw err;
      if (results.length > 0) {
        return res
          .status(400)
          .json({ success: false, message: "User already exists." });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      db.query(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        [username, email, hashedPassword],
        (err, results) => {
          if (err) throw err;

          // Get the inserted user's id
          const userId = results.insertId;

          // Generate JWT
          const token = jwt.sign(
            { id: userId, username: username },
            process.env.JWT_SECRET,
            { expiresIn: "10d" }
          );

          // Fetch the newly created user data
          db.query(
            "SELECT id, username, email FROM users WHERE id = ?",
            [userId],
            (err, results) => {
              if (err) throw err;

              res.status(201).json({
                success: true,
                message: "User registered.",
                userData: results[0],
                token: token,
              });
            }
          );
        }
      );
    }
  );
});

// Login a user and return a JWT
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) throw err;
      if (results.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid credentials." });
      }

      const user = results[0];

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid credentials." });
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "10d" }
      );
      res.json({
        success: true,
        message: "User logged in successfully!",
        userData: user,
        token: token,
      });
    }
  );
});

// Retrieve the logged-in user's profile information (protected endpoint)
app.get("/profile", authenticateJWT, (req, res) => {
  if (!req.user) {
    return res.status(400).json({ success: false, message: "Invalid token." });
  }

  db.query(
    "SELECT username, email FROM users WHERE id = ?",
    [req.user.id],
    (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error." });
      }

      if (results.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }

      res.json({ success: true, userData: results[0] });
    }
  );
});

// Initialize the database and start the server
const serverPromise = new Promise((resolve, reject) => {
  initializeDatabase((err) => {
    if (err) {
      console.log("Failed to initialize database:", err);
      return reject(err);
    }

    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      resolve(server);
    });
  });
});

module.exports = { app, serverPromise };
