// src/static/client.ts
var todoList = document.querySelector("#todoList");
var todoItemTemplate = document.querySelector("#todoItemTemplate");
var form = document.getElementById("myForm");
var input = document.getElementById("todotext");
function appendTodo(todo) {
  const row = todoItemTemplate.content.firstElementChild?.cloneNode(true);
  const text = row.querySelector("span");
  row.dataset.todoId = String(todo.id);
  text.textContent = todo.text;
  updateTodoState(row, todo.isDone);
  todoList.appendChild(row);
}
function updateTodoState(row, isDone) {
  const text = row.querySelector("span");
  const done = row.querySelector('[data-action="toggle"]');
  text.classList.toggle("completed-text", isDone);
  done.textContent = isDone ? "undo" : "complete";
}
todoList.addEventListener("click", async function(event) {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }
  const row = target.closest("[data-todo-id]");
  if (!row) {
    return;
  }
  const id = Number(row.dataset.todoId);
  if (target.dataset.action === "toggle") {
    const resp = await fetch("/mark", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id })
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
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id })
    });
    if (!resp.ok) {
      console.error("Failed to delete todo");
      return;
    }
    row.remove();
  }
});
form.addEventListener("submit", async function(event) {
  event.preventDefault();
  const formData = new FormData(form);
  const response = await fetch("/submit", {
    method: "POST",
    body: formData
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
