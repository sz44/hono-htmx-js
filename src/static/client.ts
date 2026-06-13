import type { Todo } from "../types";

const todoList = document.querySelector("#todoList") as HTMLDivElement;

const resp = await fetch("/todos");
const todos = await resp.json() as Todo[];

for (const todo of todos) {
  appendTodo(todo);
}

const form = document.getElementById("myForm") as HTMLFormElement;
const input = document.getElementById("todotext") as HTMLInputElement;

function appendTodo(todo: Todo) {
  const row = document.createElement("div");
  const text = document.createElement("span");
  const del = document.createElement("button");
  const done = document.createElement("button");

  text.textContent = todo.text;
  del.textContent = "delete";
  done.textContent = todo.isDone ? "undo" : "complete";

  text.classList.toggle("completed-text", todo.isDone);

  done.addEventListener("click", async function () {
    const resp = await fetch("/mark", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: todo.id }),
    });

    if (!resp.ok) {
      console.error("Failed to mark todo");
      return;
    }

    const result = await resp.json();
    todo.isDone = result.todo.isDone;
    text.classList.toggle("completed-text", todo.isDone);
    done.textContent = todo.isDone ? "undo" : "complete";
  });

  del.addEventListener("click", async function () {
    const resp = await fetch("/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: todo.id }),
    });

    if (!resp.ok) {
      console.error("Failed to delete todo");
      return;
    }

    row.remove();
  });

  row.appendChild(text);
  row.appendChild(del);
  row.appendChild(done);
  todoList.appendChild(row);
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  const formData = new FormData(form);
  const response = await fetch("/submit", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    console.error("Failed to create todo");
    return;
  }

  const result = await response.json();
  appendTodo(result.todo);
  input.value = "";
  input.focus();
});
