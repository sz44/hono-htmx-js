import { Hono } from "hono";
import { html } from "hono/html";
import type { Todo } from "./types";
import { serveStatic } from "hono/bun";


const app = new Hono();

app.use("/static/*", serveStatic({ root: "./src" }));
// app.use("/client.js", serveStatic({ path: "./src/static/client.js" }));

const todos: Todo[] = [{ id: 0, text: "one", isDone: false, createdAt: new Date() }];
let nextTodoId = 1;

function TodoItem(todo: Todo) {
  return html`
    <div data-todo-id="${todo.id}">
      <span class="${todo.isDone ? "completed-text" : ""}">${todo.text}</span>
      <button type="button" data-action="delete">delete</button>
      <button type="button" data-action="toggle">${todo.isDone ? "undo" : "complete"}</button>
    </div>
  `;
}

app.get("/", (c) => {
  return c.html(html`
    <style>
      .completed-text {
        text-decoration: line-through;
      }
    </style>
    <div>
      <h1>TODO</h1>
      <form action="/submit" method="post" id="myForm">
        <input type="text" name="todo" id="todotext" />
        <button type="submit">submit</button>
      </form>
      <div id="todoList">
        ${todos.map((todo) => TodoItem(todo))}
      </div>
      <template id="todoItemTemplate">
        <div data-todo-id="">
          <span></span>
          <button type="button" data-action="delete">delete</button>
          <button type="button" data-action="toggle"></button>
        </div>
      </template>
      <script type="module" src="static/client.js"></script>
    </div>
  `);
});
app.post("/mark", async (c) => {
  const body = await c.req.json<{ id: number }>();
  const todo = todos.find((val) => val.id === Number(body.id));

  if (!todo) {
    return c.json({ message: "todo not found" }, 404);
  }

  todo.isDone = !todo.isDone;

  return c.json({ message: "todo updated", todo });
});

app.post("/delete", async (c) => {
  const body = await c.req.json<{ id: number }>();
  const todoIndex = todos.findIndex((val) => val.id === Number(body.id));

  if (todoIndex === -1) {
    return c.json({ message: "todo not found" }, 404);
  }

  const [todo] = todos.splice(todoIndex, 1);

  return c.json({ message: "todo deleted", todo });
});

app.post("/submit", async (c) => {
  // Parse the form body
  const body = await c.req.parseBody();

  // Access individual fields
  const text = String(body["todo"] ?? "").trim();

  if (!text) {
    return c.json({ message: "todo text is required" }, 400);
  }

  const todo = {
    id: nextTodoId++,
    text,
    isDone: false,
    createdAt: new Date(),
  };

  todos.push(todo);

  return c.json({ message: "new todo created", todo });
});

app.get("/todos", (c) => {
  return c.json(todos);
});

export default app;
