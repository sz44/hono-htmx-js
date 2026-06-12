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

app.get('/', (c) => {
  return c.html(
    html`
      <div>
        <h1>TODO</h1>
        <form action="/submit" method="post" id="myForm">
          <input type="text" name="todo" id="todotext" />
          <button type="submit">submit</button>
        </form>
        <div id="todoList">

        </div>
        <script>
          const todos = ${raw(JSON.stringify(todos))};
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
            const don = document.createElement("button");

            text.textContent = todo.text;
            del.textContent = "delete";
            don.textContent = "complete";

            row.appendChild(text);
            row.appendChild(del);
            row.appendChild(don);
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
