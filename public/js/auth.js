document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');

  // 1. Handle Signup Submission
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('signup-username').value.trim();
      const password = document.getElementById('signup-password').value;
      const errorEl = document.getElementById('signup-error');

      if (username.length < 3) {
        errorEl.textContent = 'Username must be at least 3 characters.';
        return;
      }
      if (password.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters.';
        return;
      }

      // Temporary pre-database storage (will be replaced by POST /api/auth/register)
      const users = JSON.parse(localStorage.getItem('cp_users') || '{}');
      if (users[username]) {
        errorEl.textContent = 'Username already exists.';
        return;
      }

      users[username] = password;
      localStorage.setItem('cp_users', JSON.stringify(users));
      sessionStorage.setItem('cp_current_user', JSON.stringify({ username }));

      window.location.href = 'main.html';
    });
  }

  // 2. Handle Login Submission
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;
      const errorEl = document.getElementById('login-error');

      if (!username || !password) {
        errorEl.textContent = 'Please enter both username and password.';
        return;
      }

      // Temporary pre-database check (will be replaced by POST /api/auth/login)
      const users = JSON.parse(localStorage.getItem('cp_users') || '{}');
      if (!users[username] || users[username] !== password) {
        errorEl.textContent = 'Invalid username or password.';
        return;
      }

      sessionStorage.setItem('cp_current_user', JSON.stringify({ username }));
      window.location.href = 'main.html';
    });
  }

});
