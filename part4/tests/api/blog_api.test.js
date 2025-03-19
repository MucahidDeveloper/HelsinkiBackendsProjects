const { test, after, describe, beforeEach } = require("node:test");
const assert = require("assert");
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../../app");
const Blog = require("../../models/blog");
const helper = require("../api/test_helper.test.js");

const api = supertest(app);

describe("Blog Requests", () => {
  beforeEach(async () => {
    await Blog.deleteMany({});
    console.log("cleared");

    await Blog.insertMany(helper.initialBlogs);
    console.log("inserted");
  });

  test("blogs are returned as json", async () => {
    const response = await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    assert.strictEqual(response.body.length, helper.initialBlogs.length);

    const titles = response.body.map((e) => e.title);
    assert(titles.includes("Test3"));
  });

  test("blog posts have an id property instead of _id", async () => {
    const response = await api.get("/api/blogs");
    assert(response.body[0].id);
    assert(!response.body[0]._id);
  });

  test("a valid blog can be added", async () => {
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

    assert.strictEqual(response.body.length, helper.initialBlogs.length + 1);

    const titles = response.body.map((e) => e.title);
    assert(titles.includes("Test4"));
  });

  test.only("blog likes will be 0 if not specified", async () => {
    await api
      .post("/api/blogs")
      .send(helper.blogWithNoLikes)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const response = await api.get("/api/blogs");
    const blog = response.body.find((e) => e.title === "Test5");
    assert.strictEqual(blog.likes, 0);
  });
});

after(async () => {
  await mongoose.disconnect();
});
