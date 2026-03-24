// ============================================
// Reservas Page — Cardoso Palace Hotel
// ============================================

let allReservas = [];
let allQuartos = [];

async function renderReservas() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Reservas</h1>
        <p class="page-subtitle">Gerencie todas as reservas do hotel</p>
      </div>
      <button class="btn btn-primary" onclick="openCreateReservaModal()">
        <span class="material-icons">add</span> Criar Reserva
      </button>
    </div>
    <div class="filters-bar">
      <div class="search-wrapper">
        <span class="material-icons">search</span>
        <input type="text" id="reserva-search" placeholder="Buscar por nome do hóspede..." oninput="filterReservas()">
      </div>
      <select class="filter-select" id="filter-status" onchange="filterReservas()">
        <option value="">Todos os Status</option>
        <option value="PENDENTE">Pendente</option>
        <option value="CONFIRMADO">Confirmado</option>
        <option value="CANCELADO">Cancelado</option>
        <option value="CHECK-OUT">Check-out (Finalizado)</option>
      </select>
      <select class="filter-select" id="filter-tipo-quarto" onchange="filterReservas()">
        <option value="">Todos os Tipos</option>
      </select>
      <input type="date" class="filter-select" id="filter-date" onchange="filterReservas()">
    </div>
    <div class="table-card">
      <div id="reservas-table">
        <div class="loading"><div class="spinner"></div></div>
      </div>
    </div>
  `;

  try {
    [allReservas, allQuartos] = await Promise.all([
      supabase.select('reservas', 'select=*,dados_hotel(id,nomewpp,cpf,email,telefone),quartos(tipo,preco,numero_quarto)&order=created_at.desc'),
      supabase.select('quartos', 'select=id_quarto,numero_quarto,tipo,preco,capacidade,status&order=numero_quarto.asc')
    ]);

    // Populate tipo filter
    const tipos = [...new Set(allQuartos.map(q => q.tipo).filter(Boolean))];
    const tipoSelect = document.getElementById('filter-tipo-quarto');
    tipos.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t; opt.textContent = t;
      tipoSelect.appendChild(opt);
    });

    renderReservasTable(allReservas);
  } catch (err) {
    console.error('Reservas error:', err);
    document.getElementById('reservas-table').innerHTML = `
      <div class="empty-state"><span class="material-icons">error</span><p>Erro: ${err.message}</p></div>
    `;
  }
}

function filterReservas() {
  const search = document.getElementById('reserva-search').value.toLowerCase();
  const status = document.getElementById('filter-status').value;
  const tipo = document.getElementById('filter-tipo-quarto').value;
  const date = document.getElementById('filter-date').value;

  let filtered = allReservas.filter(r => {
    const nome = (r.dados_hotel?.nomewpp || '').toLowerCase();
    const rStatus = (r.status || '').toUpperCase();

    if (search && !nome.includes(search)) return false;

    if (status) {
      if (status === 'CHECK-OUT' && rStatus !== 'CHECK-OUT' && rStatus !== 'FINALIZADO') return false;
      else if (status !== 'CHECK-OUT' && rStatus !== status) return false;
    }

    if (tipo && r.quartos?.tipo !== tipo) return false;
    if (date && r.check_in !== date && r.check_out !== date) return false;
    return true;
  });
  renderReservasTable(filtered);
}

function renderReservasTable(data) {
  if (data.length === 0) {
    document.getElementById('reservas-table').innerHTML = `
      <div class="empty-state"><span class="material-icons">event_busy</span><p>Nenhuma reserva encontrada</p></div>
    `;
    return;
  }

  const activeCount = data.filter(r => {
    const s = (r.status || '').toUpperCase();
    return s === 'CONFIRMADO' || s === 'PENDENTE' || s === 'CHECK-IN';
  }).length;
  const pendingCount = data.filter(r => (r.status || '').toUpperCase() === 'PENDENTE').length;
  const arrivalsToday = data.filter(r => r.check_in === todayISO()).length;

  document.getElementById('reservas-table').innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Hóspede</th>
          <th>Quarto</th>
          <th>Tipo</th>
          <th>Check-in</th>
          <th>Check-out</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(r => {
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
              <td>${r.quartos?.numero_quarto || '—'}</td>
              <td>${tipo}</td>
              <td>${formatDate(r.check_in)}</td>
              <td>${formatDate(r.check_out)}</td>
              <td>${statusBadge(r.status)}</td>
              <td class="actions-cell">
                <button class="btn-icon" title="Editar Status" onclick="openEditStatusModal(${r.id}, '${r.status}')">
                  <span class="material-icons">edit</span>
                </button>
                ${r.status !== 'CANCELADO' ? `
                  <button class="btn-icon" title="Cancelar" onclick="cancelReserva(${r.id})">
                    <span class="material-icons" style="color:var(--danger)">block</span>
                  </button>
                ` : ''}
              </td>
            </tr>`;
  }).join('')}
      </tbody>
    </table>

    <div class="summary-tiles">
      <div class="summary-tile">
        <h4 style="color:var(--accent)">${activeCount}</h4>
        <span>Reservas Ativas</span>
      </div>
      <div class="summary-tile">
        <h4 style="color:var(--warning)">${pendingCount}</h4>
        <span>Tarefas Pendentes</span>
      </div>
      <div class="summary-tile">
        <h4 style="color:var(--success)">${arrivalsToday}</h4>
        <span>Chegadas Hoje</span>
      </div>
    </div>
  `;
}

function openCreateReservaModal() {
  const quartosDisp = allQuartos.filter(q => q.status === 'Disponível');
  openModal(`
    <div class="modal-header">
      <h3>Nova Reserva</h3>
      <button class="btn-icon" onclick="closeModal()"><span class="material-icons">close</span></button>
    </div>
    <form class="modal-form" onsubmit="submitReserva(event)">
      <div class="form-row">
        <div><label>Nome Completo</label><input class="form-control" id="r-nome" required></div>
        <div><label>CPF</label><input class="form-control" id="r-cpf" required></div>
      </div>
      <div class="form-row">
        <div><label>E-mail</label><input type="email" class="form-control" id="r-email"></div>
        <div><label>Telefone</label><input class="form-control" id="r-telefone"></div>
      </div>
      <div class="form-row">
        <div><label>Check-in</label><input type="date" class="form-control" id="r-checkin" required></div>
        <div><label>Check-out</label><input type="date" class="form-control" id="r-checkout" required></div>
      </div>
      <div>
        <label>Quarto</label>
        <select class="form-control" id="r-quarto" required>
          <option value="">Selecione um quarto</option>
          ${quartosDisp.map(q => `<option value="${q.id_quarto}" data-tipo="${q.tipo}">${q.numero_quarto} — ${q.tipo} (${formatCurrency(q.preco)}/noite)</option>`).join('')}
        </select>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary"><span class="material-icons">save</span> Criar Reserva</button>
      </div>
    </form>
  `);
}

async function submitReserva(e) {
  e.preventDefault();
  try {
    const quartoId = parseInt(document.getElementById('r-quarto').value);
    const quartoOpt = document.getElementById('r-quarto').selectedOptions[0];
    const tipoQuarto = quartoOpt.dataset.tipo;

    // Insert or update guest (prevent duplication by CPF)
    const cpfStr = document.getElementById('r-cpf').value.trim();
    let guestId = null;

    // Check if guest already exists
    const existingGuests = await supabase.select('dados_hotel', `select=id&cpf=eq.${cpfStr}`);

    if (existingGuests && existingGuests.length > 0) {
      guestId = existingGuests[0].id;
      // Optionally update email/phone if provided
      await supabase.update('dados_hotel', guestId, {
        nomewpp: document.getElementById('r-nome').value.trim(),
        email: document.getElementById('r-email').value.trim() || existingGuests[0].email,
        telefone: document.getElementById('r-telefone').value.trim() || existingGuests[0].telefone,
        check_in: document.getElementById('r-checkin').value,
        check_out: document.getElementById('r-checkout').value,
        quarto_id: quartoId,
        tipo_quarto: tipoQuarto
      });
    } else {
      const [newGuest] = await supabase.insert('dados_hotel', {
        nomewpp: document.getElementById('r-nome').value.trim(),
        cpf: cpfStr,
        email: document.getElementById('r-email').value.trim(),
        telefone: document.getElementById('r-telefone').value.trim(),
        check_in: document.getElementById('r-checkin').value,
        check_out: document.getElementById('r-checkout').value,
        quarto_id: quartoId,
        tipo_quarto: tipoQuarto
      });
      guestId = newGuest.id;
    }

    // Insert reservation
    await supabase.insert('reservas', {
      cliente_id: guestId,
      quarto_id: quartoId,
      check_in: document.getElementById('r-checkin').value,
      check_out: document.getElementById('r-checkout').value,
      status: 'PENDENTE'
    });

    // Automatically set room to Ocupado
    await supabase.update('quartos', quartoId, { status: 'Ocupado' }, 'id_quarto');

    closeModal();
    showToast('Reserva criada com sucesso!');
    renderReservas();
  } catch (err) {
    console.error('Create reservation error:', err);
    showToast('Erro ao criar reserva: ' + err.message, 'error');
  }
}

function openEditStatusModal(id, currentStatus) {
  openModal(`
    <div class="modal-header">
      <h3>Alterar Status</h3>
      <button class="btn-icon" onclick="closeModal()"><span class="material-icons">close</span></button>
    </div>
    <form class="modal-form" onsubmit="submitEditStatus(event, ${id})">
      <div>
        <label>Novo Status</label>
        <select class="form-control" id="edit-status">
          <option value="PENDENTE" ${currentStatus === 'PENDENTE' ? 'selected' : ''}>Pendente</option>
          <option value="CONFIRMADO" ${currentStatus === 'CONFIRMADO' ? 'selected' : ''}>Confirmado</option>
          <option value="CHECK-OUT" ${currentStatus === 'CHECK-OUT' || currentStatus === 'FINALIZADO' ? 'selected' : ''}>Check-out</option>
          <option value="CANCELADO" ${currentStatus === 'CANCELADO' ? 'selected' : ''}>Cancelado</option>
        </select>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary"><span class="material-icons">save</span> Salvar</button>
      </div>
    </form>
  `);
}

async function submitEditStatus(e, id) {
  e.preventDefault();
  try {
    const status = document.getElementById('edit-status').value;
    await supabase.update('reservas', id, { status });

    // Also update room status based on reservation
    const res = allReservas.find(r => r.id === id);
    if (res && res.quarto_id) {
      let roomStatus = 'Disponível';
      if (['PENDENTE', 'CONFIRMADO', 'CHECK-IN'].includes(status)) {
        roomStatus = 'Ocupado';
      }
      await supabase.update('quartos', res.quarto_id, { status: roomStatus }, 'id_quarto');
    }

    closeModal();
    showToast('Status atualizado!');
    renderReservas();
  } catch (err) {
    showToast('Erro: ' + err.message, 'error');
  }
}

async function cancelReserva(id) {
  if (!confirm('Tem certeza que deseja cancelar esta reserva?')) return;
  try {
    await supabase.update('reservas', id, { status: 'CANCELADO' });

    // Also free up the room
    const res = allReservas.find(r => r.id === id);
    if (res && res.quarto_id) {
      await supabase.update('quartos', res.quarto_id, { status: 'Disponível' }, 'id_quarto');
    }

    showToast('Reserva cancelada.');
    renderReservas();
  } catch (err) {
    showToast('Erro: ' + err.message, 'error');
  }
}
