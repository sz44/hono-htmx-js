import { Hono } from 'hono'
import type { Context } from 'hono'
import { html, raw } from 'hono/html'
import { validator } from 'hono/validator'

const app = new Hono()

type Todo = {
  id: number
  text: string
  isDone: boolean
  createdAt: Date
}

const todos: Todo[] = [{ id: 0, text: 'one', isDone: false, createdAt: new Date() }]
let nextTodoId = 1

function jsonForScript(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}

const rootHandler = (c: Context) => {
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
        <div id="todoList"></div>
        <script>
          window.__TODOS__ = ${raw(jsonForScript(todos))};
        </script>
        <script type="module" src="/client.js"></script>
      </div>
    `
  )
}

const clientScriptHandler = async (c: Context) => {
  const result = await Bun.build({
    entrypoints: ['./src/client.ts'],
    target: 'browser',
    format: 'esm',
    sourcemap: 'inline',
    write: false,
  })

  if (!result.success) {
    return c.text(result.logs.map((log) => log.message).join('\n'), 500)
  }

  return c.body(result.outputs[0], 200, {
    'Content-Type': 'text/javascript; charset=utf-8',
  })
}

const routes = app
  .get('/', rootHandler)
  .get('/client.js', clientScriptHandler)
  .post(
    '/mark',
    validator('json', (value, c) => {
      const id = Number(value.id)

      if (!Number.isInteger(id)) {
        return c.json({ message: 'todo id is required' }, 400)
      }

      return { id }
    }),
    async (c) => {
      const { id } = c.req.valid('json')
      const todo = todos.find((val) => val.id === id)

      if (!todo) {
        return c.json({ message: 'todo not found' }, 404)
      }

      todo.isDone = !todo.isDone

      return c.json({ message: 'todo updated', todo })
    }
  )
  .post(
    '/delete',
    validator('json', (value, c) => {
      const id = Number(value.id)

      if (!Number.isInteger(id)) {
        return c.json({ message: 'todo id is required' }, 400)
      }

      return { id }
    }),
    async (c) => {
      const { id } = c.req.valid('json')
      const todoIndex = todos.findIndex((val) => val.id === id)

      if (todoIndex === -1) {
        return c.json({ message: 'todo not found' }, 404)
      }

      const [todo] = todos.splice(todoIndex, 1)

      return c.json({ message: 'todo deleted', todo })
    }
  )
  .post(
    '/submit',
    validator('form', (value, c) => {
      const text = String(value.todo ?? '').trim()

      if (!text) {
        return c.json({ message: 'todo text is required' }, 400)
      }

      return { todo: text }
    }),
    async (c) => {
      const { todo: text } = c.req.valid('form')

      const todo = {
        id: nextTodoId++,
        text,
        isDone: false,
        createdAt: new Date(),
      }

      todos.push(todo)

      return c.json({ message: 'new todo created', todo })
    }
  )

export type AppType = typeof routes

export default routes
