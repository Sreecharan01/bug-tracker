# Bug Tracker API Documentation

## Overview

The Bug Tracker API is a comprehensive REST API for managing bugs, users, reports, and system settings. It features JWT-based authentication, role-based access control, and full CRUD operations.

**API Base URL**: `http://localhost:5000/api`  
**API Version**: 1.0.0

---

## Table of Contents

1. [Authentication](#authentication)
2. [Authorization & Roles](#authorization--roles)
3. [API Endpoints](#api-endpoints)
   - [Auth Endpoints](#auth-endpoints)
   - [Bug Endpoints](#bug-endpoints)
   - [User Endpoints](#user-endpoints)
   - [Report Endpoints](#report-endpoints)
   - [Settings Endpoints](#settings-endpoints)
4. [Request/Response Format](#requestresponse-format)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Examples](#examples)

---

## Authentication

### JWT Authentication Flow

1. **Register** → Email and password are validated and hashed
2. **Login** → Server generates JWT token (valid for configured duration)
3. **Token Usage** → Include token in `Authorization: Bearer <token>` header
4. **Refresh** → Use refresh endpoint to get new token before expiration
5. **Logout** → Invalidate session on backend (optional)

### Token Storage

- **Frontend**: localStorage or secure cookies
- **Backend**: Verified on every protected route request
- Send token in the `Authorization` header for authenticated requests

---

## Authorization & Roles

### User Roles

| Role | Permissions |
|------|-------------|
| **admin** | Full access: manage users, reports, settings, and bugs |
| **user** | Standard user: view/create/edit own bugs, view reports |
| **developer** | Create and update bugs, add comments, track issues |
| **tester** | Create bugs, add comments, generate reports |

### Protected Routes

Most endpoints require authentication. Routes are protected using:
- `protect` middleware: Verifies JWT token
- `authorize` middleware: Checks user role

---

## API Endpoints

---

## Auth Endpoints

### 1. Register
Create a new user account.

```
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure_password_123",
  "role": "developer"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "_id": "60d5ec49c1234567890abcd1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "developer",
    "isActive": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Validation Rules:**
- `name`: Min 2 characters
- `email`: Valid email format
- `password`: Min 8 characters
- `role`: One of `['admin', 'user', 'developer', 'tester']` (optional, defaults to 'user')

---

### 2. Login
Authenticate and receive JWT token.

```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "secure_password_123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "_id": "60d5ec49c1234567890abcd1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "developer"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 3. Refresh Token
Get a new token before expiration.

```
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 4. Get Current User
Retrieve authenticated user profile. **(Protected)**

```
GET /api/auth/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "60d5ec49c1234567890abcd1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "developer",
    "isActive": true,
    "createdAt": "2024-02-17T10:00:00.000Z"
  }
}
```

---

### 5. Update Profile
Update user profile information. **(Protected)**

```
PUT /api/auth/me
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john.smith@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "_id": "60d5ec49c1234567890abcd1",
    "name": "John Smith",
    "email": "john.smith@example.com"
  }
}
```

---

### 6. Change Password
Update user password. **(Protected)**

```
PUT /api/auth/change-password
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "old_password_123",
  "newPassword": "new_secure_password_456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### 7. Logout
Invalidate user session. **(Protected)**

```
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## Bug Endpoints

### 1. Create Bug
Create a new bug report. **(Protected)**

```
POST /api/bugs
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Login button not working",
  "description": "The login button doesn't respond to clicks",
  "priority": "high",
  "severity": "critical",
  "status": "open",
  "assignedTo": "60d5ec49c1234567890abcd2",
  "project": "Web App",
  "environment": "production",
  "steps": "1. Navigate to login page\n2. Click login button",
  "expectedBehavior": "User should be logged in",
  "actualBehavior": "Nothing happens"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Bug created successfully",
  "bug": {
    "_id": "60d5ec49c1234567890abcd3",
    "title": "Login button not working",
    "description": "The login button doesn't respond to clicks",
    "priority": "high",
    "severity": "critical",
    "status": "open",
    "createdBy": "60d5ec49c1234567890abcd1",
    "assignedTo": "60d5ec49c1234567890abcd2",
    "createdAt": "2024-02-17T10:00:00.000Z",
    "updatedAt": "2024-02-17T10:00:00.000Z"
  }
}
```

**Status Options**: `open`, `in_progress`, `closed`, `reopened`, `on_hold`, `duplicate`

**Priority Options**: `low`, `medium`, `high`, `critical`

**Severity Options**: `minor`, `major`, `critical`

---

### 2. Get All Bugs
Retrieve list of bugs with filtering and pagination. **(Protected)**

```
GET /api/bugs?page=1&limit=10&status=open&priority=high&search=login
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status (optional)
- `priority`: Filter by priority (optional)
- `severity`: Filter by severity (optional)
- `search`: Search in title/description (optional)
- `assignedTo`: Filter by assigned user ID (optional)
- `createdBy`: Filter by creator ID (optional)
- `sortBy`: Sort field (default: createdAt)
- `sortOrder`: `asc` or `desc` (default: desc)

**Response (200):**
```json
{
  "success": true,
  "bugs": [
    {
      "_id": "60d5ec49c1234567890abcd3",
      "title": "Login button not working",
      "priority": "high",
      "status": "open",
      "createdBy": { "_id": "...", "name": "John Doe" },
      "assignedTo": { "_id": "...", "name": "Jane Smith" },
      "comments": 3,
      "watchers": 5,
      "createdAt": "2024-02-17T10:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 47,
    "itemsPerPage": 10
  }
}
```

---

### 3. Get Bug by ID
Retrieve a specific bug with full details. **(Protected)**

```
GET /api/bugs/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "bug": {
    "_id": "60d5ec49c1234567890abcd3",
    "title": "Login button not working",
    "description": "The login button doesn't respond to clicks",
    "priority": "high",
    "severity": "critical",
    "status": "open",
    "project": "Web App",
    "environment": "production",
    "steps": "1. Navigate to login page\n2. Click login button",
    "expectedBehavior": "User should be logged in",
    "actualBehavior": "Nothing happens",
    "createdBy": { "_id": "...", "name": "John Doe", "email": "john@example.com" },
    "assignedTo": { "_id": "...", "name": "Jane Smith" },
    "comments": [
      {
        "_id": "...",
        "author": { "name": "Developer Name" },
        "text": "Investigating the issue",
        "createdAt": "2024-02-17T10:30:00.000Z"
      }
    ],
    "watchers": ["user_id_1", "user_id_2"],
    "attachments": ["file_url_1", "file_url_2"],
    "createdAt": "2024-02-17T10:00:00.000Z",
    "updatedAt": "2024-02-17T10:30:00.000Z"
  }
}
```

---

### 4. Update Bug
Update bug details. **(Protected)**

```
PUT /api/bugs/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Login button not working on mobile",
  "status": "in_progress",
  "assignedTo": "60d5ec49c1234567890abcd2",
  "priority": "critical",
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Bug updated successfully",
  "bug": {
    "_id": "60d5ec49c1234567890abcd3",
    "title": "Login button not working on mobile",
    "status": "in_progress",
    "priority": "critical"
  }
}
```

---

### 5. Delete Bug
Delete a bug report. **(Protected)**

```
DELETE /api/bugs/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Bug deleted successfully"
}
```

---

### 6. Add Comment
Add a comment to a bug. **(Protected)**

```
POST /api/bugs/:id/comments
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "text": "I've identified the issue. It's related to the JavaScript event handler."
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Comment added successfully",
  "comment": {
    "_id": "60d5ec49c1234567890abcd4",
    "text": "I've identified the issue...",
    "author": {
      "_id": "60d5ec49c1234567890abcd1",
      "name": "John Doe"
    },
    "createdAt": "2024-02-17T10:30:00.000Z"
  }
}
```

---

### 7. Delete Comment
Delete a comment from a bug. **(Protected)**

```
DELETE /api/bugs/:id/comments/:commentId
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

---

### 8. Toggle Watch Bug
Start or stop watching a bug for notifications. **(Protected)**

```
POST /api/bugs/:id/watch
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Now watching this bug",
  "watching": true
}
```

---

### 9. Get Bug Statistics
Retrieve bug statistics and metrics. **(Protected)**

```
GET /api/bugs/stats
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "total": 47,
    "open": 23,
    "inProgress": 12,
    "closed": 11,
    "reopened": 1,
    "byPriority": {
      "low": 5,
      "medium": 20,
      "high": 15,
      "critical": 7
    },
    "bySeverity": {
      "minor": 10,
      "major": 25,
      "critical": 12
    },
    "averageResolutionTime": 86400000,
    "byAssignee": [
      { "assignee": "Jane Smith", "count": 15 },
      { "assignee": "John Smith", "count": 12 }
    ]
  }
}
```

---

## User Endpoints

### 1. Get All Users
Retrieve list of all users. **(Protected - Admin Only)**

```
GET /api/users?page=1&limit=10&search=john
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search by name or email (optional)
- `role`: Filter by role (optional)
- `status`: `active` or `inactive` (optional)

**Response (200):**
```json
{
  "success": true,
  "users": [
    {
      "_id": "60d5ec49c1234567890abcd1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "developer",
      "isActive": true,
      "createdAt": "2024-01-15T08:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalItems": 15,
    "itemsPerPage": 10
  }
}
```

---

### 2. Get User by ID
Retrieve a specific user. **(Protected - Admin Only)**

```
GET /api/users/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "60d5ec49c1234567890abcd1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "developer",
    "isActive": true,
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-02-17T10:00:00.000Z"
  }
}
```

---

### 3. Create User
Create a new user. **(Protected - Admin Only)**

```
POST /api/users
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "secure_password_123",
  "role": "tester"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "_id": "60d5ec49c1234567890abcd5",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "tester",
    "isActive": true
  }
}
```

---

### 4. Update User
Update user information. **(Protected - Admin Only)**

```
PUT /api/users/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Jane Smith Updated",
  "role": "developer"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "user": {
    "_id": "60d5ec49c1234567890abcd5",
    "name": "Jane Smith Updated",
    "role": "developer"
  }
}
```

---

### 5. Delete User
Delete a user account. **(Protected - Admin Only)**

```
DELETE /api/users/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### 6. Toggle User Status
Activate or deactivate a user. **(Protected - Admin Only)**

```
PATCH /api/users/:id/toggle-status
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "User status updated",
  "user": {
    "isActive": false,
    "deactivatedAt": "2024-02-17T10:00:00.000Z"
  }
}
```

---

### 7. Get User Statistics
Retrieve user activity and metrics. **(Protected - Admin Only)**

```
GET /api/users/:id/stats
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "bugsCreated": 15,
    "bugsAssigned": 8,
    "bugsClosed": 6,
    "commentsAdded": 25,
    "lastActive": "2024-02-17T09:45:00.000Z",
    "joinDate": "2024-01-15T08:00:00.000Z"
  }
}
```

---

## Report Endpoints

### 1. Generate Report
Create a new report. **(Protected)**

```
POST /api/reports
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "February Bug Summary",
  "type": "summary",
  "dateRange": {
    "from": "2024-02-01",
    "to": "2024-02-28"
  },
  "filters": {
    "priority": "high",
    "status": "closed"
  }
}
```

**Report Types:**
- `summary`: Overview of bug metrics
- `detailed`: Comprehensive bug analysis
- `trend`: Bug trends over time
- `assignment`: Bug assignment distribution
- `project`: Project-wise bug breakdown
- `custom`: Custom report with specific filters

**Response (201):**
```json
{
  "success": true,
  "message": "Report generated successfully",
  "report": {
    "_id": "60d5ec49c1234567890abcd6",
    "title": "February Bug Summary",
    "type": "summary",
    "createdBy": "60d5ec49c1234567890abcd1",
    "data": {
      "totalBugs": 47,
      "openBugs": 23,
      "closedBugs": 11,
      "avgResolutionTime": 86400000
    },
    "createdAt": "2024-02-17T10:00:00.000Z"
  }
}
```

---

### 2. Get All Reports
Retrieve list of generated reports. **(Protected)**

```
GET /api/reports?page=1&limit=10
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "reports": [
    {
      "_id": "60d5ec49c1234567890abcd6",
      "title": "February Bug Summary",
      "type": "summary",
      "createdBy": { "name": "John Doe" },
      "createdAt": "2024-02-17T10:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 3,
    "itemsPerPage": 10
  }
}
```

---

### 3. Get Report by ID
Retrieve a specific report. **(Protected)**

```
GET /api/reports/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "report": {
    "_id": "60d5ec49c1234567890abcd6",
    "title": "February Bug Summary",
    "type": "summary",
    "data": {
      "totalBugs": 47,
      "byPriority": { "low": 5, "medium": 20, "high": 15, "critical": 7 },
      "bySeverity": { "minor": 10, "major": 25, "critical": 12 }
    },
    "createdBy": { "name": "John Doe" },
    "createdAt": "2024-02-17T10:00:00.000Z"
  }
}
```

---

### 4. Delete Report
Delete a report. **(Protected)**

```
DELETE /api/reports/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Report deleted successfully"
}
```

---

## Settings Endpoints

### 1. Get All Settings
Retrieve all system settings. **(Protected)**

```
GET /api/settings
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "settings": [
    {
      "_id": "60d5ec49c1234567890abcd7",
      "key": "email_notifications",
      "category": "notification",
      "value": true,
      "description": "Enable email notifications for bug updates"
    }
  ]
}
```

---

### 2. Get Setting by Key
Retrieve a specific setting. **(Protected)**

```
GET /api/settings/:key
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "setting": {
    "_id": "60d5ec49c1234567890abcd7",
    "key": "email_notifications",
    "category": "notification",
    "value": true
  }
}
```

---

### 3. Create Setting
Create a new setting. **(Protected - Admin Only)**

```
POST /api/settings
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "key": "max_upload_size",
  "category": "general",
  "value": 10485760,
  "description": "Maximum file upload size in bytes"
}
```

**Categories:**
- `general`: General application settings
- `notification`: Notification preferences
- `security`: Security settings
- `email`: Email configuration
- `project`: Project settings
- `ui`: UI/UX preferences

**Response (201):**
```json
{
  "success": true,
  "message": "Setting created successfully",
  "setting": {
    "_id": "60d5ec49c1234567890abcd8",
    "key": "max_upload_size",
    "category": "general",
    "value": 10485760
  }
}
```

---

### 4. Update Setting
Update a setting. **(Protected - Admin Only)**

```
PUT /api/settings/:key
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "value": 20971520,
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Setting updated successfully",
  "setting": {
    "key": "max_upload_size",
    "value": 20971520
  }
}
```

---

### 5. Bulk Update Settings
Update multiple settings at once. **(Protected - Admin Only)**

```
PUT /api/settings
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "settings": [
    { "key": "email_notifications", "value": true },
    { "key": "auto_assign_bugs", "value": false }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "updated": 2
}
```

---

### 6. Delete Setting
Delete a setting. **(Protected - Admin Only)**

```
DELETE /api/settings/:key
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Setting deleted successfully"
}
```

---

## Request/Response Format

### Request Headers

All protected endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

---

## Error Handling

### HTTP Status Codes

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request body or parameters |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource or constraint violation |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal server error |

### Common Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authorization token required"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "You don't have permission to access this resource"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Bug with ID 60d5ec49c1234567890abcd3 not found"
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" },
    { "field": "password", "message": "Password must be at least 8 characters" }
  ]
}
```

