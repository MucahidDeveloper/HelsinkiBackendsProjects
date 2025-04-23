const bcryptjs = require("bcryptjs");
const User = require("../models/user");

const usersRouter = require("express").Router();

// Get all users
// usersRouter.get("/", async (req, res) => {
//   const users = await User.find({}).populate("blogs", {
//     title: 1,
//     author: 1,
//     url: 1,
//   });
//   res.json(users);
// });

// Create a new user
usersRouter.post("/", async (req, res) => {
  const { username, name, password } = req.body;

  if (!password || password.length < 3) {
    return res
      .status(400)
      .json({ error: "Password must be at least 3 characters long" });
  }

  const saltRounds = 10;
  const passwordHash = await bcryptjs.hash(password, saltRounds);

  const user = new User({
    username,
    name,
    passwordHash,
  });

  const savedUser = await user.save();
  res.status(201).json(savedUser);
});

module.exports = usersRouter;
