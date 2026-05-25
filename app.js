// ===== STORAGE =====
const STORAGE_KEY = 'poe2_guilda_members';

function loadMembers() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveMembers(members) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}

// ===== STATE =====
let editingId = null;

// ===== TABS =====
function switchTab(tab, el) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + tab).classList.add('active');
  el.classList.add('active');
  if (tab === 'members') renderMembers();
}

// ===== REGISTER =====
function registerMember() {
  const nick = document.getElementById('reg-nick').value.trim();
  const nome = document.getElementById('reg-nome').value.trim();
  const plat = document.getElementById('reg-plataforma').value;

  hideAlerts();

  if (!nick || !nome || !plat) {
    showAlert('error', 'Preencha todos os campos obrigatórios.');
    return;
  }

  const members = loadMembers();

  if (members.find(m => m.nick.toLowerCase() === nick.toLowerCase())) {
    showAlert('error', 'Este nick já está registrado nos pergaminhos!');
    return;
  }

  members.push({
    id: Date.now().toString(),
    nick, nome,
    plataforma: plat,
    joinedAt: new Date().toISOString()
  });

  saveMembers(members);
  showAlert('success', `"${nick}" foi gravado nos pergaminhos da guilda!`);
  clearForm();
}

function clearForm() {
  ['reg-nick','reg-nome'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('reg-plataforma').value = '';
  hideAlerts();
}

function showAlert(type, msg) {
  hideAlerts();
  const id   = type === 'success' ? 'alert-success' : 'alert-error';
  const msgId = type === 'success' ? 'alert-msg' : 'alert-err-msg';
  document.getElementById(msgId).textContent = msg;
  const el = document.getElementById(id);
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 4500);
}

function hideAlerts() {
  ['alert-success','alert-error'].forEach(id =>
    document.getElementById(id).classList.remove('show'));
}

// ===== MEMBERS LIST =====
function renderMembers() {
  const members = loadMembers();
  const query = (document.getElementById('search-input')?.value || '').toLowerCase();

  const filtered = members.filter(m =>
    m.nick.toLowerCase().includes(query) ||
    m.nome.toLowerCase().includes(query) ||
    m.plataforma.toLowerCase().includes(query)
  );

  document.getElementById('member-count').innerHTML =
    `<span>${filtered.length}</span> exilado${filtered.length !== 1 ? 's' : ''} registrado${filtered.length !== 1 ? 's' : ''}`;

  const listEl = document.getElementById('member-list');

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 4L40 14V34L24 44L8 34V14L24 4Z" stroke="#8a6a30" stroke-width="1.5"/>
          <circle cx="24" cy="22" r="8" stroke="#8a6a30" stroke-width="1.5"/>
        </svg>
        <p>${query ? 'Nenhum exilado encontrado para esta busca.' : 'Nenhum membro registrado ainda.'}</p>
      </div>`;
    return;
  }

  const platformClass = p =>
    p === 'PC' ? 'platform-pc' : p === 'PS5' ? 'platform-ps5' : 'platform-xbox';

  const rows = filtered.map(m => `
    <div class="member-row">
      <div class="member-nick">${escHtml(m.nick)}</div>
      <div class="member-name">${escHtml(m.nome)}</div>
      <div><span class="platform-badge ${platformClass(m.plataforma)}">${escHtml(m.plataforma)}</span></div>
      <div class="member-actions">
        <button class="btn btn-edit" onclick="openEdit('${m.id}')">Editar</button>
        <button class="btn btn-danger" onclick="deleteMember('${m.id}','${escHtml(m.nick)}')">Remover</button>
      </div>
    </div>`).join('');

  listEl.innerHTML = `
    <div class="member-row header-row">
      <div>Nick</div><div>Nome</div><div>Plataforma</div><div></div>
    </div>
    <div class="member-grid">${rows}</div>`;
}

function escHtml(str) {
  return str
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ===== EDIT =====
function openEdit(id) {
  const member = loadMembers().find(m => m.id === id);
  if (!member) return;
  editingId = id;
  document.getElementById('edit-nick').value = member.nick;
  document.getElementById('edit-nome').value = member.nome;
  document.getElementById('edit-plataforma').value = member.plataforma;
  document.getElementById('modal-alert').classList.remove('show');
  document.getElementById('modal-overlay').classList.add('show');
}

function closeModal(e) {
  if (!e || e.target === document.getElementById('modal-overlay') || !e.currentTarget) {
    document.getElementById('modal-overlay').classList.remove('show');
    editingId = null;
  }
}

function saveEdit() {
  const nick = document.getElementById('edit-nick').value.trim();
  const nome = document.getElementById('edit-nome').value.trim();
  const plat = document.getElementById('edit-plataforma').value;

  document.getElementById('modal-alert').classList.remove('show');

  if (!nick || !nome || !plat) {
    document.getElementById('modal-alert-msg').textContent = 'Preencha todos os campos.';
    document.getElementById('modal-alert').classList.add('show');
    return;
  }

  const members = loadMembers();
  if (members.find(m => m.nick.toLowerCase() === nick.toLowerCase() && m.id !== editingId)) {
    document.getElementById('modal-alert-msg').textContent = 'Este nick já pertence a outro membro!';
    document.getElementById('modal-alert').classList.add('show');
    return;
  }

  const idx = members.findIndex(m => m.id === editingId);
  if (idx === -1) return;
  members[idx] = { ...members[idx], nick, nome, plataforma: plat };
  saveMembers(members);
  closeModal({});
  renderMembers();
}

// ===== DELETE =====
function deleteMember(id, nick) {
  if (!confirm(`Remover "${nick}" dos pergaminhos da guilda?`)) return;
  saveMembers(loadMembers().filter(m => m.id !== id));
  renderMembers();
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Abre aba membros por padrão
  const membersTab = document.getElementById('tab-members');
  if (membersTab) switchTab('members', membersTab);
});
