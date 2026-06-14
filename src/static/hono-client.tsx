/** @jsxImportSource hono/jsx/dom */
import { useEffect, useState } from "hono/jsx";
import { render } from "hono/jsx/dom";
import type { Todo } from "../types";

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    fetch("/todos")
      .then((resp) => resp.json() as Promise<Todo[]>)
      .then(setTodos)
      .catch(() => console.error("Failed to load todos"));
  }, []);

  async function addTodo(event: Event) {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const resp = await fetch("/submit", {
      method: "POST",
      body: new FormData(form),
    });

    if (!resp.ok) {
      console.error("Failed to create todo");
      return;
    }

    const { todo } = (await resp.json()) as { todo: Todo };
    setTodos([...todos, todo]);
    form.reset();
  }

  async function toggleTodo(id: number) {
    const resp = await fetch("/mark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!resp.ok) {
      console.error("Failed to mark todo");
      return;
    }

    const { todo } = (await resp.json()) as { todo: Todo };
    setTodos(todos.map((item) => (item.id === todo.id ? todo : item)));
  }

  async function deleteTodo(id: number) {
    const resp = await fetch("/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!resp.ok) {
      console.error("Failed to delete todo");
      return;
    }

    setTodos(todos.filter((todo) => todo.id !== id));
  }

  return (
    <div>
      <h1>TODO</h1>
      <form onSubmit={addTodo}>
        <input type="text" name="todo" id="todotext" />
        <button type="submit">submit</button>
      </form>
      <div id="todoList">
        {todos.map((todo) => (
          <div key={todo.id}>
            <span class={todo.isDone ? "completed-text" : ""}>{todo.text}</span>
            <button type="button" onClick={() => deleteTodo(todo.id)}>
              delete
            </button>
            <button type="button" onClick={() => toggleTodo(todo.id)}>
              {todo.isDone ? "undo" : "complete"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const root = document.getElementById("root") as HTMLDivElement;

render(<App />, root);
