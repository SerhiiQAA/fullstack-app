<h1 align="center">Welcome to User Management System 👋</h1>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
</p>

> A modern Fullstack application for managing users built with React, Express, Prisma, and PostgreSQL. This project implements a full CRUD (Create, Read, Update, Delete) cycle.

---

## 🏗 Project Structure
- **/server**: Node.js API with Express and Prisma ORM.
- **/client**: React application built with Vite and TypeScript.

---

## 🛠 Installation & Setup

### 1. Database Configuration
Create a .env file inside the server directory and add your connection string:
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME?schema=public"

### 2. Backend Setup
cd server
npm install
npx prisma generate
npx prisma migrate dev --name init
npx tsx watch index.ts

### 3. Frontend Setup
cd client
npm install
npm run dev

---

## 📋 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | /api/users | Retrieve all users |
| **POST** | /api/users | Create a new user |
| **PUT** | /api/users/:id | Update user by ID |
| **DELETE** | /api/users/:id | Remove user by ID |

---

## ⚠️ Important Notes
- CORS: Pre-configured to allow requests from the Vite frontend.
- ID Casting: The server automatically converts string IDs to numbers for Prisma compatibility.
- Type Safety: Fully typed with TypeScript on both ends.

---

## Author

👤 **Serhii**

* LinkedIn: [serhiiqaengineer](https://linkedin.com/in/serhiiqaengineer/)

## Show your support

Give a ⭐️ if this project helped you!

***
_This README was enhanced with ❤️ for professional portfolio use._