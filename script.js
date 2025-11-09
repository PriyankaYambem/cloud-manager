// public/script.js

// Function to display messages (success/error)
function displayMessage(elementId, message, type) {
    const messageDiv = document.getElementById(elementId);
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`; // Add dynamic class for styling
        messageDiv.style.display = 'block';
    }
}

// --- Logic for index.html (Login/Register Page) ---
if (document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const messageDiv = document.getElementById('message');

    // Handle Login Form Submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (res.ok) {
                displayMessage('message', data.message, 'success');
                window.location.href = '/dashboard'; // Redirect to dashboard on successful login
            } else {
                displayMessage('message', data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            displayMessage('message', 'An error occurred during login.', 'error');
        }
    });

    // Handle Register Form Submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (res.ok) {
                displayMessage('message', data.message, 'success');
                registerForm.reset(); // Clear form on success
            } else {
                displayMessage('message', data.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            displayMessage('message', 'An error occurred during registration.', 'error');
        }
    });

    // Check for a message query parameter on page load (e.g., from failed auth redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const msg = urlParams.get('message');
    if (msg) {
        displayMessage('message', msg, 'error');
    }
}

// --- Logic for dashboard.html and readme.html (Authenticated Pages) ---
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/logout', { method: 'POST' });
            if (res.ok) {
                window.location.href = '/?message=You have been logged out.'; // Redirect to login
            } else {
                alert('Logout failed!');
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('An error occurred during logout.');
        }
    });
}

// --- Logic specific to dashboard.html ---
if (document.getElementById('userFiles')) {
    const userFilesList = document.getElementById('userFiles');

    async function fetchUserFiles() {
        try {
            const res = await fetch('/api/files');
            if (res.ok) {
                const data = await res.json();
                userFilesList.innerHTML = ''; // Clear "Loading files..."
                data.files.forEach(file => {
                    const li = document.createElement('li');
                    li.textContent = file;
                    userFilesList.appendChild(li);
                });
            } else {
                // If not OK, it likely means authentication failed (e.g., token expired)
                // The backend authenticateToken middleware should redirect, but this is a fallback.
                userFilesList.innerHTML = '<li>Error loading files. Please try logging in again.</li>';
                // Potentially redirect to login: window.location.href = '/';
            }
        } catch (error) {
            console.error('Error fetching files:', error);
            userFilesList.innerHTML = '<li>Failed to connect to server.</li>';
        }
    }

    fetchUserFiles();
}