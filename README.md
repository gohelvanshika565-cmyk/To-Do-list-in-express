# 🌸 Aesthetic Notes & Todo Application (Full-Stack Express)

A clean, responsive, and aesthetic Notes & Todo web application built using **Node.js**, **Express.js**, **Vanilla JavaScript**, and **RESTful API** architecture with dual database support (**MongoDB** & local **JSON storage**).

---

## ✨ Features

- **Full CRUD Operations**:
  - **Create**: Add new notes with custom category icons (Notes 📝, Ideas 💡, Journal 💜, Goals ⭐, Study 📚, Tech 💻).
  - **Read**: Real-time display of all notes with search filtering and category tabs.
  - **Update**: Edit note title, content, category, and timestamps with a compact modal dialog.
  - **Delete**: Remove notes with a clean confirmation dialog.
- **Interactive UI & Search**:
  - **Category Filters**: Filter notes instantly by category (Notes, Ideas, Journal, Goals, Study, Tech).
  - **Live Search**: Instant client-side search filtering by title and content.
  - **Responsive Design**: Mobile, tablet, and desktop friendly with CSS Grid and Flexbox.
- **Dual Database Architecture (Zero Setup Friction)**:
  - Automatically connects to **MongoDB** (via Mongoose) if MongoDB is installed and running.
  - Gracefully falls back to persistent local JSON storage (`data/notes.json`) if MongoDB is not active, ensuring the application runs out-of-the-box on any machine without crashes.

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose) + Local JSON Fallback (`data/notes.json`)
- **Frontend**: HTML5, Vanilla CSS3 (Custom Design System), JavaScript (ES6)
- **API Architecture**: RESTful API (`GET`, `POST`, `PUT`, `DELETE /api/notes`)

---

## 🚀 How to Run Locally

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your computer.

### 2. Installation
Open your terminal inside this project directory and install dependencies:
```bash
npm install
```

### 3. Start the Server
Run the application using:
```bash
npm start
```
*(Or for auto-reload during development: `npm run dev`)*

You should see:
```text
🌸 Server running at http://localhost:3000
```

### 4. Open in Browser
Open your web browser and go to:
👉 **http://localhost:3000**

---

## 📁 Project Structure

```text
├── data/
│   └── notes.json         # Local persistent JSON storage fallback
├── public/
│   ├── index.html         # Clean, semantic HTML structure
│   ├── style.css          # Aesthetic pastel design & responsive media queries
│   └── app.js             # Client logic & REST API fetch calls
├── .gitignore             # Git ignore configuration (excludes node_modules)
├── index.js               # Express server with RESTful API endpoints
├── package.json           # Project metadata, scripts, and dependencies
└── README.md              # Project documentation
```

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/notes` | Fetch all notes |
| `POST` | `/api/notes` | Create a new note |
| `PUT` | `/api/notes/:id` | Update an existing note |
| `DELETE` | `/api/notes/:id` | Delete a note by ID |

---

## 📄 License
This project is open-source and free to use for educational and personal projects.
