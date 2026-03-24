// ============================================
// Hóspedes Page — Cardoso Palace Hotel
// ============================================

let allHospedes = [];

async function renderHospedes() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Hóspedes</h1>
        <p class="page-subtitle">Registro completo de hóspedes do hotel</p>
      </div>
      <button class="btn btn-primary" onclick="openAddHospedeModal()">
        <span class="material-icons">person_add</span> Adicionar Novo Hóspede
      </button>
    </div>
    <div class="filters-bar">
      <div class="search-wrapper">
        <span class="material-icons">search</span>
        <input type="text" id="hospede-search" placeholder="Buscar por nome, CPF ou e-mail..." oninput="filterHospedes()">
      </div>
    </div>
    <div class="table-card">
      <div id="hospedes-table">
        <div class="loading"><div class="spinner"></div></div>
      </div>
    </div>
  `;

  try {
    allHospedes = await supabase.select('dados_hotel', 'select=*&order=id.desc');
    renderHospedesTable(allHospedes);
  } catch (err) {
    console.error('Hóspedes error:', err);
    document.getElementById('hospedes-table').innerHTML = `
      <div class="empty-state"><span class="material-icons">error</span><p>Erro: ${err.message}</p></div>
    `;
  }
}

function filterHospedes() {
  const search = document.getElementById('hospede-search').value.toLowerCase();
  const filtered = allHospedes.filter(h => {
    const nome = (h.nomewpp || '').toLowerCase();
    const cpf = (h.cpf || '').toLowerCase();
    const email = (h.email || '').toLowerCase();
    return nome.includes(search) || cpf.includes(search) || email.includes(search);
  });
  renderHospedesTable(filtered);
}

function renderHospedesTable(data) {
  if (data.length === 0) {
    document.getElementById('hospedes-table').innerHTML = `
      <div class="empty-state"><span class="material-icons">person_off</span><p>Nenhum hóspede encontrado</p></div>
    `;
    return;
  }

  document.getElementById('hospedes-table').innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>CPF</th>
          <th>E-mail</th>
          <th>Telefone</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(h => `
          <tr>
            <td><div class="name-cell">${getAvatar(h.nomewpp)}<span>${h.nomewpp || '—'}</span></div></td>
            <td>${h.cpf || '—'}</td>
            <td>${h.email || '—'}</td>
            <td>${h.telefone || '—'}</td>
            <td class="actions-cell">
              <button class="btn btn-secondary btn-sm" onclick="openHistoricoModal(${h.id})">
                <span class="material-icons">history</span> Histórico
              </button>
              <button class="btn-icon" title="Excluir" onclick="deleteHospede(${h.id}, '${(h.nomewpp || '').replace(/'/g, "\\'")}')">
                <span class="material-icons" style="color:var(--danger)">delete</span>
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function openAddHospedeModal() {
  openModal(`
    <div class="modal-header">
      <h3>Adicionar Novo Hóspede</h3>
      <button class="btn-icon" onclick="closeModal()"><span class="material-icons">close</span></button>
    </div>
    <form class="modal-form" onsubmit="submitAddHospede(event)">
      <div class="form-row">
        <div><label>Nome Completo</label><input class="form-control" id="h-nome" required></div>
        <div><label>CPF</label><input class="form-control" id="h-cpf" required></div>
      </div>
      <div class="form-row">
        <div><label>E-mail</label><input type="email" class="form-control" id="h-email"></div>
        <div><label>Telefone</label><input class="form-control" id="h-telefone"></div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary"><span class="material-icons">save</span> Adicionar</button>
      </div>
    </form>
  `);
}

async function submitAddHospede(e) {
  e.preventDefault();
  try {
    await supabase.insert('dados_hotel', {
      nomewpp: document.getElementById('h-nome').value.trim(),
      cpf: document.getElementById('h-cpf').value.trim(),
      email: document.getElementById('h-email').value.trim() || null,
      telefone: document.getElementById('h-telefone').value.trim() || null
    });
    closeModal();
    showToast('Hóspede adicionado com sucesso!');
    renderHospedes();
  } catch (err) {
    showToast('Erro: ' + err.message, 'error');
  }
}

async function openHistoricoModal(hospedeId) {
  const h = allHospedes.find(x => x.id === hospedeId);
  if (!h) return;

  openModal(`
    <div class="modal-header">
      <h3>Histórico — ${h.nomewpp || 'Hóspede'}</h3>
      <button class="btn-icon" onclick="closeModal()"><span class="material-icons">close</span></button>
    </div>
    <div id="historico-content"><div class="loading"><div class="spinner"></div></div></div>
  `);

  try {
    const reservas = await supabase.select('reservas', `select=*,quartos(tipo,preco,numero_quarto)&cliente_id=eq.${hospedeId}&order=created_at.desc`);

    const container = document.getElementById('historico-content');
    if (reservas.length === 0) {
      container.innerHTML = `<div class="empty-state"><span class="material-icons">event_busy</span><p>Nenhuma reserva encontrada para este hóspede</p></div>`;
      return;
    }

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Tipo Quarto</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Status</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          ${reservas.map(r => {
      const tipo = r.quartos?.tipo || '—';
      const preco = r.quartos?.preco || 0;
      const days = r.check_in && r.check_out
        ? Math.max(1, Math.ceil((new Date(r.check_out) - new Date(r.check_in)) / 86400000))
        : 1;
      return `
              <tr>
                <td>${tipo}</td>
                <td>${formatDate(r.check_in)}</td>
                <td>${formatDate(r.check_out)}</td>
                <td>${statusBadge(r.status)}</td>
                <td>${formatCurrency(preco * days)}</td>
              </tr>`;
    }).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    document.getElementById('historico-content').innerHTML = `
      <div class="empty-state"><span class="material-icons">error</span><p>Erro: ${err.message}</p></div>
    `;
  }
}

async function deleteHospede(id, nome) {
  if (!confirm(`Atenção: Excluir o hóspede "${nome}" removerá também todas as suas reservas associadas.\nDeseja realmente continuar?`)) {
    return;
  }

  try {
    // Delete associated reservations first to avoid foreign key errors (unless cascade is configured)
    await supabase.delete('reservas', id, 'cliente_id');

    // Delete the guest
    await supabase.delete('dados_hotel', id, 'id');

    showToast('Hóspede e reservas relacionadas excluídos com sucesso!');
    renderHospedes();
  } catch (err) {
    console.error('Delete guest error:', err);
    showToast('Erro ao excluir hóspede: ' + err.message, 'error');
  }
}
