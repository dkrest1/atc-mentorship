# API Testing Guide

## Quick Start with Postman

1. **Import the Collection:**
   - Open Postman
   - Click `File` → `Import`
   - Select `Postman_Collection.json` from this folder
   - All 5 example requests will be ready to use!

2. **Test the Flow:**
   - Run requests in order: Register → Login → Access Protected Route

---

## Testing with cURL

### 1. Register a New User

```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "mySecurePassword123"
  }'
```

**Expected Response:**
```json
{
  "message": "User registered successfully",
  "userId": 1,
  "username": "john_doe"
}
```

---

### 2. Login (Get JWT Token)

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "mySecurePassword123"
  }'
```

**Expected Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe"
  }
}
```

**Important:** Copy the token value from the response. You'll need it for the next request.

---

### 3. Access Protected Route (Requires Token)

Replace `YOUR_TOKEN_HERE` with the actual token from the login response:

```bash
curl -X GET http://localhost:3000/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Example with actual token:**
```bash
curl -X GET http://localhost:3000/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Expected Response:**
```json
{
  "message": "Profile accessed successfully",
  "user": {
    "id": 1,
    "username": "john_doe"
  }
}
```

---

### 4. View All Users (Public Endpoint)

```bash
curl http://localhost:3000/users
```

**Expected Response:**
```json
{
  "users": [
    { "id": 1, "username": "john_doe" },
    { "id": 2, "username": "jane_smith" }
  ]
}
```

---

### 5. Health Check

```bash
curl http://localhost:3000/
```

**Expected Response:**
```json
{
  "message": "Auth Demo Server is running!"
}
```

---

## Testing Error Cases

### Missing Token (Should Fail)

```bash
# This will return 401 Unauthorized
curl -X GET http://localhost:3000/profile
```

**Response:**
```json
{
  "message": "No token provided"
}
```

---

### Invalid Token (Should Fail)

```bash
# This will return 403 Forbidden
curl -X GET http://localhost:3000/profile \
  -H "Authorization: Bearer invalid-token-here"
```

**Response:**
```json
{
  "message": "Invalid or expired token"
}
```

---

### Wrong Password (Should Fail)

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "wrongPassword"
  }'
```

**Response:**
```json
{
  "message": "Invalid username or password"
}
```

---

### Duplicate Username (Should Fail)

```bash
# Register with username that already exists
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "anotherPassword"
  }'
```

**Response:**
```json
{
  "message": "Username already taken"
}
```

---

## How to Use in Postman (Step-by-Step)

### Step 1: Register
1. Click on "1. Register New User"
2. Click **Send**
3. View response (note the userId)

### Step 2: Login
1. Click on "2. Login (Get Token)"
2. Click **Send**
3. Copy the token from response (without quotes)

### Step 3: Access Protected Route
1. Click on "3. Access Protected Route (Profile)"
2. Click on the **Authorization** header value field
3. Replace `YOUR_TOKEN_HERE` with your copied token
4. Click **Send**
5. ✅ You should see your profile!

---

## Key Learning Points

1. **Registration:** Username + Password → Hashed & Stored
2. **Login:** Username + Password → JWT Token Generated
3. **Protected Route:** Token Required → User Data Returned
4. **Error Handling:** Missing/Invalid Token → 401/403 Response

This demonstrates the complete authentication flow that's used in real applications!
