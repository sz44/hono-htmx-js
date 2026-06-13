import { hc } from 'hono/client'
import type { InferResponseType } from 'hono/client'
import type { AppType } from './index'

const client = hc<AppType>(window.location.origin)

type Todo = InferResponseType<typeof client.submit.$post, 200>['todo']

declare global {
  interface Window {
    __TODOS__?: Todo[]
  }
}

const todoList = document.querySelector<HTMLDivElement>('#todoList')
const form = document.getElementById('myForm') as HTMLFormElement | null
const input = document.getElementById('todotext') as HTMLInputElement | null

if (!todoList || !form || !input) {
  throw new Error('Todo UI elements are missing')
}

for (const todo of window.__TODOS__ ?? []) {
  appendTodo(todo)
}

form.addEventListener('submit', async (event) => {
  event.preventDefault()

  const formData = new FormData(form)
  const response = await client.submit.$post({
    form: {
      todo: String(formData.get('todo') ?? ''),
    },
  })

  if (!response.ok) {
    console.error('Failed to create todo')
    return
  }

  const result = await response.json()
  appendTodo(result.todo)
  input.value = ''
  input.focus()
})

function appendTodo(todo: Todo) {
  const row = document.createElement('div')
  const text = document.createElement('span')
  const del = document.createElement('button')
  const done = document.createElement('button')

  text.textContent = todo.text
  del.textContent = 'delete'
  done.textContent = todo.isDone ? 'undo' : 'complete'

  row.dataset.todoId = String(todo.id)
  text.classList.toggle('completed-text', todo.isDone)

  done.addEventListener('click', async () => {
    const response = await client.mark.$post({
      json: {
        id: todo.id,
      },
    })

    if (!response.ok) {
      console.error('Failed to mark todo')
      return
    }

    const result = await response.json()
    todo.isDone = result.todo.isDone
    text.classList.toggle('completed-text', todo.isDone)
    done.textContent = todo.isDone ? 'undo' : 'complete'
  })

  del.addEventListener('click', async () => {
    const response = await client.delete.$post({
      json: {
        id: todo.id,
      },
    })

    if (!response.ok) {
      console.error('Failed to delete todo')
      return
    }

    row.remove()
  })

  row.appendChild(text)
  row.appendChild(del)
  row.appendChild(done)
  todoList.appendChild(row)
}
