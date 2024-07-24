const request = require("supertest");
const { app, serverPromise } = require("../index.js");

jest.setTimeout(60000); // Set timeout to 30 seconds

describe("Auth integration tests", () => {
  let server;
  let token;

  beforeAll(async () => {
    server = await serverPromise; // Wait for the server to start
  });

  it("should register a new user", async () => {
    const response = await request(app).post("/register").send({
      username: "admin8",
      email: "admin8@gmail.com",
      password: "123",
    });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("token");
    token = response.body.token; // Save the token for later tests
  }, 60000); // Increase timeout to 10 seconds

  it("should log in an existing user", async () => {
    const response = await request(app).post("/login").send({
      email: "admin8@gmail.com",
      password: "123",
    });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
  }, 60000); // Increase timeout to 10 seconds

  it("should access protected profile route with valid token", async () => {
    const response = await request(app)
      .get("/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("userData.username", "admin8");
  });

  it("should fail to access protected profile route with invalid token", async () => {
    const response = await request(app)
      .get("/profile")
      .set("Authorization", "invalidtoken");
    expect(response.status).toBe(401);
  });

  afterAll((done) => {
    server?.close(done);
  });
});
