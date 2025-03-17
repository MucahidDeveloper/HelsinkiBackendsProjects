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

  // assert.strictEqual(response.body.length, 3);

  const titles = response.body.map((e) => e.title);
  assert(titles.includes("Test1"));
});

test("blog posts have an id property instead of _id", async () => {
  const response = await api.get("/api/blogs");
  assert(response.body[0].id);
  assert(!response.body[0]._id);
});

test("a valid blog can be added ", async () => {
  const newBlog = {
    title: "Test4",
    author: "testRequest",
    url: "test.com",
    likes: 4,
  };

  await api
    .post("/api/blogs")
    .send(newBlog)
    .expect(201)
    .expect("Content-Type", /application\/json/);

  const response = await api.get("/api/blogs");

  assert.strictEqual(response.body.length, 8);

  const titles = response.body.map((e) => e.title);
  assert(titles.includes("Test4"));
});

after(async () => {
  await mongoose.connection.close();
});
