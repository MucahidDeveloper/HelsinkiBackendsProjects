const { test, after } = require("node:test");
const assert = require("assert");
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../../app");

const api = supertest(app);

test("blogs are returned as json", async () => {
  const response = await api
    .get("/api/blogs")
    .expect(200)
    .expect("Content-Type", /application\/json/);

  assert.strictEqual(response.body.length, 3);

  const titles = response.body.map((e) => e.title);
  assert(titles.includes("Test1"));
});

test("blog posts have an id property instead of _id", async () => {
  const response = await api.get("/api/blogs");
  assert(response.body[0].id);
  assert(!response.body[0]._id);
});

after(async () => {
  await mongoose.connection.close();
});
