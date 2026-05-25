// ── COLE AQUI A SUA CONFIGURAÇÃO DO FIREBASE ────────────────
// Siga o guia em README.md para obter esses valores.
// Depois de colar, remova esta linha de comentário.
const FIREBASE_CONFIG = {
  apiKey:           "AIzaSyD2lRbR5TsZw5fUZi7e7sYwA2hs4SLORgs",
  authDomain:       "guilda-poe2.firebaseapp.com",
  projectId:        "guilda-poe2",
  storageBucket:     "guilda-poe2.firebasestorage.app",
  messagingSenderId: "727385900218",
  appId:            "1:727385900218:web:0f3fb2e51a58cc18ad2e83",
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD2lRbR5TsZw5fUZi7e7sYwA2hs4SLORgs",
  authDomain: "guilda-poe2.firebaseapp.com",
  projectId: "guilda-poe2",
  storageBucket: "guilda-poe2.firebasestorage.app",
  messagingSenderId: "727385900218",
  appId: "1:727385900218:web:0f3fb2e51a58cc18ad2e83",
  measurementId: "G-H3M3MPVZL4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// ────────────────────────────────────────────────────────────

import { initializeApp }                          from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc,
         getDocs, doc, updateDoc, deleteDoc,
         onSnapshot, serverTimestamp, query,
         orderBy }                                from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── ESTADO ──────────────────────────────────────────────────
let db            = null;
let editingId     = null;
let allMembers    = [];
let unsubscribe   = null;
const COLLECTION  = "members";
const LS_KEY      = "poe2_guilda_members";
const configured  = FIREBASE_CONFIG.apiKey !== "COLE_AQUI";

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  if (configured) {
    initFirebase();
  } else {
    setStatus("offline", "Firebase não configurado — modo local");
    loadFromLocalStorage();
    showConfigGuide();
  }
  switchTab("members", document.getElementById("tab-members"));
});

function initFirebase() {
  try {
    const app = initializeApp(FIREBASE_CONFIG);
    db = getFirestore(app);
    setStatus("connecting", "Conectando...");
    listenMembers();
  } catch (e) {
    console.error(e);
    setStatus("offline", "Erro ao conectar — modo local");
    loadFromLocalStorage();
  }
}

// ── FIRESTORE — escuta em tempo real ─────────────────────────
function listenMembers() {
  if (unsubscribe) unsubscribe();
  const q = query(collection(db, COLLECTION), orderBy("joinedAt", "asc"));
  unsubscribe = onSnapshot(q,
    (snap) => {
      setStatus("online", `Online — ${snap.size} membro${snap.size !== 1 ? "s" : ""}`);
      allMembers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      filterMembers();
    },
    (err) => {
      console.error(err);
      setStatus("offline", "Sem conexão — exibindo dados locais");
      loadFromLocalStorage();
    }
  );
}

