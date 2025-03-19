const Blog = require("../../models/blog");

const listWithOneBlog = [
  {
    title: "Go To Statement Considered Harmful",
    author: "Edsger W. Dijkstra",
    url: "https://homepages.cwi.nl/~storm/teaching/reader/Dijkstra68.pdf",
    likes: 5,
  },
];

const initialBlogs = [
  {
    title: "React patterns",
    author: "Michael Chan",
    url: "https://reactpatterns.com/",
    likes: 7,
  },
  {
    title: "Go To Statement Considered Harmful",
    author: "Edsger W. Dijkstra",
    url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html",
    likes: 5,
  },
  {
    title: "Test3",
    author: "testRequest",
    url: "test.com",
    likes: 3,
  },
  {
    title: "Test4",
    author: "testRequest",
    url: "test.com",
    likes: 4,
  },
];

const blogWithNoLikes = {
  title: "Test5",
  author: "testRequest",
  url: "test.com",
};

const nonExistingId = async () => {
  const blog = new Blog({ content: "willremovethissoon" });
  await blog.save();
  await blog.deleteOne();

  return blog._id.toString();
};

const blogsInDb = async () => {
  const blogs = await Blog.find({});
  return blogs.map((blog) => blog.toJSON());
};

module.exports = {
  initialBlogs,
  listWithOneBlog,
  blogWithNoLikes,
  nonExistingId,
  blogsInDb,
};
