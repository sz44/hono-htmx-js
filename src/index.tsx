import { Hono } from "hono";
import { html } from "hono/html";
import type { Todo } from "./types";
import {serveStatic} from "hono/bun";

const app = new Hono();

const todos: Todo[] = [{ id: 0, text: "one", isDone: false, createdAt: new Date() }];
let nextTodoId = 1;

const TodoItem = (todo: Todo) => html`
  <div id="todo-${todo.id}" class="todo-row">
    <span class="${todo.isDone ? "completed-text" : ""}">${todo.text}</span>
    <div class="todo-actions">
      <button
        type="button"
        hx-post="/todos/${todo.id}/toggle"
        hx-target="#todo-${todo.id}"
        hx-swap="outerHTML"
      >
        ${todo.isDone ? "undo" : "complete"}
      </button>
      <button
        type="button"
        class="delete-button"
        hx-delete="/todos/${todo.id}"
        hx-target="#todo-${todo.id}"
        hx-swap="outerHTML"
      >
        delete
      </button>
    </div>
  </div>
`;

app.use("/static/*", serveStatic({root: "src/"}));

app.get("/", (c) => {
  return c.html(html`
    <!doctype html>
    <html lang="en">
    <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>TODO</title>
    <script src="https://unpkg.com/htmx.org@2.0.4"></script>
    <link rel="stylesheet" href="static/styles.css" />
    </head>
    <body>
    <main>
      <h1>TODO</h1>
      <form
        hx-post="/todos"
        hx-target="#todoList"
        hx-swap="beforeend"
        hx-on::after-request="if (event.detail.successful) { this.reset(); this.querySelector('input').focus(); }"
      >
        <input type="text" name="todo" id="todotext" />
        <button type="submit">submit</button>
      </form>
      <div id="todoList">
        ${todos.map((todo) => TodoItem(todo))}
      </div>
    </main>
    </body>
    </html>
  `);
});

app.post("/todos", async (c) => {
  const body = await c.req.parseBody();
  const text = String(body["todo"] ?? "").trim();

  if (!text) {
    return c.text("todo text is required", 400);
  }

  const todo = {
    id: nextTodoId++,
    text,
    isDone: false,
    createdAt: new Date(),
  };

  todos.push(todo);

  return c.html(TodoItem(todo));
});

app.post("/todos/:id/toggle", (c) => {
  const id = Number(c.req.param("id"));
  const todo = todos.find((val) => val.id === id);

  if (!todo) {
    return c.text("todo not found", 404);
  }

  todo.isDone = !todo.isDone;

  return c.html(TodoItem(todo));
});

app.delete("/todos/:id", (c) => {
  const id = Number(c.req.param("id"));
  const todoIndex = todos.findIndex((val) => val.id === id);

  if (todoIndex === -1) {
    return c.text("todo not found", 404);
  }

  todos.splice(todoIndex, 1);

  return c.body(null);
});

export default app;
