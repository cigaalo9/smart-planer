/**
 * Tasks Page Controller
 * Handles task creation, editing, deletion, and filtering
 */

const TasksPage = {
  currentFilter: 'all',
  editingTaskId: null,

  /**
   * Initialize tasks page
   */
  init() {
    console.log('Tasks page initialized');
    
    // Load tasks
    this.loadTasks();
    this.updateStats();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Listen for storage changes
    window.addEventListener('storage', () => {
      this.loadTasks();
      this.updateStats();
    });
  },

  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    // Add task button
    const addBtn = document.getElementById('add-task-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openTaskModal());
    }

    // Filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.setFilter(e.target.dataset.filter);
      });
    });

    // Task form submission
    const taskForm = document.getElementById('task-form');
    if (taskForm) {
      taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleTaskSubmit();
      });
    }

    // Modal close
    const modalClose = document.querySelector('.modal-close');
    const modalOverlay = document.getElementById('task-modal');
    
    if (modalClose) {
      modalClose.addEventListener('click', () => this.closeTaskModal());
    }
    
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          this.closeTaskModal();
        }
      });
    }

    // Cancel button
    const cancelBtn = document.getElementById('cancel-task-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeTaskModal());
    }

    // Input validation
    const titleInput = document.getElementById('task-title');
    if (titleInput) {
      titleInput.addEventListener('input', () => {
        const formGroup = titleInput.closest('.form-group');
        App.clearValidationError(formGroup);
      });
    }
  },

  /**
   * Open task modal for adding or editing
   * @param {string|null} taskId - Task ID for editing, null for new task
   */
  openTaskModal(taskId = null) {
    const modal = document.getElementById('task-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('task-form');
    
    if (!modal || !form) return;

    this.editingTaskId = taskId;

    if (taskId) {
      // Editing existing task
      modalTitle.textContent = 'Edit Task';
      const task = StorageUtil.getTasks().find(t => t.id === taskId);
      
      if (task) {
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-description').value = task.description || '';
        document.getElementById('task-priority').value = task.priority;
      }
    } else {
      // Adding new task
      modalTitle.textContent = 'Add New Task';
      form.reset();
    }

    modal.classList.add('active');
    document.getElementById('task-title').focus();
  },

  /**
   * Close task modal
   */
  closeTaskModal() {
    const modal = document.getElementById('task-modal');
    const form = document.getElementById('task-form');
    
    if (modal) {
      modal.classList.remove('active');
    }
    
    if (form) {
      form.reset();
    }
    
    this.editingTaskId = null;
    
    // Clear validation errors
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach(group => App.clearValidationError(group));
  },

  /**
   * Handle task form submission
   */
  handleTaskSubmit() {
    const form = document.getElementById('task-form');
    if (!form) return;

    // Get form data
    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-description').value.trim();
    const priority = document.getElementById('task-priority').value;

    // Validate
    const titleGroup = document.getElementById('task-title').closest('.form-group');
    const titleValidation = App.validateInput(document.getElementById('task-title'), {
      required: true,
      minLength: 3,
      maxLength: 100,
      label: 'Task title'
    });

    if (!titleValidation.valid) {
      App.showValidationError(titleGroup, titleValidation.message);
      return;
    }

    // Create or update task
    const taskData = { title, description, priority };

    let success;
    if (this.editingTaskId) {
      // Update existing task
      success = StorageUtil.updateTask(this.editingTaskId, taskData);
      if (success) {
        App.showAlert('success', 'Task updated successfully');
      }
    } else {
      // Add new task
      success = StorageUtil.addTask(taskData);
      if (success) {
        App.showAlert('success', 'Task added successfully');
      }
    }

    if (success) {
      this.closeTaskModal();
      this.loadTasks();
      this.updateStats();
    } else {
      App.showAlert('error', 'Failed to save task. Please try again.');
    }
  },

  /**
   * Set filter and reload tasks
   * @param {string} filter - Filter type (all, active, completed)
   */
  setFilter(filter) {
    this.currentFilter = filter;
    
    // Update filter button states
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      if (btn.dataset.filter === filter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.loadTasks();
  },

  /**
   * Load and display tasks based on current filter
   */
  loadTasks() {
    let tasks = StorageUtil.getTasks();
    const container = document.getElementById('task-list');
    
    if (!container) return;

    // Apply filter
    if (this.currentFilter === 'active') {
      tasks = tasks.filter(t => !t.completed);
    } else if (this.currentFilter === 'completed') {
      tasks = tasks.filter(t => t.completed);
    }

    // Sort by creation date (newest first)
    tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (tasks.length === 0) {
      container.innerHTML = this.getEmptyState();
      return;
    }

    container.innerHTML = tasks.map(task => this.createTaskHTML(task)).join('');

    // Add event listeners
    this.attachTaskEventListeners();
  },

  /**
   * Create HTML for a task item
   * @param {Object} task - Task object
   * @returns {string} HTML string
   */
  createTaskHTML(task) {
    return `
      <div class="task-item ${task.completed ? 'completed' : ''}" data-priority="${task.priority}" data-task-id="${task.id}">
        <input 
          type="checkbox" 
          class="task-checkbox" 
          id="task-${task.id}"
          ${task.completed ? 'checked' : ''}
        >
        <div class="task-content">
          <div class="task-title">${task.title}</div>
          ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
          <div class="task-meta">
            <span class="priority-badge priority-${task.priority}">
              ${task.priority} priority
            </span>
            <span class="task-date">
              📅 ${App.formatRelativeTime(task.createdAt)}
            </span>
          </div>
        </div>
        <div class="task-actions">
          <button class="task-action-btn edit" data-task-id="${task.id}" title="Edit task">
            ✏️ Edit
          </button>
          <button class="task-action-btn delete" data-task-id="${task.id}" title="Delete task">
            🗑️ Delete
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Get empty state HTML based on current filter
   * @returns {string} HTML string
   */
  getEmptyState() {
    const messages = {
      all: {
        icon: '📝',
        text: 'No tasks yet',
        subtext: 'Create your first task to get started!'
      },
      active: {
        icon: '✓',
        text: 'No active tasks',
        subtext: 'All tasks are completed!'
      },
      completed: {
        icon: '🎉',
        text: 'No completed tasks',
        subtext: 'Complete some tasks to see them here.'
      }
    };

    const message = messages[this.currentFilter] || messages.all;

    return `
      <div class="empty-tasks">
        <div class="empty-tasks-icon">${message.icon}</div>
        <p class="empty-tasks-text">${message.text}</p>
        <p class="empty-tasks-subtext">${message.subtext}</p>
        ${this.currentFilter === 'all' ? 
          '<button class="btn btn-primary" onclick="TasksPage.openTaskModal()">Add Your First Task</button>' : 
          ''
        }
      </div>
    `;
  },

  /**
   * Attach event listeners to task items
   */
  attachTaskEventListeners() {
    // Checkbox toggles
    const checkboxes = document.querySelectorAll('.task-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const taskId = e.target.id.replace('task-', '');
        this.toggleTaskComplete(taskId);
      });
    });

    // Edit buttons
    const editBtns = document.querySelectorAll('.task-action-btn.edit');
    editBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const taskId = e.target.dataset.taskId;
        this.openTaskModal(taskId);
      });
    });

    // Delete buttons
    const deleteBtns = document.querySelectorAll('.task-action-btn.delete');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const taskId = e.target.dataset.taskId;
        this.deleteTask(taskId);
      });
    });
  },

  /**
   * Toggle task completion status
   * @param {string} taskId - Task ID
   */
  toggleTaskComplete(taskId) {
    const success = StorageUtil.toggleTaskComplete(taskId);
    
    if (success) {
      this.loadTasks();
      this.updateStats();
    } else {
      App.showAlert('error', 'Failed to update task');
    }
  },

  /**
   * Delete a task
   * @param {string} taskId - Task ID
   */
  deleteTask(taskId) {
    if (!App.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    const success = StorageUtil.deleteTask(taskId);
    
    if (success) {
      App.showAlert('success', 'Task deleted successfully');
      this.loadTasks();
      this.updateStats();
    } else {
      App.showAlert('error', 'Failed to delete task');
    }
  },

  /**
   * Update statistics display
   */
  updateStats() {
    const tasks = StorageUtil.getTasks();
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;

    // Update stat cards
    document.getElementById('total-tasks').textContent = total;
    document.getElementById('active-tasks').textContent = active;
    document.getElementById('completed-tasks').textContent = completed;
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => TasksPage.init());
} else {
  TasksPage.init();
}