---

## Rate Limiting

### Limits

- **General API**: 100 requests per 15 minutes
- **Auth Endpoints**: 10 requests per 15 minutes

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1708172400
```

### Rate Limit Exceeded

Status: 429

```json
{
  "success": false,
  "message": "Too many requests. Please try again later."
}
```

---

## Examples

### Complete Login Flow

**1. Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "secure_password_123"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "name": "John Doe", "role": "user" }
}
```

**2. Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "secure_password_123"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "name": "John Doe", "role": "user" }
}
```

**3. Get Current User (using token):**
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Create and Retrieve Bug

**1. Create Bug:**
```bash
curl -X POST http://localhost:5000/api/bugs \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Login button not working",
    "priority": "high",
    "status": "open"
  }'
```

**2. Get All Bugs:**
```bash
curl -X GET "http://localhost:5000/api/bugs?status=open&priority=high" \
  -H "Authorization: Bearer <token>"
```

**3. Get Specific Bug:**
```bash
curl -X GET http://localhost:5000/api/bugs/60d5ec49c1234567890abcd3 \
  -H "Authorization: Bearer <token>"
```

**4. Update Bug:**
```bash
curl -X PUT http://localhost:5000/api/bugs/60d5ec49c1234567890abcd3 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "status": "in_progress" }'
```

---

## Health Check

Check if the API is running:

```
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Bug Tracker API is running",
  "environment": "production",
  "timestamp": "2024-02-17T10:00:00.000Z",
  "uptime": 3600
}
```

---

## API Information

Get general API information:

```
GET /api
```

**Response:**
```json
{
  "success": true,
  "message": "Bug Tracker API v1.0.0",
  "endpoints": {
    "auth": "/api/auth",
    "bugs": "/api/bugs",
    "users": "/api/users",
    "reports": "/api/reports",
    "settings": "/api/settings"
  }
}
```

---

## Support

For API issues or questions:
- Check error responses for detailed error messages
- Verify token validity and expiration
- Ensure request body matches specified schema
- Check rate limiting headers if requests fail
- Review server logs for detailed error information

---

**Last Updated:** February 17, 2026  
**Version:** 1.0.0