// ── LOCALSTORE fallback ───────────────────────────────────────
function loadFromLocalStorage() {
  try { allMembers = JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
  catch { allMembers = []; }
  filterMembers();
}

function saveLocalStorage() {
  localStorage.setItem(LS_KEY, JSON.stringify(allMembers));
}

// ── STATUS BAR ────────────────────────────────────────────────
function setStatus(state, text) {
  const el = document.getElementById("fb-status");
  el.className = "fb-status fb-" + (state === "connecting" ? "connecting" : state === "online" ? "online" : "offline");
  document.getElementById("fb-status-text").textContent = text;
}

// ── TABS ──────────────────────────────────────────────────────
window.switchTab = function(tab, el) {
  document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  document.getElementById("panel-" + tab).classList.add("active");
  el.classList.add("active");
  if (tab === "members") filterMembers();
};

// ── REGISTRAR ─────────────────────────────────────────────────
window.registerMember = async function() {
  const nick     = v("reg-nick");
  const nome     = v("reg-nome");
  const plat     = v("reg-plataforma");
  const classe   = v("reg-classe");
  const horario  = v("reg-horario");
  const build    = v("reg-build");

  hideAlerts();

  if (!nick || !nome || !plat || !classe || !horario) {
    showAlert("error", "Preencha todos os campos obrigatórios.");
    return;
  }

  if (allMembers.find(m => m.nick.toLowerCase() === nick.toLowerCase())) {
    showAlert("error", "Este nick já está registrado nos pergaminhos!");
    return;
  }

  const member = { nick, nome, plataforma: plat, classe, horario, build, joinedAt: Date.now() };

  if (db) {
    try {
      await addDoc(collection(db, COLLECTION), { ...member, joinedAt: serverTimestamp() });
      showAlert("success", `"${nick}" foi gravado nos pergaminhos!`);
      clearForm();
    } catch (e) {
      console.error(e);
      showAlert("error", "Erro ao salvar. Tente novamente.");
    }
  } else {
    member.id = Date.now().toString();
    allMembers.push(member);
    saveLocalStorage();
    filterMembers();
    showAlert("success", `"${nick}" foi gravado (modo local)!`);
    clearForm();
  }
};

window.clearForm = function() {
  ["reg-nick","reg-nome","reg-build"].forEach(id => { document.getElementById(id).value = ""; });
  ["reg-plataforma","reg-classe","reg-horario"].forEach(id => { document.getElementById(id).value = ""; });
  hideAlerts();
};

// ── LISTAR ────────────────────────────────────────────────────
window.filterMembers = function() {
  const q = (document.getElementById("search-input")?.value || "").toLowerCase();
  const filtered = allMembers.filter(m =>
    [m.nick, m.nome, m.plataforma, m.classe, m.horario, m.build].some(f =>
      (f || "").toLowerCase().includes(q)
    )
  );
  renderMembers(filtered);
};

function renderMembers(list) {
  const n = list.length;
  document.getElementById("member-count").innerHTML =
    `<span>${n}</span> exilado${n !== 1 ? "s" : ""} registrado${n !== 1 ? "s" : ""}`;

  const el = document.getElementById("member-list");

  if (n === 0) {
    el.innerHTML = `<div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style="margin:0 auto;opacity:.3;display:block">
        <path d="M24 4L40 14V34L24 44L8 34V14L24 4Z" stroke="#8a6a30" stroke-width="1.5"/>
        <circle cx="24" cy="22" r="8" stroke="#8a6a30" stroke-width="1.5"/>
      </svg>
      <p>${document.getElementById("search-input")?.value ? "Nenhum exilado encontrado." : "Nenhum membro registrado ainda."}</p>
    </div>`;
    return;
  }

  const pc = p => p === "PC" ? "platform-pc" : p === "PS5" ? "platform-ps5" : "platform-xbox";

  const rows = list.map(m => `
    <tr>
      <td><span class="member-nick">${esc(m.nick)}</span></td>
      <td><span class="member-name">${esc(m.nome)}</span></td>
      <td><span class="platform-badge ${pc(m.plataforma)}">${esc(m.plataforma)}</span></td>
      <td><span class="class-badge">${esc(m.classe || "—")}</span></td>
      <td><span class="horario-text">${esc(m.horario || "—")}</span></td>
      <td><span class="member-build">${esc(m.build || "—")}</span></td>
      <td>
        <div class="member-actions">
          <button class="btn btn-edit"   onclick="openEdit('${m.id}')">Editar</button>
          <button class="btn btn-danger" onclick="deleteMember('${m.id}','${esc(m.nick)}')">Remover</button>
        </div>
      </td>
    </tr>`).join("");

  el.innerHTML = `
    <table class="member-table">
      <thead><tr>
        <th>Nick</th><th>Nome</th><th>Plataforma</th>
        <th>Classe</th><th>Horário</th><th>Build</th><th></th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ── EDITAR ────────────────────────────────────────────────────
window.openEdit = function(id) {
  const m = allMembers.find(x => x.id === id);
  if (!m) return;
  editingId = id;
  document.getElementById("edit-nick").value       = m.nick || "";
  document.getElementById("edit-nome").value       = m.nome || "";
  document.getElementById("edit-plataforma").value = m.plataforma || "";
  document.getElementById("edit-classe").value     = m.classe || "";
  document.getElementById("edit-horario").value    = m.horario || "";
  document.getElementById("edit-build").value      = m.build || "";
  document.getElementById("modal-alert").classList.remove("show");
  document.getElementById("modal-overlay").classList.add("show");
};

window.closeModal = function(e) {
  if (!e || e.target === document.getElementById("modal-overlay") || e.target === undefined) {
    document.getElementById("modal-overlay").classList.remove("show");
    editingId = null;
  }
};

window.saveEdit = async function() {
  const nick    = v("edit-nick");
  const nome    = v("edit-nome");
  const plat    = v("edit-plataforma");
  const classe  = v("edit-classe");
  const horario = v("edit-horario");
  const build   = v("edit-build");

  document.getElementById("modal-alert").classList.remove("show");

  if (!nick || !nome || !plat || !classe || !horario) {
    document.getElementById("modal-alert-msg").textContent = "Preencha todos os campos obrigatórios.";
    document.getElementById("modal-alert").classList.add("show");
    return;
  }

  if (allMembers.find(m => m.nick.toLowerCase() === nick.toLowerCase() && m.id !== editingId)) {
    document.getElementById("modal-alert-msg").textContent = "Este nick já pertence a outro membro!";
    document.getElementById("modal-alert").classList.add("show");
    return;
  }

  const data = { nick, nome, plataforma: plat, classe, horario, build };

  if (db) {
    try {
      await updateDoc(doc(db, COLLECTION, editingId), data);
      closeModal({});
    } catch (e) { console.error(e); }
  } else {
    const idx = allMembers.findIndex(m => m.id === editingId);
    if (idx !== -1) allMembers[idx] = { ...allMembers[idx], ...data };
    saveLocalStorage();
    filterMembers();
    closeModal({});
  }
};

// ── DELETAR ───────────────────────────────────────────────────
window.deleteMember = async function(id, nick) {
  if (!confirm(`Remover "${nick}" dos pergaminhos da guilda?`)) return;
  if (db) {
    try { await deleteDoc(doc(db, COLLECTION, id)); }
    catch (e) { console.error(e); }
  } else {
    allMembers = allMembers.filter(m => m.id !== id);
    saveLocalStorage();
    filterMembers();
  }
};

// ── GUIA DE CONFIGURAÇÃO ──────────────────────────────────────
function showConfigGuide() {
  const container = document.querySelector(".container");
  const nav = document.querySelector(".nav-tabs");
  const guide = document.createElement("div");
  guide.className = "config-card";
  guide.innerHTML = `
    <h2>⚙ Configure o Firebase para ativar modo online</h2>
    <p>O site está funcionando em <strong>modo local</strong> (dados só no seu navegador). Para que todos os amigos vejam os dados em tempo real, siga os passos abaixo:</p>
    <ol>
      <li>Acesse <strong>console.firebase.google.com</strong> e faça login com Google</li>
      <li>Clique em <strong>Adicionar projeto</strong> → dê um nome → conclua</li>
      <li>No menu lateral, clique em <strong>Firestore Database</strong> → <strong>Criar banco de dados</strong> → escolha <strong>Modo de teste</strong></li>
      <li>Ainda no menu lateral, clique em <strong>Visão geral do projeto</strong> → ícone <strong>&lt;/&gt;</strong> (Web) → registre o app</li>
      <li>Copie o objeto <code>firebaseConfig</code> que aparecer e cole no início do arquivo <strong>app.js</strong>, substituindo os valores <em>COLE_AQUI</em></li>
    </ol>
    <code>const FIREBASE_CONFIG = {
  apiKey:            "AIzaSy...",
  authDomain:        "seu-projeto.firebaseapp.com",
  projectId:         "seu-projeto",
  storageBucket:     "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123:web:abc"
};</code>
    <div class="config-warn">⚠ Após editar o app.js, faça upload do arquivo atualizado no GitHub — o site vai conectar automaticamente.</div>`;
  container.insertBefore(guide, nav);
}

// ── UTILS ─────────────────────────────────────────────────────
function v(id) { return (document.getElementById(id)?.value || "").trim(); }

function esc(s) {
  return (s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

function showAlert(type, msg) {
  hideAlerts();
  const [id, msgId] = type === "success"
    ? ["alert-success","alert-msg"] : ["alert-error","alert-err-msg"];
  document.getElementById(msgId).textContent = msg;
  const el = document.getElementById(id);
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 5000);
}

function hideAlerts() {
  ["alert-success","alert-error"].forEach(id =>
    document.getElementById(id).classList.remove("show"));
}
