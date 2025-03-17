const dummy = (blogs) => {
  return 1;
};

const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => sum + blog.likes, 0);
};

const favoriteBlog = (blogs) => {
  if (blogs.length === 0) return null;

  let favorite = blogs[0];
  for (const blog of blogs) {
    if (blog.likes > favorite.likes) {
      favorite = blog;
    }
  }

  return {
    title: favorite.title,
    author: favorite.author,
    likes: favorite.likes,
  };
};

const mostBlogs = (blogs) => {
  if (blogs.length === 0) return null;

  const authorCounts = {};

  // Count the number of blogs for each author
  for (const blog of blogs) {
    if (authorCounts[blog.author]) {
      authorCounts[blog.author]++;
    } else {
      authorCounts[blog.author] = 1;
    }
  }

  // Find the author with the most blogs
  let topAuthor = "";
  let maxBlogs = 0;
  for (const author in authorCounts) {
    if (authorCounts[author] > maxBlogs) {
      topAuthor = author;
      maxBlogs = authorCounts[author];
    }
  }

  return {
    author: topAuthor,
    blogs: maxBlogs,
  };
};

const mostLikes = (blogs) => {
  if (blogs.length === 0) return null;

  const authorLikes = {};

  // Calculate the total likes for each author
  for (const blog of blogs) {
    if (authorLikes[blog.author]) {
      authorLikes[blog.author] += blog.likes;
    } else {
      authorLikes[blog.author] = blog.likes;
    }
  }

  // Find the author with the most likes
  let topAuthor = "";
  let maxLikes = 0;
  for (const author in authorLikes) {
    if (authorLikes[author] > maxLikes) {
      topAuthor = author;
      maxLikes = authorLikes[author];
    }
  }

  return {
    author: topAuthor,
    likes: maxLikes,
  };
};

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
};
