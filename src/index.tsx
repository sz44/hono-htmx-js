import { Hono } from "hono";
import { html } from "hono/html";
import type { Todo } from "./types";
import { serveStatic } from "hono/bun";


const app = new Hono();

app.use("/static/*", serveStatic({ root: "./src" }));
// app.use("/client.js", serveStatic({ path: "./src/static/client.js" }));

const todos: Todo[] = [{ id: 0, text: "one", isDone: false, createdAt: new Date() }];
let nextTodoId = 1;

app.get("/", (c) => {
  return c.html(html`
    <style>
      .completed-text {
        text-decoration: line-through;
      }
    </style>
    <div id="root"></div>
    <script type="module" src="static/hono-client.js"></script>
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
