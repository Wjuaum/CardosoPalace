// ============================================
// Quartos Page — Cardoso Palace Hotel
// ============================================

let allQuartosData = [];
let currentRoomFilter = ''; // maintain state

async function renderQuartos() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Quartos</h1>
        <p class="page-subtitle">Gerencie os quartos do hotel</p>
      </div>
      <button class="btn btn-primary" onclick="openAddQuartoModal()">
        <span class="material-icons">add</span> Adicionar Novo Quarto
      </button>
    </div>
    <div class="filters-bar">
      <div class="filter-tabs" id="quartos-filter-tabs">
        <!-- Re-render filter tabs dynamically so we can set 'active' based on state -->
      </div>
    </div>
    <div class="rooms-grid" id="rooms-grid">
      <div class="loading"><div class="spinner"></div></div>
    </div>
  `;

  try {
    const data = await supabase.select('quartos', 'select=*');
    // Sort numerically on the frontend to avoid "1, 10, 11, 2" string sorting issues
    allQuartosData = data.sort((a, b) => {
      const numA = parseInt(a.numero_quarto, 10) || 0;
      const numB = parseInt(b.numero_quarto, 10) || 0;
      return numA - numB;
    });
    // Render tabs using current state
    const tabsContainer = document.getElementById('quartos-filter-tabs');
    tabsContainer.innerHTML = `
      <button class="filter-tab ${currentRoomFilter === '' ? 'active' : ''}" data-filter="" onclick="filterQuartos(this)">Todos</button>
      <button class="filter-tab ${currentRoomFilter.toLowerCase() === 'disponível' ? 'active' : ''}" data-filter="Disponível" onclick="filterQuartos(this)">Disponível</button>
      <button class="filter-tab ${currentRoomFilter.toLowerCase() === 'ocupado' ? 'active' : ''}" data-filter="Ocupado" onclick="filterQuartos(this)">Ocupado</button>
      <button class="filter-tab ${currentRoomFilter.toLowerCase() === 'manutenção' ? 'active' : ''}" data-filter="Manutenção" onclick="filterQuartos(this)">Manutenção</button>
    `;

    applyCurrentRoomFilter();
  } catch (err) {
    console.error('Quartos error:', err);
    document.getElementById('rooms-grid').innerHTML = `
      <div class="empty-state"><span class="material-icons">error</span><p>Erro: ${err.message}</p></div>
    `;
  }
}

function applyCurrentRoomFilter() {
  const filtered = currentRoomFilter
    ? allQuartosData.filter(q => (q.status || '').toLowerCase() === currentRoomFilter.toLowerCase())
    : allQuartosData;
  renderQuartosGrid(filtered);
}

function filterQuartos(btn) {
  document.querySelectorAll('#quartos-filter-tabs .filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  currentRoomFilter = btn.dataset.filter || '';
  applyCurrentRoomFilter();
}

function renderQuartosGrid(data) {
  if (data.length === 0) {
    document.getElementById('rooms-grid').innerHTML = `
      <div class="empty-state"><span class="material-icons">bed</span><p>Nenhum quarto encontrado</p></div>
    `;
    return;
  }

  const roomImages = {
    'Standard': 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=400&q=80',
    'Deluxe': 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=400&q=80',
    'Suite': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&q=80',
    'Presidencial': 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=400&q=80',
    'Familiar': 'https://images.unsplash.com/photo-1566195992011-5f6b21e539aa?auto=format&fit=crop&w=400&q=80'
  };

  document.getElementById('rooms-grid').innerHTML = data.map(q => {
    const img = roomImages[q.tipo] || roomImages['Standard'];
    return `
      <div class="room-card">
        <div class="room-card-image" style="background-image: url('${img}')">
          <div class="room-status-badge">${roomStatusBadge(q.status || 'Disponível')}</div>
        </div>
        <div class="room-content">
          <div class="room-number">Quarto ${q.numero_quarto || '—'}</div>
          <div class="room-type">${q.tipo || 'Padrão'}</div>
          
          <div class="room-features">
            <div class="room-feature"><span class="material-icons">group</span>${q.capacidade || 2} Pessoas</div>
            <div class="room-feature"><span class="material-icons">aspect_ratio</span>${q.tipo === 'Standard' ? '25' : '45'}m²</div>
          </div>

          <div class="room-footer">
            <div class="room-price-tag">${formatCurrency(q.preco)}<small>/noite</small></div>
            <div class="room-actions">
              <button class="btn-icon" title="Ver Detalhes" onclick="openQuartoDetailsModal(${q.id_quarto})"><span class="material-icons">visibility</span></button>
              <button class="btn-icon" title="Editar" onclick="openEditQuartoModal(${q.id_quarto})"><span class="material-icons">edit</span></button>
              <button class="btn-icon" title="Excluir" style="color:var(--danger);" onclick="deleteQuarto(${q.id_quarto}, '${q.numero_quarto}')"><span class="material-icons">delete</span></button>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');
}

async function deleteQuarto(id, numero) {
  if (!confirm(`Atenção: Excluir o Quarto ${numero} removerá também todas as reservas associadas a ele.\nDeseja realmente excluir este quarto?`)) {
    return;
  }

  try {
    // Delete associated reservations first to avoid foreign key errors
    await supabase.delete('reservas', id, 'quarto_id');
    // Delete the room
    await supabase.delete('quartos', id, 'id_quarto');

    showToast('Quarto excluído com sucesso!');
    renderQuartos();
  } catch (err) {
    console.error('Delete room error:', err);
    showToast('Erro ao excluir quarto: ' + err.message, 'error');
  }
}

