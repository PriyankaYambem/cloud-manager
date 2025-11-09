// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs'); // For our simple file-based "database"

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your_super_secret_jwt_key'; // CHANGE THIS IN PRODUCTION!

// Middleware
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' folder

// --- Simple User "Database" (DO NOT USE IN PRODUCTION) ---
// We'll store users in a JSON file for simplicity.
const USERS_FILE = path.join(__dirname, 'users.json');

// Helper to read users
function readUsers() {
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([]));
    }
    const data = fs.readFileSync(USERS_FILE);
    return JSON.parse(data);
}

// Helper to write users
function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// --- Authentication Middleware ---
function authenticateToken(req, res, next) {
    const token = req.cookies.token; // Get token from cookie
    if (!token) return res.redirect('/?message=Please log in'); // Redirect to login if no token

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            res.clearCookie('token'); // Clear invalid token
            return res.redirect('/?message=Invalid session, please log in again');
        }
        req.user = user; // Attach user payload to request
        next(); // Proceed to the next middleware/route handler
    });
}

// --- Routes ---

// Registration
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const users = readUsers();
    if (users.find(u => u.username === username)) {
        return res.status(409).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now().toString(), username, password: hashedPassword };
    users.push(newUser);
    writeUsers(users);

    res.status(201).json({ message: 'User registered successfully! You can now log in.' });
});

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();
    const user = users.find(u => u.username === username);

    if (!user) {
        return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

    // Set token as a http-only cookie
    res.cookie('token', token, {
        httpOnly: true, // Prevents client-side JS from accessing the cookie
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
        maxAge: 3600000 // 1 hour
    });

    res.status(200).json({ message: 'Logged in successfully!' });
});

// Logout
app.post('/api/logout', (req, res) => {
    res.clearCookie('token'); // Clear the authentication cookie
    res.status(200).json({ message: 'Logged out successfully!' });
});

// --- Protected Routes (Accessed only if authenticated) ---

// Serve dashboard.html (requires authentication)
app.get('/dashboard', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Serve readme.html (requires authentication, or could be public if you prefer)
app.get('/readme', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'readme.html'));
});

// API to get user's "files" (dummy data)
app.get('/api/files', authenticateToken, (req, res) => {
    // In a real app, you'd fetch files specific to req.user.id
    const userFiles = [
        `File_${req.user.username}_1.txt - This is a secure file for ${req.user.username}.`,
        `File_${req.user.username}_2.txt - Another private document.`,
        "Shared_Data.txt - This data is accessible to all logged-in users."
    ];
    res.json({ files: userFiles });
});

// Serve index.html as the default entry point (login/register page)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});