document.addEventListener('DOMContentLoaded', () => {
  const taskInput = document.getElementById('task-input');
  const addBtn = document.getElementById('add-btn');
  const taskList = document.getElementById('task-list');
  const themeToggle = document.getElementById('theme-toggle');
  const categoryInput = document.getElementById('category-input');
  const priorityInput = document.getElementById('priority-input');
  const dueDateInput = document.getElementById('due-date-input');
  const searchInput = document.getElementById('search-input');
  const filterCategory = document.getElementById('filter-category');
  const filterPriority = document.getElementById('filter-priority');
  const totalTasks = document.getElementById('total-tasks');
  const completedTasks = document.getElementById('completed-tasks');
  const streakElem = document.getElementById('streak');

  let tasks = [];
  let streak = 0;

  // Load tasks & theme
  loadTasks();
  loadTheme();
  updateStats();

  // Add task
  addBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
  });

  // Search & filter
  searchInput.addEventListener('input', renderTasks);
  filterCategory.addEventListener('change', renderTasks);
  filterPriority.addEventListener('change', renderTasks);

  // Theme toggle
  themeToggle.addEventListener('click', toggleTheme);

  function addTask() {
    const taskText = taskInput.value.trim();
    const category = categoryInput.value;
    const priority = priorityInput.value;
    const dueDate = dueDateInput.value;
    if (!taskText) return;

    const task = {
      id: Date.now(),
      text: taskText,
      category,
      priority,
      dueDate,
      completed: false,
      subtasks: [],
      created: new Date().toISOString()
    };

    tasks.unshift(task);
    saveTasks();
    renderTasks();
    updateStats();
    taskInput.value = '';
    categoryInput.value = '';
    priorityInput.value = '';
    dueDateInput.value = '';
  }

  function renderTasks() {
    taskList.innerHTML = '';
    let filtered = tasks.filter(task => {
      const search = searchInput.value.toLowerCase();
      const cat = filterCategory.value;
      const pri = filterPriority.value;
      return (
        (!search || task.text.toLowerCase().includes(search)) &&
        (!cat || task.category === cat) &&
        (!pri || task.priority === pri)
      );
    });
    filtered.forEach(renderTask);
  }

  function renderTask(task) {
    const li = document.createElement('li');
    li.className = 'task';
    li.dataset.id = task.id;
    if (task.completed) li.classList.add('completed');

    li.innerHTML = `
      <div class="task-main">
        <span>${task.text}</span>
        <span class="tag category">${task.category || ''}</span>
        <span class="tag priority ${task.priority?.toLowerCase()}">${task.priority || ''}</span>
        <span class="due-date">${task.dueDate ? 'Due: ' + task.dueDate : ''}</span>
      </div>
      <div class="subtasks">
        ${task.subtasks.map((sub, i) => `<div class="subtask">- ${sub} <button class="delete-sub" data-index="${i}">&times;</button></div>`).join('')}
        <input type="text" class="subtask-input" placeholder="Add subtask...">
        <button class="add-subtask">+</button>
      </div>
      <div class="task-actions">
        <button class="complete-btn"><i class="fas fa-check"></i></button>
        <button class="edit-btn"><i class="fas fa-edit"></i></button>
        <button class="delete-btn"><i class="fas fa-trash"></i></button>
      </div>
    `;

    li.querySelector('.complete-btn').addEventListener('click', () => toggleComplete(li));
    li.querySelector('.delete-btn').addEventListener('click', () => deleteTask(li));
    li.querySelector('.edit-btn').addEventListener('click', () => editTask(li, task));
    li.querySelector('.add-subtask').addEventListener('click', () => addSubtask(li, task));
    li.querySelectorAll('.delete-sub').forEach(btn => btn.addEventListener('click', (e) => deleteSubtask(li, task, e)));

    taskList.appendChild(li);
  }

  function addSubtask(li, task) {
    const input = li.querySelector('.subtask-input');
    const val = input.value.trim();
    if (val) {
      task.subtasks.push(val);
      saveTasks();
      renderTasks();
    }
  }

  function deleteSubtask(li, task, e) {
    const idx = e.target.dataset.index;
    task.subtasks.splice(idx, 1);
    saveTasks();
    renderTasks();
  }

  function editTask(li, task) {
    const span = li.querySelector('.task-main span');
    const input = document.createElement('input');
    input.type = 'text';
    input.value = task.text;
    span.replaceWith(input);
    input.focus();
    input.addEventListener('blur', () => {
      task.text = input.value;
      saveTasks();
      renderTasks();
    });
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        input.blur();
      }
    });
  }

  function toggleComplete(li) {
    li.classList.toggle('completed');
    const id = li.dataset.id;
    const task = tasks.find(t => t.id == id);
    task.completed = li.classList.contains('completed');
    if (task.completed) {
      streak++;
      li.classList.add('fade-out');
      setTimeout(() => {
        li.classList.remove('fade-out');
        saveTasks();
        renderTasks();
        updateStats();
      }, 300);
    } else {
      streak = 0;
      saveTasks();
      renderTasks();
      updateStats();
    }
  }

  function deleteTask(li) {
    li.classList.add('fade-out');
    setTimeout(() => {
      tasks = tasks.filter(t => t.id != li.dataset.id);
      saveTasks();
      renderTasks();
      updateStats();
    }, 300);
  }

  function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('streak', streak);
  }

  function loadTasks() {
    tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    streak = parseInt(localStorage.getItem('streak') || '0');
    renderTasks();
    updateStats();
  }

  function updateStats() {
    totalTasks.textContent = 'Total: ' + tasks.length;
    completedTasks.textContent = 'Completed: ' + tasks.filter(t => t.completed).length;
    streakElem.textContent = 'Streak: ' + streak;
  }

  function loadTheme() {
    if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark-mode');
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      document.body.classList.remove('dark-mode');
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
  }

  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
      localStorage.setItem('theme', 'dark');
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      localStorage.setItem('theme', 'light');
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
  }
});