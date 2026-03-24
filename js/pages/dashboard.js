// ============================================
// Dashboard Page — Cardoso Palace Hotel
// ============================================

async function renderDashboard() {
  const content = document.getElementById('page-content');

  // Get current month as default date range
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Visão geral do hotel em tempo real</p>
      </div>
    </div>
    <div class="stats-grid" id="stats-grid">
      <div class="loading"><div class="spinner"></div></div>
    </div>

    <!-- Revenue Section -->
    <div class="revenue-section">
      <div class="revenue-header">
        <h3><span class="material-icons" style="vertical-align:middle;margin-right:8px;color:var(--gold)">payments</span>Faturamento</h3>
        <div class="revenue-filters">
          <input type="date" class="filter-select" id="rev-start" value="${firstDay}">
          <span style="color:var(--text-muted)">até</span>
          <input type="date" class="filter-select" id="rev-end" value="${lastDay}">
          <button class="btn btn-primary btn-sm" onclick="updateRevenue()">
            <span class="material-icons">filter_alt</span> Filtrar
          </button>
        </div>
      </div>
      <div id="revenue-content"><div class="loading"><div class="spinner"></div></div></div>
    </div>

    <div class="table-card">
      <div class="table-card-header">
        <h3>Reservas Recentes</h3>
      </div>
      <div id="recent-reservations">
        <div class="loading"><div class="spinner"></div></div>
      </div>
    </div>
  `;

  try {
    const today = todayISO();

    // Fetch all data in parallel
    const [reservas, quartos] = await Promise.all([
      supabase.select('reservas', 'select=*,dados_hotel(nomewpp),quartos(tipo,preco,numero_quarto)&order=created_at.desc'),
      supabase.select('quartos', 'select=id_quarto,status')
    ]);

    // Calculate stats
    const active = reservas.filter(r => {
      const s = (r.status || '').toString().trim().toUpperCase();
      return s === 'CONFIRMADO' || s === 'PENDENTE' || s === 'CHECK-IN';
    });
    const ocupacao = Math.round((active.length / 44) * 100);
    const checkinsToday = reservas.filter(r => r.check_in === today);
    const checkoutsToday = reservas.filter(r => r.check_out === today);
    const totalRooms = quartos.length;
    const occupiedRooms = quartos.filter(q => q.status === 'Ocupado').length;
    const availableRooms = quartos.filter(q => q.status === 'Disponível').length;
    const occupancyPct = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // Render stats — 5 cards like Stitch
    document.getElementById('stats-grid').innerHTML = `
      <div class="stat-card">
        <div class="stat-icon blue"><span class="material-icons">event_available</span></div>
        <div class="stat-info">
          <h3>${active.length}</h3>
          <span class="stat-label">Reservas Ativas</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green"><span class="material-icons">login</span></div>
        <div class="stat-info">
          <h3>${checkinsToday.length}</h3>
          <span class="stat-label">Check-ins Hoje</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange"><span class="material-icons">logout</span></div>
        <div class="stat-info">
          <h3>${checkoutsToday.length}</h3>
          <span class="stat-label">Check-outs Hoje</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red"><span class="material-icons">hotel</span></div>
        <div class="stat-info">
          <h3>${occupancyPct}%</h3>
          <span class="stat-label">Ocupação (${occupiedRooms}/${totalRooms})</span>
          <div class="occupancy-bar-container">
            <div class="occupancy-bar"><div class="occupancy-fill" style="width:${occupancyPct}%"></div></div>
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(20,184,166,0.15);color:#14b8a6"><span class="material-icons">meeting_room</span></div>
        <div class="stat-info">
          <h3>${availableRooms}</h3>
          <span class="stat-label">Quartos Disponíveis</span>
        </div>
      </div>
    `;

    // Load revenue with default dates
    window._dashboardReservas = reservas;
    updateRevenue();

    // Recent reservations table
    const recent = reservas.slice(0, 10);
    if (recent.length === 0) {
      document.getElementById('recent-reservations').innerHTML = `
        <div class="empty-state"><span class="material-icons">calendar_today</span><p>Nenhuma reserva encontrada</p></div>
      `;
      return;
    }

    document.getElementById('recent-reservations').innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Hóspede</th>
            <th>Tipo de Quarto</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Status</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          ${recent.map(r => {
      const nome = r.dados_hotel?.nomewpp || '—';
      const tipo = r.quartos?.tipo || '—';
      const preco = r.quartos?.preco || 0;
      const days = r.check_in && r.check_out
        ? Math.max(1, Math.ceil((new Date(r.check_out) - new Date(r.check_in)) / 86400000))
        : 1;
      const total = preco * days;
      return `
              <tr>
                <td><div class="name-cell">${getAvatar(nome)}<span>${nome}</span></div></td>
                <td>${tipo}</td>
                <td>${formatDate(r.check_in)}</td>
                <td>${formatDate(r.check_out)}</td>
                <td>${statusBadge(r.status)}</td>
                <td>${formatCurrency(total)}</td>
              </tr>`;
    }).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error('Dashboard error:', err);
    document.getElementById('stats-grid').innerHTML = `
      <div class="empty-state"><span class="material-icons">error</span><p>Erro ao carregar dados: ${err.message}</p></div>
    `;
  }
}

function updateRevenue() {
  const startDate = document.getElementById('rev-start').value;
  const endDate = document.getElementById('rev-end').value;
  const reservas = window._dashboardReservas || [];

  // Filter reservas within date range (check_in falls in range)
  const filtered = window._dashboardReservas.filter(r => {
    if (!r.check_in) return false;
    const status = (r.status || '').toString().trim().toUpperCase();
    if (status === 'CANCELADO') return false;
    return r.check_in >= startDate && r.check_in <= endDate;
  });

  // Calculate total revenue
  let totalRevenue = 0;
  const dailyRevenue = {};

  filtered.forEach(r => {
    const preco = r.quartos?.preco || 0;
    const days = r.check_in && r.check_out
      ? Math.max(1, Math.ceil((new Date(r.check_out) - new Date(r.check_in)) / 86400000))
      : 1;
    const valor = preco * days;
    totalRevenue += valor;

    // Group by week for chart bars
    const weekStart = new Date(r.check_in + 'T00:00:00');
    const weekKey = `${weekStart.getDate().toString().padStart(2, '0')}/${(weekStart.getMonth() + 1).toString().padStart(2, '0')}`;
    dailyRevenue[weekKey] = (dailyRevenue[weekKey] || 0) + valor;
  });

  const maxVal = Math.max(...Object.values(dailyRevenue), 1);
  const barEntries = Object.entries(dailyRevenue).sort((a, b) => a[0].localeCompare(b[0]));

  // Format period label
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const periodLabel = start.getMonth() === end.getMonth()
    ? `${monthNames[start.getMonth()]} ${start.getFullYear()}`
    : `${formatDate(startDate)} — ${formatDate(endDate)}`;

  document.getElementById('revenue-content').innerHTML = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:32px;flex-wrap:wrap;">
      <div>
        <div class="revenue-total">${formatCurrency(totalRevenue)}</div>
        <div class="revenue-label">Faturamento total — ${periodLabel}</div>
        <div class="revenue-label" style="margin-top:4px;">${filtered.length} reserva(s) no período</div>
      </div>
      <div class="summary-tiles" style="margin-top: 24px;">
        <div class="summary-tile">
          <h4 style="color:var(--success)">${filtered.filter(r => (r.status || '').toString().trim().toUpperCase() === 'CONFIRMADO').length}</h4>
          <span>CONFIRMADAS</span>
        </div>
        <div class="summary-tile">
          <h4 style="color:var(--warning)">${filtered.filter(r => (r.status || '').toString().trim().toUpperCase() === 'PENDENTE').length}</h4>
          <span>PENDENTES</span>
        </div>
        <div class="summary-tile">
          <h4 style="color:var(--neutral)">${filtered.filter(r => ['CHECK-OUT', 'FINALIZADO'].includes((r.status || '').toString().trim().toUpperCase())).length}</h4>
          <span>CHECK-OUTS</span>
        </div>
      </div>
    </div>
    ${barEntries.length > 0 ? `
      <div class="revenue-bars-wrapper" style="margin-top:24px;">
        <div class="revenue-bars-row">
          ${barEntries.map(([_, val]) => `<div class="revenue-bar" style="height:${Math.max(4, (val / maxVal) * 100)}%" title="${formatCurrency(val)}"></div>`).join('')}
        </div>
        <div class="revenue-bars-labels" style="margin-top:6px;">
          ${barEntries.map(([label]) => `<span>${label}</span>`).join('')}
        </div>
      </div>
    ` : '<p style="color:var(--text-muted);margin-top:16px;text-align:center;">Sem dados para o período selecionado</p>'}
  `;
}
