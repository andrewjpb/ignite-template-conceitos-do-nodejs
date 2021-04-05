const express = require("express");
const cors = require("cors");
const { v4, validate } = require("uuid");

// const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const userName = request.headers.username;
  const user = users.find((user) => user.username === userName);
  if (!user || user === undefined) {
    return response.status(401).send();
  }
  request.user = user;
  next();
}

app.post("/users", (request, response) => {
  const { username, name } = request.body;

  if (!username) {
    return response.status(400).send();
  }

  if (!name) {
    return response.status(400).send();
  }
  const userExists = users.find((user) => user.username === username);
  if (userExists) {
    return response.status(400).send({ error: "user exists" });
  }
  const user = {
    id: v4(),
    name,
    username,
    todos: [],
  };

  users.push(user);
  return response.status(201).send(user);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;

  const todo = {
    id: v4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  const userIndex = users.findIndex((user) => user.id === request.user.id);
  users[userIndex].todos.push(todo);
  return response.status(201).send(todo);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  return response.send(users.find((user) => user.id === request.user.id).todos);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const idTodo = request.params.id;

  if (!validate(idTodo)) {
    return response.status(404).send({ error: "todo not found" });
  }
  const userIndex = users.findIndex((user) => user.id === request.user.id);
  const todoIndex = users[userIndex].todos.findIndex(
    (todo) => todo.id === idTodo
  );
  if (todoIndex < 0) {
    return response.status(404).send({ error: "todo not found" });
  }
  const { title, deadline } = request.body;

  const todo = users[userIndex].todos[todoIndex];
  todo.title = title;
  todo.deadline = deadline;

  return response.status(201).send(todo);
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const userIndex = users.findIndex((user) => user.id === request.user.id);
  const todoIndex = users[userIndex].todos.findIndex(
    (todo) => todo.id === request.params.id
  );
  if (todoIndex < 0) {
    return response.status(404).send({ error: "todo not found" });
  }
  const todo = users[userIndex].todos[todoIndex];
  todo.done = true;
  return response.status(201).send(todo);
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const userIndex = users.findIndex((user) => user.id === request.user.id);
  const todoIndex = users[userIndex].todos.findIndex(
    (todo) => todo.id === request.params.id
  );
  if (todoIndex < 0) {
    return response.status(404).send({ error: "todo not found" });
  }
  users[userIndex].todos.splice(todoIndex, 1);
  return response.status(204).send();
});

module.exports = app;