function openAddQuartoModal() {
  openModal(`
    <div class="modal-header">
      <h3>Adicionar Novo Quarto</h3>
      <button class="btn-icon" onclick="closeModal()"><span class="material-icons">close</span></button>
    </div>
    <form class="modal-form" onsubmit="submitAddQuarto(event)">
      <div class="form-row">
        <div><label>Número do Quarto</label><input class="form-control" id="q-numero" required></div>
        <div><label>Tipo</label>
          <select class="form-control" id="q-tipo">
            <option>Standard</option>
            <option>Deluxe</option>
            <option>Suite</option>
            <option>Presidencial</option>
            <option>Familiar</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div><label>Capacidade</label><input type="number" class="form-control" id="q-capacidade" value="2" min="1" max="10" required></div>
        <div><label>Preço / Noite (R$)</label><input type="number" step="0.01" class="form-control" id="q-preco" required></div>
      </div>
      <div>
        <label>Status</label>
        <select class="form-control" id="q-status">
          <option>Disponível</option>
          <option>Ocupado</option>
          <option>Manutenção</option>
        </select>
      </div>
      <div>
        <label>Descrição (opcional)</label>
        <textarea class="form-control" id="q-desc" rows="2"></textarea>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary"><span class="material-icons">save</span> Adicionar</button>
      </div>
    </form>
  `);
}

async function submitAddQuarto(e) {
  e.preventDefault();
  try {
    await supabase.insert('quartos', {
      numero_quarto: document.getElementById('q-numero').value.trim(),
      tipo: document.getElementById('q-tipo').value,
      capacidade: parseInt(document.getElementById('q-capacidade').value),
      preco: parseFloat(document.getElementById('q-preco').value),
      status: document.getElementById('q-status').value,
      description: document.getElementById('q-desc').value.trim() || null
    });
    closeModal();
    showToast('Quarto adicionado com sucesso!');
    renderQuartos();
  } catch (err) {
    showToast('Erro: ' + err.message, 'error');
  }
}

function openQuartoDetailsModal(id) {
  const q = allQuartosData.find(x => x.id_quarto === id);
  if (!q) return;
  openModal(`
    <div class="modal-header">
      <h3>Quarto ${q.numero_quarto}</h3>
      <button class="btn-icon" onclick="closeModal()"><span class="material-icons">close</span></button>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="stat-card">
          <div class="stat-icon blue"><span class="material-icons">king_bed</span></div>
          <div class="stat-info"><h3 style="font-size:16px;">${q.tipo || 'Padrão'}</h3><span class="stat-label">Tipo</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green"><span class="material-icons">group</span></div>
          <div class="stat-info"><h3 style="font-size:16px;">${q.capacidade || 2}</h3><span class="stat-label">Capacidade</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange"><span class="material-icons">payments</span></div>
          <div class="stat-info"><h3 style="font-size:16px;">${formatCurrency(q.preco)}</h3><span class="stat-label">Diária</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-info"><h3 style="font-size:14px;">${roomStatusBadge(q.status || 'Disponível')}</h3><span class="stat-label">Status</span></div>
        </div>
      </div>
      ${q.description ? `<p style="color:var(--text-secondary);font-size:14px;">${q.description}</p>` : ''}
    </div>
  `);
}

function openEditQuartoModal(id) {
  const q = allQuartosData.find(x => x.id_quarto === id);
  if (!q) return;
  openModal(`
    <div class="modal-header">
      <h3>Editar Quarto ${q.numero_quarto}</h3>
      <button class="btn-icon" onclick="closeModal()"><span class="material-icons">close</span></button>
    </div>
    <form class="modal-form" onsubmit="submitEditQuarto(event, ${id})">
      <div class="form-row">
        <div><label>Número</label><input class="form-control" id="eq-numero" value="${q.numero_quarto || ''}" required></div>
        <div><label>Tipo</label>
          <select class="form-control" id="eq-tipo">
            ${['Standard', 'Deluxe', 'Suite', 'Presidencial', 'Familiar'].map(t =>
    `<option ${q.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div><label>Capacidade</label><input type="number" class="form-control" id="eq-capacidade" value="${q.capacidade || 2}" min="1" max="10" required></div>
        <div><label>Preço / Noite (R$)</label><input type="number" step="0.01" class="form-control" id="eq-preco" value="${q.preco || ''}" required></div>
      </div>
      <div>
        <label>Status</label>
        <select class="form-control" id="eq-status">
          ${['Disponível', 'Ocupado', 'Manutenção'].map(s =>
      `<option ${(q.status || '').toLowerCase() === s.toLowerCase() ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
      <div>
        <label>Descrição</label>
        <textarea class="form-control" id="eq-desc" rows="2">${q.description || ''}</textarea>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary"><span class="material-icons">save</span> Salvar</button>
      </div>
    </form>
  `);
}

async function submitEditQuarto(e, id) {
  e.preventDefault();
  try {
    await supabase.update('quartos', id, {
      numero_quarto: document.getElementById('eq-numero').value.trim(),
      tipo: document.getElementById('eq-tipo').value,
      capacidade: parseInt(document.getElementById('eq-capacidade').value),
      preco: parseFloat(document.getElementById('eq-preco').value),
      status: document.getElementById('eq-status').value,
      description: document.getElementById('eq-desc').value.trim() || null
    }, 'id_quarto');
    closeModal();
    showToast('Quarto atualizado!');
    renderQuartos();
  } catch (err) {
    showToast('Erro: ' + err.message, 'error');
  }
}
