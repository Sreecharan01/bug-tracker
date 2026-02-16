# 🐛 Bug Tracker — Production-Ready MERN Stack

A full-featured, production-ready Bug Tracking System built with MongoDB, Express.js, React, and Node.js. Features JWT authentication, role-based access control, full CRUD operations, reporting, and a professional dark-themed UI.

---

## 🚀 Tech Stack

| Layer     | Technology          |
|-----------|---------------------|
| Frontend  | React 18, React Router v6, Recharts |
| Backend   | Node.js 20, Express 4 |
| Database  | MongoDB 7, Mongoose 8 |
| Auth      | JWT (Access + Refresh tokens) |
| Security  | Helmet, CORS, Rate Limiting, bcryptjs |
| DevOps    | Docker, Docker Compose, Nginx |

---

## 📁 Project Structure

```
bug-tracker/
├── backend/
│   ├── src/
│   │   ├── config/         # DB connection
│   │   ├── controllers/    # authController, bugController, userController, reportController, settingsController
│   │   ├── middleware/      # auth.js (protect, authorize), errorHandler, validate
│   │   ├── models/          # User, Bug, Report, Settings
│   │   ├── routes/          # authRoutes, bugRoutes, userRouter, reportRouter, settingsRouter
│   │   ├── utils/           # jwt.js, response.js
│   │   ├── validators/      # authValidators, bugValidators
│   │   ├── seed.js          # DB seeder
│   │   └── server.js        # Entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/      # ProtectedRoute, AdminRoute, GuestRoute
│   │   │   └── layout/      # Layout with sidebar
│   │   ├── context/         # AuthContext (global auth state)
│   │   ├── pages/           # Dashboard, Bugs, BugDetail, CreateBug, Users, Reports, Settings, Profile
│   │   ├── services/        # api.js (axios + interceptors)
│   │   └── App.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## ⚡ Quick Start

### Option 1: Docker (Recommended)

```bash
git clone https://github.com/Sreecharan01/bug-tracker bug-tracker
cd bug-tracker

# Copy env and configure
cp backend/.env.example backend/.env

# Start everything
docker-compose up -d

# Seed the database
docker exec bugtracker_api node src/seed.js

# Open http://localhost:3000
```

### Option 2: Manual Setup

**Prerequisites:** Node.js 18+, MongoDB 6+

```bash
# 1. Clone & install
git clone https://github.com/Sreecharan01/bug-tracker bug-tracker && cd bug-tracker
npm run install:all

# 2. Configure backend
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI and secrets

# 3. Seed database
npm run seed

# 4. Run dev servers (starts both backend:5000 and frontend:3000)
npm run dev
```

---

## 🔐 JWT Authentication Flow

```
User registers → password hashed (bcrypt) → saved to MongoDB
User logs in   → credentials verified → JWT Access Token + Refresh Token issued
               → Tokens stored in localStorage + httpOnly cookies
Every API call → Authorization: Bearer <token> header sent
               → Backend middleware verifies token & role
               → Valid: ✅ proceed | Invalid: ❌ 401 Unauthorized
Token expires  → Refresh token used to get new access token
               → If refresh invalid: redirect to login
