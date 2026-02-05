/**
 * Dashboard Page Controller
 * Displays summary statistics, recent tasks, expenses, and weather
 */

const Dashboard = {
  weatherWidget: null,

  /**
   * Initialize dashboard
   */
  init() {
    console.log('Dashboard initialized');
    
    // Load all dashboard components
    this.loadSummaryStats();
    this.loadRecentTasks();
    this.loadRecentExpenses();
    this.initWeatherWidget();
    
    // Set up refresh on storage changes (from other tabs)
    window.addEventListener('storage', () => {
      this.refresh();
    });
  },

  /**
   * Refresh all dashboard data
   */
  refresh() {
    this.loadSummaryStats();
    this.loadRecentTasks();
    this.loadRecentExpenses();
  },

  /**
   * Load and display summary statistics
   */
  loadSummaryStats() {
    const tasks = StorageUtil.getTasks();
    const expenses = StorageUtil.getExpenses();

    // Calculate task statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;

    // Calculate expense statistics
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const todayExpenses = this.getTodayExpenses(expenses);
    const monthExpenses = this.getMonthExpenses(expenses);

    // Update task summary card
    const tasksCard = document.getElementById('tasks-summary');
    if (tasksCard) {
      tasksCard.innerHTML = `
        <div class="summary-card-header">
          <span class="summary-card-title">Tasks</span>
          <span class="summary-card-icon">✓</span>
        </div>
        <div class="summary-card-value">${totalTasks}</div>
        <div class="summary-card-subtitle">
          ${completedTasks} completed, ${pendingTasks} pending
        </div>
      `;
    }

    // Update expense summary card
    const expensesCard = document.getElementById('expenses-summary');
    if (expensesCard) {
      const settings = StorageUtil.getSettings();
      const currency = settings.currency || 'USD';
      
      expensesCard.innerHTML = `
        <div class="summary-card-header">
          <span class="summary-card-title">Expenses</span>
          <span class="summary-card-icon">💰</span>
        </div>
        <div class="summary-card-value">${App.formatCurrency(totalExpenses, currency)}</div>
        <div class="summary-card-subtitle">
          This month: ${App.formatCurrency(monthExpenses, currency)}
        </div>
      `;
    }
  },

  /**
   * Calculate today's expenses
   * @param {Array} expenses - All expenses
   * @returns {number} Total for today
   */
  getTodayExpenses(expenses) {
    const today = new Date().toDateString();
    return expenses
      .filter(e => new Date(e.date).toDateString() === today)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
  },

  /**
   * Calculate this month's expenses
   * @param {Array} expenses - All expenses
   * @returns {number} Total for this month
   */
  getMonthExpenses(expenses) {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    return expenses
      .filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.getMonth() === thisMonth && 
               expenseDate.getFullYear() === thisYear;
      })
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
  },

  /**
   * Load and display recent tasks
   */
  loadRecentTasks() {
    const tasks = StorageUtil.getTasks();
    const container = document.getElementById('recent-tasks-list');
    
    if (!container) return;

    // Get 5 most recent tasks
    const recentTasks = tasks
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    if (recentTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <p class="empty-state-text">No tasks yet</p>
          <a href="tasks.html" class="btn btn-primary btn-small empty-state-action">
            Add Your First Task
          </a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="task-list-preview">
        ${recentTasks.map(task => this.createTaskPreview(task)).join('')}
      </div>
    `;

    // Add event listeners for checkboxes
    recentTasks.forEach(task => {
      const checkbox = container.querySelector(`#preview-task-${task.id}`);
      if (checkbox) {
        checkbox.addEventListener('change', (e) => {
          this.toggleTaskComplete(task.id, e.target.checked);
        });
      }
    });
  },

  /**
   * Create task preview HTML
   * @param {Object} task - Task object
   * @returns {string} HTML string
   */
  createTaskPreview(task) {
    return `
      <div class="task-item-preview">
        <input 
          type="checkbox" 
          class="task-checkbox-preview" 
          id="preview-task-${task.id}"
          ${task.completed ? 'checked' : ''}
        >
        <div class="task-content-preview">
          <div class="task-title-preview ${task.completed ? 'completed' : ''}">
            ${App.truncateText(task.title, 60)}
          </div>
          <div class="task-meta-preview">
            <span class="priority-badge priority-${task.priority}">
              ${task.priority}
            </span>
            <span>${App.formatRelativeTime(task.createdAt)}</span>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Toggle task completion status
   * @param {string} taskId - Task ID
   * @param {boolean} completed - New completion status
   */
  toggleTaskComplete(taskId, completed) {
    const success = StorageUtil.toggleTaskComplete(taskId);
    if (success) {
      this.refresh();
    } else {
      App.showAlert('error', 'Failed to update task');
    }
  },

  /**
   * Load and display recent expenses
   */
  loadRecentExpenses() {
    const expenses = StorageUtil.getExpenses();
    const container = document.getElementById('recent-expenses-list');
    
    if (!container) return;

    // Get 5 most recent expenses
    const recentExpenses = expenses
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    if (recentExpenses.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💸</div>
          <p class="empty-state-text">No expenses yet</p>
          <a href="expenses.html" class="btn btn-secondary btn-small empty-state-action">
            Add Your First Expense
          </a>
        </div>
      `;
      return;
    }

    const settings = StorageUtil.getSettings();
    const currency = settings.currency || 'USD';

    container.innerHTML = `
      <div class="expense-list-preview">
        ${recentExpenses.map(expense => this.createExpensePreview(expense, currency)).join('')}
      </div>
    `;
  },

  /**
   * Create expense preview HTML
   * @param {Object} expense - Expense object
   * @param {string} currency - Currency code
   * @returns {string} HTML string
   */
  createExpensePreview(expense, currency) {
    return `
      <div class="expense-item-preview">
        <div class="expense-details">
          <div class="expense-description">
            ${App.truncateText(expense.description, 40)}
          </div>
          <span class="expense-category">${expense.category}</span>
        </div>
        <div class="expense-amount">
          ${App.formatCurrency(parseFloat(expense.amount), currency)}
        </div>
      </div>
    `;
  },

  /**
   * Initialize weather widget
   */
  initWeatherWidget() {
    this.weatherWidget = new WeatherWidget('weather-widget');
    this.weatherWidget.init();
  }
};

// Initialize dashboard when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Dashboard.init());
} else {
  Dashboard.init();
}
