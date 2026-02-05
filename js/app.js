/**
 * Core Application Module
 * Contains shared utilities and initialization logic
 * Handles navigation, mobile menu, and common UI functions
 */

const App = {
  /**
   * Initialize the application
   */
  init() {
    console.log("Smart Planner App initialized");

    // Check localStorage availability
    if (!StorageUtil.isAvailable()) {
      this.showAlert(
        "error",
        "LocalStorage is not available. Data will not be saved.",
      );
    }

    // Set up navigation
    this.initNavigation();

    // Set up mobile menu
    this.initMobileMenu();

    // Add current year to footer
    this.updateFooter();
  },

  /**
   * Initialize navigation highlighting
   */
  initNavigation() {
    const currentPage =
      window.location.pathname.split("/").pop() || "index.html";
    const navLinks = document.querySelectorAll(".nav-link");

    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (
        href === currentPage ||
        (currentPage === "" && href === "index.html")
      ) {
        link.classList.add("active");
      }
    });
  },

  /**
   * Initialize mobile menu toggle
   */
  initMobileMenu() {
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.querySelector(".nav");

    if (!menuToggle || !navLinks) return;

    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      menuToggle.classList.toggle("active");
      navLinks.classList.toggle("active");
      document.body.classList.toggle("menu-open");
    });

    // Close when clicking a link
    navLinks.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        menuToggle.classList.remove("active");
        navLinks.classList.remove("active");
        document.body.classList.remove("menu-open");
      });
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (
        navLinks.classList.contains("active") &&
        !navLinks.contains(e.target) &&
        !menuToggle.contains(e.target)
      ) {
        menuToggle.classList.remove("active");
        navLinks.classList.remove("active");
        document.body.classList.remove("menu-open");
      }
    });
  },

  /**
   * Update footer with current year
   */
  updateFooter() {
    const footerText = document.querySelector(".footer-text");
    if (footerText) {
      const year = new Date().getFullYear();
      footerText.textContent = `© ${year} Smart Daily Planner. All rights reserved.`;
    }
  },

  /**
   * Show alert message
   * @param {string} type - Alert type (success, error, warning, info)
   * @param {string} message - Alert message
   * @param {number} duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
   */
  showAlert(type, message, duration = 5000) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll(".alert");
    existingAlerts.forEach((alert) => alert.remove());

    // Create new alert
    const alert = document.createElement("div");
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    // Insert at top of main content
    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
      mainContent.insertBefore(alert, mainContent.firstChild);
    }

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        alert.remove();
      }, duration);
    }
  },

  /**
   * Format date to readable string
   * @param {string|Date} date - Date to format
   * @returns {string} Formatted date
   */
  formatDate(date) {
    const d = new Date(date);
    const options = { year: "numeric", month: "short", day: "numeric" };
    return d.toLocaleDateString("en-US", options);
  },

  /**
   * Format date to relative time (e.g., "2 hours ago")
   * @param {string|Date} date - Date to format
   * @returns {string} Relative time string
   */
  formatRelativeTime(date) {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "just now";
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;

    return this.formatDate(date);
  },

  /**
   * Format currency
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code (USD, EUR, GBP)
   * @returns {string} Formatted currency
   */
  formatCurrency(amount, currency = "USD") {
    const symbols = {
      USD: "$",
      EUR: "€",
      GBP: "£",
    };

    const symbol = symbols[currency] || "$";
    return `${symbol}${amount.toFixed(2)}`;
  },

  /**
   * Validate form input
   * @param {HTMLInputElement} input - Input element
   * @param {Object} rules - Validation rules
   * @returns {Object} Validation result {valid: boolean, message: string}
   */
  validateInput(input, rules) {
    const value = input.value.trim();

    // Required check
    if (rules.required && !value) {
      return {
        valid: false,
        message: `${rules.label || "This field"} is required`,
      };
    }

    // Min length check
    if (rules.minLength && value.length < rules.minLength) {
      return {
        valid: false,
        message: `${rules.label || "This field"} must be at least ${rules.minLength} characters`,
      };
    }

    // Max length check
    if (rules.maxLength && value.length > rules.maxLength) {
      return {
        valid: false,
        message: `${rules.label || "This field"} must be no more than ${rules.maxLength} characters`,
      };
    }

    // Number check
    if (rules.type === "number") {
      const num = parseFloat(value);
      if (isNaN(num)) {
        return {
          valid: false,
          message: `${rules.label || "This field"} must be a valid number`,
        };
      }

      if (rules.min !== undefined && num < rules.min) {
        return {
          valid: false,
          message: `${rules.label || "This field"} must be at least ${rules.min}`,
        };
      }

      if (rules.max !== undefined && num > rules.max) {
        return {
          valid: false,
          message: `${rules.label || "This field"} must be no more than ${rules.max}`,
        };
      }
    }

    return { valid: true, message: "" };
  },

  /**
   * Show validation error on form group
   * @param {HTMLElement} formGroup - Form group element
   * @param {string} message - Error message
   */
  showValidationError(formGroup, message) {
    formGroup.classList.add("error");
    const errorElement = formGroup.querySelector(".form-error");
    if (errorElement) {
      errorElement.textContent = message;
    }
  },

  /**
   * Clear validation error from form group
   * @param {HTMLElement} formGroup - Form group element
   */
  clearValidationError(formGroup) {
    formGroup.classList.remove("error");
    const errorElement = formGroup.querySelector(".form-error");
    if (errorElement) {
      errorElement.textContent = "";
    }
  },

  /**
   * Debounce function to limit function calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in ms
   * @returns {Function} Debounced function
   */
  debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Truncate text to specified length
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + "...";
  },

  /**
   * Generate random color for categories
   * @param {string} seed - Seed for consistent colors
   * @returns {string} Hex color code
   */
  generateColor(seed) {
    // Simple hash function for consistent colors
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = hash % 360;
    return `hsl(${hue}, 60%, 50%)`;
  },

  /**
   * Scroll to top of page smoothly
   */
  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  },

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>}
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      return false;
    }
  },

  /**
   * Download data as JSON file
   * @param {string} filename - Filename
   * @param {Object} data - Data to download
   */
  downloadJSON(filename, data) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Confirm action with user
   * @param {string} message - Confirmation message
   * @returns {boolean}
   */
  confirm(message) {
    return window.confirm(message);
  },
};

// Initialize app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => App.init());
} else {
  App.init();
}

// Make App available globally
if (typeof window !== "undefined") {
  window.App = App;
}
