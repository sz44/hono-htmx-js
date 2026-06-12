import { Hono } from 'hono'
import { html, raw } from 'hono/html'

const app = new Hono()

type Todo = {
  id: number
  text: string
  createdAt: Date
}

const todos: Todo[] = [ {id:0, text:"one", createdAt:new Date()}]
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
            const row = document.createElement("div");
            row.textContent = todo.text;
            todoList.appendChild(row);
          }
          const form = document.getElementById('myForm');
          form.addEventListener('submit', function(event) {
            event.preventDefault();
            console.log('Form submission intercepted!');
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
  const todo = String(body['todo'] ?? '').trim()

  todos.push({
    id: nextTodoId++,
    text: todo,
    createdAt: new Date()
  });

  return c.json({ message: 'new todo created', todo })
})

export default app
