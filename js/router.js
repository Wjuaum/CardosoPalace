// ============================================
// Router — Cardoso Palace Hotel (Hash-based SPA)
// ============================================

const pages = {
    dashboard: renderDashboard,
    reservas: renderReservas,
    quartos: renderQuartos,
    hospedes: renderHospedes,
};

function showPage(page) {
    const loginPage = document.getElementById('login-page');
    const adminLayout = document.getElementById('admin-layout');

    if (page === 'login') {
        loginPage.classList.remove('hidden');
        adminLayout.classList.add('hidden');
        return;
    }

    // Check auth
    if (!isAuthenticated()) {
        window.location.hash = '#login';
        return;
    }

    loginPage.classList.add('hidden');
    adminLayout.classList.remove('hidden');

    // Update active nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });

    // Render page
    const renderFn = pages[page];
    if (renderFn) {
        renderFn();
    } else {
        document.getElementById('page-content').innerHTML = `
      <div class="empty-state">
        <span class="material-icons">help_outline</span>
        <p>Página não encontrada</p>
      </div>`;
    }
}

function handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    showPage(hash);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initAuth();

    // If not authenticated and not on login, redirect
    if (!isAuthenticated() && window.location.hash !== '#login') {
        window.location.hash = '#login';
    }

    handleRoute();
});

window.addEventListener('hashchange', handleRoute);
