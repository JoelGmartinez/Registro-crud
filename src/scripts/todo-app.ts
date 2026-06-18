import { supabase } from '../lib/supabase'

const $ = (id: string) => document.getElementById(id)!

const registerForm = $('register-form') as HTMLFormElement
const loginForm = $('login-form') as HTMLFormElement
const tareasSection = $('tareas-section')
const userEmail = $('user-email')
const btnLogout = $('btn-logout')
const tareaForm = $('tarea-form') as HTMLFormElement
const tareaInput = $('tarea-titulo') as HTMLInputElement
const tareaIdInput = $('tarea-id') as HTMLInputElement
const listaTareas = $('lista-tareas')
const btnGuardar = $('btn-guardar')
const mensaje = $('mensaje')

$('show-login').addEventListener('click', (e) => {
  e.preventDefault()
  registerForm.classList.add('hidden')
  loginForm.classList.remove('hidden')
})

$('show-register').addEventListener('click', (e) => {
  e.preventDefault()
  loginForm.classList.add('hidden')
  registerForm.classList.remove('hidden')
})

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const email = (document.getElementById('reg-email') as HTMLInputElement).value
  const password = (document.getElementById('reg-password') as HTMLInputElement).value
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) {
    alert('Error al registrarse: ' + error.message)
  } else {
    mensaje.textContent = 'Registro exitoso'
    mensaje.classList.remove('hidden')
  }
})

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const email = (document.getElementById('login-email') as HTMLInputElement).value
  const password = (document.getElementById('login-password') as HTMLInputElement).value
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    alert('Error al iniciar sesión: ' + error.message)
  }
})

supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    registerForm.classList.add('hidden')
    loginForm.classList.add('hidden')
    tareasSection.classList.remove('hidden')
    userEmail.textContent = session.user.email
    cargarTareas()
  } else {
    registerForm.classList.remove('hidden')
    loginForm.classList.add('hidden')
    tareasSection.classList.add('hidden')
  }
})

btnLogout.addEventListener('click', async () => {
  await supabase.auth.signOut()
})

async function cargarTareas() {
  const { data: todos, error } = await supabase
    .from('todos')
    .select('*')
    .order('inserted_at', { ascending: false })

  if (error) {
    console.error('Error al cargar tareas:', error)
    return
  }

  listaTareas.innerHTML = ''
  if (!todos || todos.length === 0) {
    listaTareas.innerHTML = '<li class="loading">No hay tareas. ¡Agrega una!</li>'
    return
  }

  for (const todo of todos) {
    const li = document.createElement('li')
    li.dataset.id = todo.id

    const span = document.createElement('span')
    span.textContent = todo.task
    if (todo.is_completed) {
      span.style.textDecoration = 'line-through'
      span.style.color = '#6b7280'
    }

    const actions = document.createElement('div')
    actions.className = 'actions'

    const btnToggle = document.createElement('button')
    btnToggle.textContent = todo.is_completed ? 'Desmarcar' : 'Completar'
    btnToggle.className = todo.is_completed ? 'btn-delete' : 'btn-edit'
    btnToggle.addEventListener('click', () => toggleTarea(todo.id, !todo.is_completed))

    const btnEdit = document.createElement('button')
    btnEdit.textContent = 'Editar'
    btnEdit.className = 'btn-edit'
    btnEdit.addEventListener('click', () => editarTarea(todo))

    const btnDelete = document.createElement('button')
    btnDelete.textContent = 'Eliminar'
    btnDelete.className = 'btn-delete'
    btnDelete.addEventListener('click', () => eliminarTarea(todo.id))

    actions.append(btnToggle, btnEdit, btnDelete)
    li.append(span, actions)
    listaTareas.appendChild(li)
  }
}

tareaForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const task = tareaInput.value.trim()
  if (!task) return

  const editId = tareaIdInput.value

  if (editId) {
    const { error } = await supabase
      .from('todos')
      .update({ task })
      .eq('id', editId)

    if (error) {
      alert('Error al actualizar tarea: ' + error.message)
    } else {
      tareaIdInput.value = ''
      btnGuardar.textContent = 'Agregar Tarea'
    }
  } else {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('todos')
      .insert([{ task, user_id: user.id }])

    if (error) {
      alert('Error al crear tarea: ' + error.message)
    }
  }

  tareaInput.value = ''
  cargarTareas()
})

async function toggleTarea(id: string, is_completed: boolean) {
  const { error } = await supabase
    .from('todos')
    .update({ is_completed })
    .eq('id', id)

  if (error) {
    alert('Error al actualizar tarea: ' + error.message)
  } else {
    cargarTareas()
  }
}

function editarTarea(todo: any) {
  tareaInput.value = todo.task
  tareaIdInput.value = todo.id
  btnGuardar.textContent = 'Actualizar Tarea'
  tareaInput.focus()
}

async function eliminarTarea(id: string) {
  if (!confirm('¿Eliminar esta tarea?')) return

  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id)

  if (error) {
    alert('Error al eliminar tarea: ' + error.message)
  } else {
    cargarTareas()
  }
}
