const express = require("express");
const app = express();
require("dotenv").config();

const mongoose = require("mongoose");
const Blog = require("./models/blog");

let blogs = [];

const cors = require("cors");
app.use(express.json());
app.use(cors());

app.get("/api/blogs", (request, response, next) => {
  Blog.find({})
    .then((blogs) => {
      response.json(blogs);
    })
    .catch((error) => next(error));
});

app.get("/api/blogs/:id", (request, response, next) => {
  const id = request.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return response.status(400).json({ error: "Invalid ID format" });
  }

  Blog.findById(id)
    .then((blog) => {
      if (blog) {
        response.json(blog);
      } else {
        response.status(404).json({ error: "blog not found" });
      }
    })
    .catch((error) => next(error));
});

app.post("/api/blogs", (request, response, next) => {
  const body = request.body;
  console.log(body);
  if (!body.title || !body.author || !body.url) {
    return response.status(400).json({ error: "Name or number is missing" });
  }

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
  });

  blog
    .save()
    .then((savedPerson) => {
      response.json(savedPerson);
    })
    .catch((error) => next(error));
});

app.delete("/api/blogs/:id", (request, response, next) => {
  const id = request.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return response.status(400).json({ error: "Invalid ID format" });
  }
  Blog.findByIdAndDelete(id)
    .then((result) => {
      if (result) {
        response.status(204).end();
      } else {
        response.status(404).json({ error: "Blog not found" });
      }
    })
    .catch((error) => next(error));
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
