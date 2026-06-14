import type { Todo } from "../types";

const todoList = document.querySelector("#todoList") as HTMLDivElement;
const todoItemTemplate = document.querySelector("#todoItemTemplate") as HTMLTemplateElement;

const form = document.getElementById("myForm") as HTMLFormElement;
const input = document.getElementById("todotext") as HTMLInputElement;

function appendTodo(todo: Todo) {
  const row = todoItemTemplate.content.firstElementChild?.cloneNode(true) as HTMLDivElement;
  const text = row.querySelector("span") as HTMLSpanElement;

  row.dataset.todoId = String(todo.id);
  text.textContent = todo.text;
  updateTodoState(row, todo.isDone);
  todoList.appendChild(row);
}

function updateTodoState(row: HTMLDivElement, isDone: boolean) {
  const text = row.querySelector("span") as HTMLSpanElement;
  const done = row.querySelector('[data-action="toggle"]') as HTMLButtonElement;

  text.classList.toggle("completed-text", isDone);
  done.textContent = isDone ? "undo" : "complete";
}

todoList.addEventListener("click", async function (event) {
  const target = event.target;

  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const row = target.closest("[data-todo-id]") as HTMLDivElement | null;
  if (!row) {
    return;
  }

  const id = Number(row.dataset.todoId);

  if (target.dataset.action === "toggle") {
    const resp = await fetch("/mark", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    if (!resp.ok) {
      console.error("Failed to mark todo");
      return;
    }

    const result = await resp.json();
    updateTodoState(row, result.todo.isDone);
    return;
  }

  if (target.dataset.action === "delete") {
    const resp = await fetch("/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    if (!resp.ok) {
      console.error("Failed to delete todo");
      return;
    }

    row.remove();
  }
});

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
