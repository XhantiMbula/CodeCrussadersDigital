// Function to handle login and token storage
document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem('token', data.token);
            window.location.href = data.userRole === 'admin' ? 'admin_dashboard.html' : 'dashboard.html';
        } else {
            alert('Invalid credentials');
        }
    });
});

// Function to load resources and display on the user/admin dashboard
function loadResources() {
    fetch('/api/resources')
        .then(response => response.json())
        .then(resources => {
            const resourcesList = document.getElementById('resources-list');
            resources.forEach(resource => {
                const div = document.createElement('div');
                div.classList.add('resource-item');
                div.innerHTML = `<h3>${resource.title}</h3><button onclick="requestResource('${resource._id}')">Request</button>`;
                resourcesList.appendChild(div);
            });
        });
}

function requestResource(resourceId) {
    fetch('/api/request', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ resourceId })
    })
    .then(response => response.json())
    .then(data => {
        alert('Resource requested successfully');
    });
}

// Logout function
document.getElementById('logout-btn').addEventListener('click', function () {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
});

// Call loadResources on page load for User Dashboard and Admin Dashboard
if (document.getElementById('resources-list')) {
    loadResources();
}

// Handle Registration
document.getElementById('register-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'User registered successfully') {
            alert('Registration successful! You can now log in.');
            window.location.href = 'login.html';
        } else {
            alert('Error during registration');
        }
    })
    .catch(error => {
        alert('Error: ' + error);
    });
});