```

---

## 🔑 Demo Credentials

| Role       | Email                     | Password      |
|------------|---------------------------|---------------|
| 👑 Admin   | admin@bugtracker.com      | Admin@1234    |
| 💻 Dev     | dev@bugtracker.com        | Dev@12345     |
| 🧪 Tester  | tester@bugtracker.com     | Test@1234     |

---

## 📋 REST API Reference

### Authentication
| Method | Endpoint                    | Access | Description        |
|--------|-----------------------------|--------|--------------------|
| POST   | /api/auth/register          | Public | Register user      |
| POST   | /api/auth/login             | Public | Login + get tokens |
| POST   | /api/auth/logout            | Auth   | Logout             |
| POST   | /api/auth/refresh           | Public | Refresh token      |
| GET    | /api/auth/me                | Auth   | Get profile        |
| PUT    | /api/auth/me                | Auth   | Update profile     |
| PUT    | /api/auth/change-password   | Auth   | Change password    |

### Bugs (Full CRUD)
| Method | Endpoint                    | Access | Description          |
|--------|-----------------------------|--------|----------------------|
| POST   | /api/bugs                   | Auth   | Create bug           |
| GET    | /api/bugs                   | Auth   | List bugs (filtered) |
| GET    | /api/bugs/stats             | Auth   | Bug statistics       |
| GET    | /api/bugs/:id               | Auth   | Get bug detail       |
| PUT    | /api/bugs/:id               | Auth   | Update bug           |
| DELETE | /api/bugs/:id               | Auth   | Delete bug           |
| POST   | /api/bugs/:id/comments      | Auth   | Add comment          |
| DELETE | /api/bugs/:id/comments/:cid | Auth   | Delete comment       |
| POST   | /api/bugs/:id/watch         | Auth   | Toggle watch         |

### Users (Admin Only)
| Method | Endpoint                       | Access | Description         |
|--------|--------------------------------|--------|---------------------|
| GET    | /api/users                     | Admin  | List all users      |
| POST   | /api/users                     | Admin  | Create user         |
| GET    | /api/users/:id                 | Admin  | Get user            |
| PUT    | /api/users/:id                 | Admin  | Update user         |
| DELETE | /api/users/:id                 | Admin  | Deactivate user     |
| PATCH  | /api/users/:id/toggle-status   | Admin  | Toggle active       |

### Reports
| Method | Endpoint          | Access | Description       |
|--------|-------------------|--------|-------------------|
| POST   | /api/reports      | Auth   | Generate report   |
| GET    | /api/reports      | Auth   | List reports      |
| GET    | /api/reports/:id  | Auth   | Get report        |
| DELETE | /api/reports/:id  | Auth   | Delete report     |

### Settings (Admin Only)
| Method | Endpoint              | Access | Description       |
|--------|-----------------------|--------|-------------------|
| GET    | /api/settings         | Auth   | Get all settings  |
| POST   | /api/settings         | Admin  | Create setting    |
| PUT    | /api/settings         | Admin  | Bulk update       |
| GET    | /api/settings/:key    | Auth   | Get by key        |
| PUT    | /api/settings/:key    | Admin  | Update setting    |
| DELETE | /api/settings/:key    | Admin  | Delete setting    |

---

## 👥 Roles & Permissions

| Feature                | Admin | Developer | Tester | User |
|------------------------|:-----:|:---------:|:------:|:----:|
| View bugs              | ✅    | ✅        | ✅     | ✅   |
| Create bugs            | ✅    | ✅        | ✅     | ✅   |
| Update bug status      | ✅    | ✅        | ✅     | ✅   |
| Assign bugs            | ✅    | ❌        | ❌     | ❌   |
| Delete any bug         | ✅    | ❌        | ❌     | ❌   |
| Delete own bug         | ✅    | ✅        | ✅     | ✅   |
| Manage users           | ✅    | ❌        | ❌     | ❌   |
| View all reports       | ✅    | ❌        | ❌     | ❌   |
| Generate reports       | ✅    | ✅        | ✅     | ✅   |
| Manage settings        | ✅    | ❌        | ❌     | ❌   |

---

## 🛡️ Production Security Features

- **Helmet.js** — HTTP security headers
- **Rate Limiting** — 100 req/15min global, 10 req/15min for auth
- **bcrypt** — Password hashing (12 rounds)
- **Account Lockout** — After 5 failed login attempts (2hr lock)
- **JWT Rotation** — Refresh tokens rotated on each use
- **Soft Delete** — Data never permanently deleted
- **Input Validation** — express-validator on all endpoints
- **CORS** — Configurable allowed origins
- **Compression** — Gzip response compression

---

## 🌐 Environment Variables

```env
# backend/.env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/bug_tracker
JWT_SECRET=min_32_char_secret
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=another_secret
JWT_REFRESH_EXPIRE=30d
CLIENT_URL=http://localhost:3000
BCRYPT_ROUNDS=12
```
#   b u g - t r a c k e r 
 
 