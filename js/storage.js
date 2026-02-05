/**
 * Storage Utility Module
 * Handles all localStorage operations with error handling
 * Provides centralized data management for tasks and expenses
 */

const StorageUtil = {
  // Storage keys
  KEYS: {
    TASKS: 'smart_planner_tasks',
    EXPENSES: 'smart_planner_expenses',
    SETTINGS: 'smart_planner_settings',
    WEATHER_CACHE: 'smart_planner_weather_cache'
  },

  /**
   * Check if localStorage is available
   * @returns {boolean}
   */
  isAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.error('localStorage is not available:', e);
      return false;
    }
  },

  /**
   * Get data from localStorage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*}
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return defaultValue;
    }
  },

  /**
   * Set data in localStorage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} Success status
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      // Check if quota exceeded
      if (error.name === 'QuotaExceededError') {
        alert('Storage quota exceeded. Please clear some data.');
      }
      return false;
    }
  },

  /**
   * Remove data from localStorage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
      return false;
    }
  },

  /**
   * Clear all app data from localStorage
   * @returns {boolean} Success status
   */
  clearAll() {
    try {
      Object.values(this.KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  },

  // ===== Task Operations =====

  /**
   * Get all tasks
   * @returns {Array}
   */
  getTasks() {
    return this.get(this.KEYS.TASKS, []);
  },

  /**
   * Save tasks
   * @param {Array} tasks
   * @returns {boolean}
   */
  saveTasks(tasks) {
    return this.set(this.KEYS.TASKS, tasks);
  },

  /**
   * Add a new task
   * @param {Object} task
   * @returns {boolean}
   */
  addTask(task) {
    const tasks = this.getTasks();
    tasks.push({
      ...task,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      completed: false,
      completedAt: null
    });
    return this.saveTasks(tasks);
  },

  /**
   * Update an existing task
   * @param {string} taskId
   * @param {Object} updates
   * @returns {boolean}
   */
  updateTask(taskId, updates) {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    
    if (index === -1) {
      console.error('Task not found:', taskId);
      return false;
    }

    tasks[index] = { ...tasks[index], ...updates };
    return this.saveTasks(tasks);
  },

  /**
   * Delete a task
   * @param {string} taskId
   * @returns {boolean}
   */
  deleteTask(taskId) {
    const tasks = this.getTasks();
    const filtered = tasks.filter(t => t.id !== taskId);
    return this.saveTasks(filtered);
  },

  /**
   * Toggle task completion status
   * @param {string} taskId
   * @returns {boolean}
   */
  toggleTaskComplete(taskId) {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) {
      console.error('Task not found:', taskId);
      return false;
    }

    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;
    
    return this.saveTasks(tasks);
  },

  // ===== Expense Operations =====

  /**
   * Get all expenses
   * @returns {Array}
   */
  getExpenses() {
    return this.get(this.KEYS.EXPENSES, []);
  },

  /**
   * Save expenses
   * @param {Array} expenses
   * @returns {boolean}
   */
  saveExpenses(expenses) {
    return this.set(this.KEYS.EXPENSES, expenses);
  },

  /**
   * Add a new expense
   * @param {Object} expense
   * @returns {boolean}
   */
  addExpense(expense) {
    const expenses = this.getExpenses();
    expenses.push({
      ...expense,
      id: this.generateId(),
      date: expense.date || new Date().toISOString()
    });
    return this.saveExpenses(expenses);
  },

  /**
   * Update an existing expense
   * @param {string} expenseId
   * @param {Object} updates
   * @returns {boolean}
   */
  updateExpense(expenseId, updates) {
    const expenses = this.getExpenses();
    const index = expenses.findIndex(e => e.id === expenseId);
    
    if (index === -1) {
      console.error('Expense not found:', expenseId);
      return false;
    }

    expenses[index] = { ...expenses[index], ...updates };
    return this.saveExpenses(expenses);
  },

  /**
   * Delete an expense
   * @param {string} expenseId
   * @returns {boolean}
   */
  deleteExpense(expenseId) {
    const expenses = this.getExpenses();
    const filtered = expenses.filter(e => e.id !== expenseId);
    return this.saveExpenses(filtered);
  },

  // ===== Settings Operations =====

  /**
   * Get settings
   * @returns {Object}
   */
  getSettings() {
    return this.get(this.KEYS.SETTINGS, {
      city: 'London',
      currency: 'USD',
      theme: 'light'
    });
  },

  /**
   * Save settings
   * @param {Object} settings
   * @returns {boolean}
   */
  saveSettings(settings) {
    return this.set(this.KEYS.SETTINGS, settings);
  },

  /**
   * Update a specific setting
   * @param {string} key
   * @param {*} value
   * @returns {boolean}
   */
  updateSetting(key, value) {
    const settings = this.getSettings();
    settings[key] = value;
    return this.saveSettings(settings);
  },

  // ===== Weather Cache Operations =====

  /**
   * Get cached weather data
   * @returns {Object|null}
   */
  getWeatherCache() {
    const cache = this.get(this.KEYS.WEATHER_CACHE);
    
    if (!cache) return null;
    
    // Check if cache is still valid (30 minutes)
    const cacheAge = Date.now() - cache.timestamp;
    const thirtyMinutes = 30 * 60 * 1000;
    
    if (cacheAge > thirtyMinutes) {
      this.remove(this.KEYS.WEATHER_CACHE);
      return null;
    }
    
    return cache.data;
  },

  /**
   * Save weather data to cache
   * @param {Object} weatherData
   * @returns {boolean}
   */
  saveWeatherCache(weatherData) {
    return this.set(this.KEYS.WEATHER_CACHE, {
      data: weatherData,
      timestamp: Date.now()
    });
  },

  // ===== Utility Functions =====

  /**
   * Generate a unique ID
   * @returns {string}
   */
  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Get storage usage information
   * @returns {Object}
   */
  getStorageInfo() {
    if (!this.isAvailable()) {
      return { used: 0, available: 0, percentage: 0 };
    }

    try {
      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }

      const usedKB = (total / 1024).toFixed(2);
      const maxKB = 5120; // 5MB typical limit
      const percentage = ((total / (maxKB * 1024)) * 100).toFixed(2);

      return {
        used: usedKB,
        available: (maxKB - usedKB).toFixed(2),
        percentage: percentage
      };
    } catch (error) {
      console.error('Error calculating storage info:', error);
      return { used: 0, available: 0, percentage: 0 };
    }
  },

  /**
   * Export all data as JSON
   * @returns {string}
   */
  exportData() {
    return JSON.stringify({
      tasks: this.getTasks(),
      expenses: this.getExpenses(),
      settings: this.getSettings(),
      exportDate: new Date().toISOString()
    }, null, 2);
  },

  /**
   * Import data from JSON
   * @param {string} jsonData
   * @returns {boolean}
   */
  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.tasks) this.saveTasks(data.tasks);
      if (data.expenses) this.saveExpenses(data.expenses);
      if (data.settings) this.saveSettings(data.settings);
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
};

// Make StorageUtil available globally
if (typeof window !== 'undefined') {
  window.StorageUtil = StorageUtil;
}
