// ==================== SETUP ====================
// Load environment variables from .env file (like API keys and secrets)
require('dotenv').config();
const morgan = require('morgan');  // HTTP request logger middleware (logs incoming requests to the console)

// Import the libraries we need for this project
const express = require('express');      // Web server framework
const bcrypt = require('bcryptjs');      // Hashes passwords (one-way encryption)
const jwt = require('jsonwebtoken');     // Creates secure tokens for logged-in users

// Create Express application
const app = express();

// Tell Express to automatically parse incoming JSON data from requests
app.use(express.json());
app.use(morgan('dev')); 

// ==================== GLOBAL VARIABLES ====================
// Fake database: Array to store user accounts (resets when server restarts)
// In a real app, you'd use a database like MongoDB or PostgreSQL
let users = [];

// Read PORT from .env file, or use 3000 if not set
const PORT = process.env.PORT;

// Secret key used to "sign" tokens so we can verify they weren't tampered with
// Should be a long random string, not this placeholder!
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// ==================== MIDDLEWARE ====================
// Middleware = A function that runs BEFORE a route handler
// It's like a security guard checking your ID before letting you into a club

// This middleware checks if a user's JWT token is valid
function verifyToken(req, res, next) {
  // Authorization header comes from client: "Authorization: Bearer <TOKEN>"
  const authHeader = req.headers.authorization;
  
  // Extract just the token part (remove "Bearer " prefix)
  const token = authHeader && authHeader.split(' ')[1];

  // If no token provided, reject the request immediately (status 401 = Unauthorized)
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    // jwt.verify() checks if the token is:
    // 1. Valid (hasn't been tampered with)
    // 2. Not expired
    // If valid, it returns the data inside the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Store decoded user info in req.user so we can use it in the route
    req.user = decoded;
    
    // Call next() to say "you passed, continue to the route"
    next();
  } catch (error) {
    // If token is invalid or expired, reject the request (status 403 = Forbidden)
    res.status(403).json({ message: 'Invalid or expired token' });
  }
}

// ==================== ROUTES ====================

// ========== ROUTE 1: REGISTRATION ==========
// POST /register - Allow new users to create an account
// 
// How it works:
// 1. User sends username & password
// 2. We validate the input and check if username is already taken
// 3. We hash the password (scramble it) so it's stored securely
// 4. We save the user to our "database" (the users array)
app.post('/register', async (req, res) => {
  try {
    // Extract username and password from the request body
    const { username, password } = req.body;

    // VALIDATION: Make sure both username and password were provided
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    // DUPLICATE CHECK: Search the users array for this username
    const userExists = users.find(u => u.username === username);
    if (userExists) {
      // Username already taken, reject the request
      return res.status(400).json({ message: 'Username already taken' });
    }

    // SECURITY: Hash the password using bcryptjs
    // Why? Never store plain passwords in a database!
    // Hashing is one-way: we can't unhash it, but we CAN verify it later
    // The 10 is "salt rounds" - higher = more secure but slower
    const hashedPassword = await bcrypt.hash(password, 10);

    // CREATE NEW USER: Build a user object with a unique ID
    const newUser = {
      id: users.length + 1,          // Simple ID (1, 2, 3, etc.)
      username,                       // Username they chose
      password: hashedPassword         // Hashed password (never the original!)
    };

    // SAVE TO DATABASE: Add the new user to our users array
    users.push(newUser);

    // SUCCESS RESPONSE: Tell client the account was created
    // Status 201 = "Created"
    res.status(201).json({ 
      message: 'User registered successfully',
      userId: newUser.id,
      username: newUser.username
      // Note: We DON'T send back the hashed password!
    });
  } catch (error) {
    // ERROR HANDLING: If something went wrong, return error
    // Status 500 = "Server Error"
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// ========== ROUTE 2: LOGIN ==========
// POST /login - Authenticate user and create a JWT token
//
// How it works:
// 1. User sends username & password
// 2. We find the user in our database
// 3. We compare the provided password with the stored hashed password
// 4. If it matches, we create a JWT token and send it back
// 5. User stores this token and sends it with future requests to prove they're logged in
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // VALIDATION: Make sure both fields were provided
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    // FIND USER: Search our users array for this username
    const user = users.find(u => u.username === username);
    if (!user) {
      // User not found - return vague error (don't say "username not found" for security)
      // Status 401 = "Unauthorized"
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // VERIFY PASSWORD: Compare the provided password with the stored hashed password
    // bcrypt.compare() handles the hashing comparison for us
    // Returns true if password matches, false if it doesn't
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      // Wrong password - return same vague error
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // ✅ CREDENTIALS VALID - Create JWT token
    // jwt.sign() creates a token with:
    // - Payload: the data to encode (user ID and username)
    // - Secret: JWT_SECRET (used to sign/verify the token)
    // - Options: expiration time (token expires in 1 hour)
    const token = jwt.sign(
      { id: user.id, username: user.username },  // Data inside the token
      JWT_SECRET,                                  // Secret key for signing
      { expiresIn: '1h' }                          // Token valid for 1 hour
    );

    // SUCCESS RESPONSE: Send token back to client
    // Client will store this token and send it with future requests
    res.json({ 
      message: 'Login successful',
      token,                                      // The JWT token
      user: { id: user.id, username: user.username }  // Basic user info
    });
  } catch (error) {
    // ERROR HANDLING
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// ========== ROUTE 3: PROTECTED PROFILE ==========
// GET /profile - Show user's profile (only if they have a valid token)
//
// The verifyToken middleware runs FIRST:
// - If valid token: user info stored in req.user, route handler runs
// - If invalid/missing token: request rejected before reaching this route
app.get('/profile', verifyToken, (req, res) => {
  // If we reach here, the verifyToken middleware already validated the token
  // req.user contains the decoded data from the token
  
  // FIND USER: Look up the user in our database using their ID
  const user = users.find(u => u.id === req.user.id);
  
  // RETURN PROFILE: Send back the user's info
  res.json({
    message: 'Profile accessed successfully',
    user: {
      id: user.id,
      username: user.username
      // In a real app, you'd send more data here (email, profile picture, etc.)
    }
  });
});

// ========== ROUTE 4: LIST ALL USERS (public) ==========
// GET /users - Show all usernames (no authentication required)
// This is just for testing/demo - in a real app, you might not expose this
app.get('/users', (req, res) => {
  // Create a list of users (only ID and username, no passwords!)
  const userList = users.map(u => ({ id: u.id, username: u.username }));
  res.json({ users: userList });
});

// ========== ROUTE 5: HEALTH CHECK ==========
// GET / - Simple endpoint to verify the server is running
app.get('/home', (req, res) => {
  res.json({ message: 'Auth Demo Server is running!' });
});

// Server Monitoring Route
app.get('/health', (req, res) => {
  res.json({
    status: 'Server is healthy',
    uptime: process.uptime(),
    timestamp: new Date(),
    memoryUsage: process.memoryUsage()
  });
});

// ==================== START SERVER ====================
// Tell Express to listen for incoming requests on the specified port

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log('\n📝 Available endpoints:');
  console.log('   POST   /register    - Create new account');
  console.log('   POST   /login       - Login and get JWT token');
  console.log('   GET    /profile     - View profile (requires valid token)');
  console.log('   GET    /users       - View all registered users');
  console.log('   GET    /            - Health check\n');
});

// console.log("atc server is running at the moment")
