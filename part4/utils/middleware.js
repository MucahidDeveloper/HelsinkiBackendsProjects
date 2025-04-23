const morgan = require("morgan");

morgan.token("post-data", (req) => {
  return req.method === "POST" ? JSON.stringify(req.body) : "";
});

const requestLogger = morgan(
  ":method :url :status :res[content-length] - :response-time ms :post-data"
);

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

const errorHandler = (error, request, response, next) => {
  console.error(error.message);

  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" });
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message });
  } else if (
    error.name === "MongoServerError" &&
    error.message.includes("E11000 duplicate key error")
  ) {
    return response
      .status(400)
      .json({ error: "expected `username` to be unique" });
  }

  next(error);
};

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
};
