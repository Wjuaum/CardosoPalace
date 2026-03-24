// ============================================
// Authentication — Cardoso Palace Hotel
// ============================================
const AUTH_KEY = 'cardoso_palace_auth';
const VALID_USER = 'Admin';
const VALID_PASS = 'Cardoso2026';

function isAuthenticated() {
    return localStorage.getItem(AUTH_KEY) === 'true';
}

function login(username, password) {
    if (username === VALID_USER && password === VALID_PASS) {
        localStorage.setItem(AUTH_KEY, 'true');
        return true;
    }
    return false;
}

function logout() {
    localStorage.removeItem(AUTH_KEY);
    window.location.hash = '#login';
}

function initAuth() {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const btnLogout = document.getElementById('btn-logout');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('username').value.trim();
        const pass = document.getElementById('password').value;

        if (login(user, pass)) {
            loginError.classList.add('hidden');
            window.location.hash = '#dashboard';
        } else {
            loginError.classList.remove('hidden');
            loginError.textContent = 'Usuário ou senha inválidos.';
            document.getElementById('password').value = '';
        }
    });

    btnLogout.addEventListener('click', logout);
}
