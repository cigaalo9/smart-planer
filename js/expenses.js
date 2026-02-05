/**
 * Expenses Page Controller
 * Handles expense creation, deletion, filtering, and category summaries
 */

const ExpensesPage = {
  currentFilter: 'all',

  /**
   * Initialize expenses page
   */
  init() {
    console.log('Expenses page initialized');
    
    // Load expenses and summaries
    this.loadExpenses();
    this.updateSummary();
    this.updateCategoryBreakdown();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Listen for storage changes
    window.addEventListener('storage', () => {
      this.loadExpenses();
      this.updateSummary();
      this.updateCategoryBreakdown();
    });
  },

  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    // Add expense button
    const addBtn = document.getElementById('add-expense-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openExpenseModal());
    }

    // Category filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.setFilter(e.target.dataset.filter);
      });
    });

    // Expense form submission
    const expenseForm = document.getElementById('expense-form');
    if (expenseForm) {
      expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleExpenseSubmit();
      });
    }

    // Modal close
    const modalClose = document.querySelector('.modal-close');
    const modalOverlay = document.getElementById('expense-modal');
    
    if (modalClose) {
      modalClose.addEventListener('click', () => this.closeExpenseModal());
    }
    
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          this.closeExpenseModal();
        }
      });
    }

    // Cancel button
    const cancelBtn = document.getElementById('cancel-expense-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeExpenseModal());
    }

    // Input validation
    const amountInput = document.getElementById('expense-amount');
    const descInput = document.getElementById('expense-description');
    
    if (amountInput) {
      amountInput.addEventListener('input', () => {
        const formGroup = amountInput.closest('.form-group');
        App.clearValidationError(formGroup);
      });
    }
    
    if (descInput) {
      descInput.addEventListener('input', () => {
        const formGroup = descInput.closest('.form-group');
        App.clearValidationError(formGroup);
      });
    }
  },

  /**
   * Open expense modal
   */
  openExpenseModal() {
    const modal = document.getElementById('expense-modal');
    const form = document.getElementById('expense-form');
    
    if (!modal || !form) return;

    form.reset();
    
    // Set today's date as default
    const dateInput = document.getElementById('expense-date');
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    modal.classList.add('active');
    document.getElementById('expense-amount').focus();
  },

  /**
   * Close expense modal
   */
  closeExpenseModal() {
    const modal = document.getElementById('expense-modal');
    const form = document.getElementById('expense-form');
    
    if (modal) {
      modal.classList.remove('active');
    }
    
    if (form) {
      form.reset();
    }
    
    // Clear validation errors
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach(group => App.clearValidationError(group));
  },

  /**
   * Handle expense form submission
   */
  handleExpenseSubmit() {
    const form = document.getElementById('expense-form');
    if (!form) return;

    // Get form data
    const amount = document.getElementById('expense-amount').value.trim();
    const category = document.getElementById('expense-category').value;
    const description = document.getElementById('expense-description').value.trim();
    const date = document.getElementById('expense-date').value;

    // Validate amount
    const amountGroup = document.getElementById('expense-amount').closest('.form-group');
    const amountValidation = App.validateInput(document.getElementById('expense-amount'), {
      required: true,
      type: 'number',
      min: 0.01,
      label: 'Amount'
    });

    if (!amountValidation.valid) {
      App.showValidationError(amountGroup, amountValidation.message);
      return;
    }

    // Validate description
    const descGroup = document.getElementById('expense-description').closest('.form-group');
    const descValidation = App.validateInput(document.getElementById('expense-description'), {
      required: true,
      minLength: 3,
      maxLength: 200,
      label: 'Description'
    });

    if (!descValidation.valid) {
      App.showValidationError(descGroup, descValidation.message);
      return;
    }

    // Create expense data
    const expenseData = {
      amount: parseFloat(amount),
      category,
      description,
      date: date ? new Date(date).toISOString() : new Date().toISOString()
    };

    // Add expense
    const success = StorageUtil.addExpense(expenseData);
    
    if (success) {
      App.showAlert('success', 'Expense added successfully');
      this.closeExpenseModal();
      this.loadExpenses();
      this.updateSummary();
      this.updateCategoryBreakdown();
    } else {
      App.showAlert('error', 'Failed to add expense. Please try again.');
    }
  },

  /**
   * Set category filter
   * @param {string} filter - Filter category
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

    this.loadExpenses();
  },

  /**
   * Load and display expenses
   */
  loadExpenses() {
    let expenses = StorageUtil.getExpenses();
    const container = document.getElementById('expense-list');
    
    if (!container) return;

    // Apply category filter
    if (this.currentFilter !== 'all') {
      expenses = expenses.filter(e => e.category === this.currentFilter);
    }

    // Sort by date (newest first)
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (expenses.length === 0) {
      container.innerHTML = this.getEmptyState();
      return;
    }

    const settings = StorageUtil.getSettings();
    const currency = settings.currency || 'USD';

    container.innerHTML = expenses.map(expense => 
      this.createExpenseHTML(expense, currency)
    ).join('');

    // Add event listeners
    this.attachExpenseEventListeners();
  },

  /**
   * Create HTML for an expense item
   * @param {Object} expense - Expense object
   * @param {string} currency - Currency code
   * @returns {string} HTML string
   */
  createExpenseHTML(expense, currency) {
    const categoryIcons = {
      food: '🍔',
      transport: '🚗',
      utilities: '💡',
      entertainment: '🎬',
      other: '📦'
    };

    return `
      <div class="expense-item" data-expense-id="${expense.id}">
        <div class="expense-item-content">
          <div class="expense-item-header">
            <span class="expense-title">
              ${categoryIcons[expense.category]} ${expense.description}
            </span>
            <span class="expense-category-badge ${expense.category}">
              ${expense.category}
            </span>
          </div>
          <div class="expense-item-date">
            📅 ${App.formatDate(expense.date)}
          </div>
        </div>
        <div class="expense-item-right">
          <div class="expense-item-amount">
            ${App.formatCurrency(parseFloat(expense.amount), currency)}
          </div>
          <div class="expense-actions">
            <button class="expense-action-btn" data-expense-id="${expense.id}" title="Delete expense">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Get empty state HTML
   * @returns {string} HTML string
   */
  getEmptyState() {
    return `
      <div class="empty-expenses">
        <div class="empty-expenses-icon">💸</div>
        <p class="empty-expenses-text">
          ${this.currentFilter === 'all' ? 'No expenses yet' : `No ${this.currentFilter} expenses`}
        </p>
        <p class="empty-expenses-subtext">
          ${this.currentFilter === 'all' ? 'Start tracking your expenses today!' : 'Try a different category filter.'}
        </p>
        ${this.currentFilter === 'all' ? 
          '<button class="btn btn-secondary" onclick="ExpensesPage.openExpenseModal()">Add Your First Expense</button>' : 
          ''
        }
      </div>
    `;
  },

  /**
   * Attach event listeners to expense items
   */
  attachExpenseEventListeners() {
    const deleteBtns = document.querySelectorAll('.expense-action-btn');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const expenseId = e.target.dataset.expenseId;
        this.deleteExpense(expenseId);
      });
    });
  },

  /**
   * Delete an expense
   * @param {string} expenseId - Expense ID
   */
  deleteExpense(expenseId) {
    if (!App.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    const success = StorageUtil.deleteExpense(expenseId);
    
    if (success) {
      App.showAlert('success', 'Expense deleted successfully');
      this.loadExpenses();
      this.updateSummary();
      this.updateCategoryBreakdown();
    } else {
      App.showAlert('error', 'Failed to delete expense');
    }
  },

  /**
   * Update summary statistics
   */
  updateSummary() {
    const expenses = StorageUtil.getExpenses();
    const settings = StorageUtil.getSettings();
    const currency = settings.currency || 'USD';

    // Calculate totals
    const totalAmount = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const monthlyAmount = this.getMonthExpenses(expenses);
    const dailyAverage = this.getDailyAverage(expenses);

    // Update summary cards
    const totalCard = document.getElementById('total-expenses');
    const monthlyCard = document.getElementById('monthly-expenses');
    const dailyCard = document.getElementById('daily-average');

    if (totalCard) {
      totalCard.textContent = App.formatCurrency(totalAmount, currency);
    }

    if (monthlyCard) {
      monthlyCard.textContent = App.formatCurrency(monthlyAmount, currency);
    }

    if (dailyCard) {
      dailyCard.textContent = App.formatCurrency(dailyAverage, currency);
    }
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
   * Calculate daily average for this month
   * @param {Array} expenses - All expenses
   * @returns {number} Daily average
   */
  getDailyAverage(expenses) {
    const monthlyTotal = this.getMonthExpenses(expenses);
    const today = new Date().getDate();
    return today > 0 ? monthlyTotal / today : 0;
  },

  /**
   * Update category breakdown
   */
  updateCategoryBreakdown() {
    const expenses = StorageUtil.getExpenses();
    const settings = StorageUtil.getSettings();
    const currency = settings.currency || 'USD';
    const container = document.getElementById('category-list');

    if (!container) return;

    // Group expenses by category
    const categories = {
      food: { name: 'Food', icon: '🍔', amount: 0, count: 0 },
      transport: { name: 'Transport', icon: '🚗', amount: 0, count: 0 },
      utilities: { name: 'Utilities', icon: '💡', amount: 0, count: 0 },
      entertainment: { name: 'Entertainment', icon: '🎬', amount: 0, count: 0 },
      other: { name: 'Other', icon: '📦', amount: 0, count: 0 }
    };

    expenses.forEach(expense => {
      const category = expense.category;
      if (categories[category]) {
        categories[category].amount += parseFloat(expense.amount);
        categories[category].count += 1;
      }
    });

    // Sort by amount
    const sortedCategories = Object.entries(categories)
      .sort(([, a], [, b]) => b.amount - a.amount);

    container.innerHTML = sortedCategories.map(([key, cat]) => `
      <div class="category-item ${key}">
        <div class="category-info">
          <div class="category-icon">${cat.icon}</div>
          <div class="category-details">
            <div class="category-name">${cat.name}</div>
            <div class="category-count">${cat.count} transaction${cat.count !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div class="category-amount">
          ${App.formatCurrency(cat.amount, currency)}
        </div>
      </div>
    `).join('');
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ExpensesPage.init());
} else {
  ExpensesPage.init();
}
