const { test, after, describe, beforeEach } = require("node:test");
const assert = require("assert");
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../../app");
const Blog = require("../../models/blog");
const helper = require("../api/test_helper.test.js");
const jwt = require("jsonwebtoken");
const { url } = require("inspector");
const { title } = require("process");

const api = supertest(app);

let token;

beforeEach(async () => {
  // إنشاء مستخدم جديد مع توليد توكين له
  const user = {
    username: "testuser",
    name: "Test User",
    passwordHash: "password123",
  };

  const savedUser = await api.post("/api/users").send(user);

  // توليد التوكين
  token = jwt.sign({ id: savedUser.body.id }, process.env.SECRET);

  await Blog.deleteMany({});
  console.log("cleared");

  await Blog.insertMany(helper.initialBlogs);
  console.log("inserted");
});

describe("Blog Requests", () => {
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

  test("a valid blog can be added with a valid token", async () => {
    const newBlog = {
      title: "Test4",
      author: "testRequest",
      url: "test.com",
      likes: 4,
    };

    await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const response = await api.get("/api/blogs");

    assert.strictEqual(response.body.length, helper.initialBlogs.length + 1);

    const titles = response.body.map((e) => e.title);
    assert(titles.includes("Test4"));
  });

  test("blog adding without a token should fail with 401", async () => {
    const newBlog = {
      title: "Test4",
      author: "testRequest",
      url: "test.com",
      likes: 4,
    };

    const response = await api.post("/api/blogs").send(newBlog).expect(401);

    assert.strictEqual(response.body.error, "Token missing or invalid");
  });

  test("blog likes will be 0 if not specified", async () => {
    await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${token}`)
      .send(helper.blogWithNoLikes)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const response = await api.get("/api/blogs");
    const blog = response.body.find((e) => e.title === "Test5");
    assert.strictEqual(blog.likes, 0);
  });

  test("blog without title or url is not added", async () => {
    const newBlogWithoutTitle = {
      author: "testRequest",
      url: "test.com",
      likes: 4,
    };

    const newBlogWithoutUrl = {
      title: "test",
      author: "testRequest",
      likes: 4,
    };

    await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${token}`)
      .send(newBlogWithoutTitle)
      .expect(400);

    await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${token}`)
      .send(newBlogWithoutUrl)
      .expect(400);
  });

  test("a blog can be deleted with a valid token", async () => {
    const response = await api.get("/api/blogs");
    const blogToDelete = response.body[0];

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(204);

    const blogsAtEnd = await helper.blogsInDb();
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1);

    const titles = blogsAtEnd.map((r) => r.title);
    assert(!titles.includes(blogToDelete.title));
  });

  test("deleting a blog without a token should fail with 401", async () => {
    const response = await api.get("/api/blogs");
    const blogToDelete = response.body[0];

    const deleteResponse = await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .expect(401);

    assert.strictEqual(deleteResponse.body.error, "Token missing or invalid");
  });

  test("a blog can be updated with a valid token", async () => {
    const response = await api.get("/api/blogs");
    const blogToUpdate = response.body[0];

    const updatedBlog = {
      title: "Test1",
      author: "testRequest",
      url: "test.com",
      likes: 4,
    };

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send(updatedBlog)
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  test("to update blog you should add likes number", async () => {
    const response = await api.get("/api/blogs");
    const blogToUpdate = response.body[0];

    const updatedBlogWithoutLikes = {
      title: "Test1",
      author: "testRequest",
      url: "test.com",
    };

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send(updatedBlogWithoutLikes)
      .expect(400);
  });
});

after(async () => {
  await mongoose.connection.close();
});
