import { Hono } from 'hono'
import { html, raw } from 'hono/html'

const app = new Hono()

type Todo = {
  id: number
  text: string
  isDone: boolean
  createdAt: Date
}

const todos: Todo[] = [ {id:0, text:"one", isDone:false ,createdAt:new Date()}]
let nextTodoId = 1

function jsonForScript(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}

app.get('/', (c) => {
  return c.html(
    html`
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

        </div>
        <script>
          const todos = ${raw(jsonForScript(todos))};
          const todoList = document.querySelector("#todoList");

          for (const todo of todos) {
            appendTodo(todo);
          }

          const form = document.getElementById('myForm');
          const input = document.getElementById('todotext');

          function appendTodo(todo) {
            const row = document.createElement("div");
            const text = document.createElement("span")
            const del = document.createElement("button");
            const done = document.createElement("button");

            text.textContent = todo.text;
            del.textContent = "delete";
            done.textContent = todo.isDone ? "undo" : "complete";

            row.dataset.todoId = todo.id;
            text.classList.toggle("completed-text", todo.isDone);

            done.addEventListener("click", async function() {
              const resp = await fetch("/mark", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({ id: todo.id })
              });

              if (!resp.ok) {
                console.error('Failed to mark todo');
                return;
              }

              const result = await resp.json();
              todo.isDone = result.todo.isDone;
              text.classList.toggle("completed-text", todo.isDone);
              done.textContent = todo.isDone ? "undo" : "complete";
            });

            del.addEventListener("click", async function() {
              const resp = await fetch("/delete", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({ id: todo.id })
              });

              if (!resp.ok) {
                console.error('Failed to delete todo');
                return;
              }

              row.remove();
            });

            row.appendChild(text);
            row.appendChild(del);
            row.appendChild(done);
            todoList.appendChild(row);
          }

          
          form.addEventListener('submit', async function(event) {
            event.preventDefault();

            const formData = new FormData(form);
            const response = await fetch('/submit', {
              method: 'POST',
              body: formData
            });
            if (!response.ok) {
              console.error('Failed to create todo');
              return;
            }
            
            const result = await response.json();
            appendTodo(result.todo);
            input.value = '';
            input.focus();
          });
          
        </script>
      </div>
    `
  )
})
app.post('/mark', async (c) => {
  const body = await c.req.json<{ id: number }>()
  const todo = todos.find((val) => val.id === Number(body.id))

  if (!todo) {
    return c.json({ message: 'todo not found' }, 404)
  }

  todo.isDone = !todo.isDone

  return c.json({ message: 'todo updated', todo })
});

app.post('/delete', async (c) => {
  const body = await c.req.json<{ id: number }>()
  const todoIndex = todos.findIndex((val) => val.id === Number(body.id))

  if (todoIndex === -1) {
    return c.json({ message: 'todo not found' }, 404)
  }

  const [todo] = todos.splice(todoIndex, 1)

  return c.json({ message: 'todo deleted', todo })
})

app.post('/submit', async (c) => {
  // Parse the form body
  const body = await c.req.parseBody()
  
  // Access individual fields
  const text = String(body['todo'] ?? '').trim()

  if (!text) {
    return c.json({ message: 'todo text is required' }, 400)
  }

  const todo = {
    id: nextTodoId++,
    text,
    isDone: false,
    createdAt: new Date()
  }

  todos.push(todo);

  return c.json({ message: 'new todo created', todo })
})



export default app
