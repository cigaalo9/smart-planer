# Smart Daily Planner & Expense Tracker

## Project Overview

Smart Daily Planner & Expense Tracker is a **submission-ready, production-quality web application** that combines daily task management and personal expense tracking into a single, efficient platform. The application is built entirely with **vanilla JavaScript, HTML5, and CSS3**, demonstrating strong core web development skills without reliance on external frameworks.

The system is designed to improve personal productivity and financial awareness while maintaining user privacy through full local data storage.

---

## Problem Statement

Many individuals rely on multiple disconnected tools for managing tasks and tracking expenses. This fragmentation leads to inefficiency, increased costs, and reduced data privacy. The goal of this project is to provide a **single, lightweight, offline-capable solution** that addresses both productivity and expense management needs.

---

## Objectives

* Design a unified platform for task planning and expense tracking
* Ensure data persistence without server-side dependencies
* Apply modern JavaScript (ES6+) concepts in a real-world project
* Deliver a responsive, user-friendly interface
* Demonstrate clean code structure and modular architecture

---

## Core Features

### Task Management

* Add, edit, delete, and complete tasks
* Priority levels: low, medium, high
* Automatic timestamps for creation and completion
* Task summary (total, completed, pending)

### Expense Tracking

* Record expenses with amount, category, description, and date
* Category-based organization
* Automatic calculation of total spending
* Persistent storage using LocalStorage

### Dashboard

* Centralized overview of tasks and expenses
* Real-time weather information via OpenWeather API
* Quick navigation between application modules

---

## Technology Stack

* **Frontend:** HTML5, CSS3, JavaScript (ES6+)
* **Storage:** LocalStorage API
* **API Integration:** OpenWeather API (Free Tier)
* **Development Approach:** Framework-free, modular design

---

## System Architecture

```
smart-planner/
├── index.html        # Dashboard
├── tasks.html        # Task management
├── expenses.html     # Expense tracking
├── css/              # Modular stylesheets
├── js/               # Modular JavaScript logic
└── README.md         # Documentation
```

---

## Data Management

### Task Model

* ID (UUID)
* Title and description
* Priority level
* Completion status
* Timestamps

### Expense Model

* ID (UUID)
* Amount
* Category
* Description
* Date

All data is stored locally in the browser using the Web Storage API, ensuring offline functionality and user privacy.

---

## API Usage

The application integrates the OpenWeather API to display real-time weather information on the dashboard. API requests include error handling, caching, and graceful fallback when offline or misconfigured.

---

## Performance & Optimization

* Minimal DOM manipulation
* Event delegation for scalability
* Debounced form submissions
* Cached API responses
* Responsive design for mobile, tablet, and desktop

---

## Security & Privacy

* No backend or cloud storage
* No user data transmission
* All data stored locally on the user’s device
* No analytics or tracking mechanisms

---

## Project Status

**Submission Ready – Production Quality**

The application is complete, tested, and suitable for:

* Academic project submission
* Portfolio demonstration
* Practical personal use

---

## Future Improvements

* Budget limits and alerts
* Recurring tasks
* Data export (CSV / JSON)
* Dark mode support
* Charts and analytics
* Progressive Web App (PWA) support

---

## License

MIT License – Free for educational and commercial use.

---

**Version:** 1.0.0
**Last Updated:** February 2026
