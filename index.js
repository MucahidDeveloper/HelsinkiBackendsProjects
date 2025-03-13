const express = require("express");
const morgan = require("morgan");
const app = express();
require("dotenv").config();

const Person = require("./models/person");

morgan.token("post-data", (req) =>
  req.method === "POST" ? JSON.stringify(req.body) : ""
);
app.use(
  morgan(
    ":method :url :status :res[content-length] - :response-time ms :post-data"
  )
);

let persons = [];

const cors = require("cors");
app.use(cors());

app.use(express.json());

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

app.get("/api/persons", (request, response) => {
  Person.find({}).then((persons) => {
    response.json(persons);
  });
});

app.get("/api/persons/:id", (request, response) => {
  Person.findById(request.params.id).then((person) => {
    if (person) {
      response.json(person);
    } else {
      response.status(404).end();
    }
  });
});

app.post("/api/persons", (request, response) => {
  const body = request.body;

  if (!body.name || !body.number) {
    return response.status(400).json({ error: "Name or number is missing" });
  }

  if (persons.find((person) => person.name === body.name)) {
    return response.status(400).json({ error: "Name must be unique" });
  }

  const person = new Person({
    name: body.name,
    number: body.number,
  });

  person.save().then((savedPerson) => {
    response.json(savedPerson);
  });
  // persons = persons.concat(person);

  // response.status(201).json(person);
});

app.delete("/api/persons/:id", (request, response) => {
  const id = request.params.id;
  persons = persons.filter((person) => person.id !== id);

  response.status(204).end();
});

// const generateId = () => {
//   const id = Math.random().toFixed(5) * 100000;
//   return String(id);
// };

app.get("/info", (request, response) => {
  const time = new Date().toString();
  const count = persons.length;
  response.send(`<p>Phonebook has info for ${count} people</p><p>${time}</p>`);
});

app.use(unknownEndpoint);

app.use(express.static("dist"));

const path = require("path");
app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
