// ============================================
// Utility Functions — Cardoso Palace Hotel
// ============================================

const AVATAR_COLORS = ['avatar-purple', 'avatar-blue', 'avatar-green', 'avatar-orange', 'avatar-pink', 'avatar-teal'];

function getAvatar(name) {
    const initials = (name || '??').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const color = AVATAR_COLORS[name ? name.charCodeAt(0) % AVATAR_COLORS.length : 0];
    return `<div class="avatar ${color}">${initials}</div>`;
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatCurrency(value) {
    if (value == null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function todayISO() {
    return new Date().toISOString().split('T')[0];
}

function statusBadge(status) {
    const sStr = (status || '').toString().trim().toUpperCase();
    const map = {
        'PENDENTE': { class: 'badge-warning', icon: 'schedule' },
        'CONFIRMADO': { class: 'badge-success', icon: 'check_circle' },
        'CANCELADO': { class: 'badge-danger', icon: 'cancel' },
        'CHECK-OUT': { class: 'badge-neutral', icon: 'logout' },
        'FINALIZADO': { class: 'badge-neutral', icon: 'logout' }
    };
    const s = map[sStr] || { class: 'badge-neutral', icon: 'info' };
    return `<span class="badge ${s.class}"><span class="material-icons">${s.icon}</span>${sStr}</span>`;
}

function roomStatusBadge(status) {
    const sStr = (status || 'Disponível').toString().trim().toLowerCase();

    // Create map with lowercase keys
    const map = {
        'disponível': { class: 'badge-success', icon: 'check_circle', label: 'Disponível' },
        'ocupado': { class: 'badge-danger', icon: 'do_not_disturb', label: 'Ocupado' },
        'manutenção': { class: 'badge-warning', icon: 'build', label: 'Manutenção' },
    };
    const s = map[sStr] || { class: 'badge-neutral', icon: 'info', label: status };
    return `<span class="badge ${s.class}"><span class="material-icons">${s.icon}</span>${s.label}</span>`;
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const icons = { success: 'check_circle', error: 'error', info: 'info' };
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="material-icons">${icons[type] || 'info'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function openModal(html) {
    const overlay = document.getElementById('modal-overlay');
    const container = document.getElementById('modal-container');
    container.innerHTML = html;
    overlay.classList.remove('hidden');
    setTimeout(() => overlay.classList.add('active'), 10);
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('active');
    setTimeout(() => overlay.classList.add('hidden'), 300);
}

// Close modal on overlay click
document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
});
