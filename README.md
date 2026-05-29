# Simple Authentication Demo

A beginner-friendly Node.js authentication demo using Express, JWT, and bcryptjs.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

The server will run on `http://localhost:3000`

## API Endpoints

### 1. Register User
**POST** `/register`
```json
{
  "username": "john",
  "password": "password123"
}
```

### 2. Login
**POST** `/login`
```json
{
  "username": "john",
  "password": "password123"
}
```
Returns a JWT token to use for authenticated requests.

### 3. View Profile (Protected)
**GET** `/profile`
- Add header: `Authorization: Bearer <your-token>`

### 4. View All Users
**GET** `/users`

## How It Works

1. **Registration**: Password is hashed with bcryptjs before storage
2. **Login**: Password is compared with stored hash, then JWT token is issued
3. **Protected Routes**: JWT token in Authorization header is verified before allowing access
4. **In-Memory Storage**: Users are stored in memory (resets on server restart)

## Testing with cURL

```bash
# Register
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'

# Login
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'

# Access protected route (replace TOKEN with the token from login)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/profile
```

## Key Concepts Explained

- **bcryptjs**: Securely hashes passwords so they're never stored in plain text
- **JWT**: Tokens that client stores and sends to prove they're logged in
- **Middleware**: Functions that run before routes to check token validity
- **Environment Variables**: Sensitive config (like secrets) kept in .env file
