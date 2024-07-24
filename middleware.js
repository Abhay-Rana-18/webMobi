const jwt = require("jsonwebtoken");

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET; // Replace with your own secret key

// Middleware to authenticate JWT
const authenticateJWT = (req, res, next) => {
  // Get the token from the Authorization header
  let token = req.header("Authorization");

  if (!token) {
    return res.status(401).send("Access denied. No token provided.");
  }

  try {
    token = token.split(" ")[1];
    if (!token) {
      return res.status(401).send("Access denied. No token provided.");
    }
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded) {
      return res.status(401).send("Access denied. No token provided.");
    }

    // Attach the user information to the request object
    req.user = decoded;

    // Proceed to the next middleware or route handler
    next();
  } catch (err) {
    res.status(400).send("Invalid token.");
  }
};

module.exports = authenticateJWT;
