const bcrypt = require("bcryptjs");
const jwt  = require("jsonwebtoken");

describe("Authentication logic", () => {
  const password = "mypassword";
  const hashedPassword = bcrypt.hashSync(password, 10);
  const secret = "testsecret";

  test("should hash password correctly", () => {
    expect(bcrypt.compareSync(password, hashedPassword)).toBe(true);
  });

  test("should generate a valid JWT token", () => {
    const payload = { id: 1, username: "admin" };
    const token = jwt.sign(payload, secret, { expiresIn: "10d" });
    const decoded = jwt.verify(token, secret);
    expect(decoded.id).toBe(payload.id);
    expect(decoded.username).toBe(payload.username);
  });
});
