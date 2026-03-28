// ============================================================
// TravelCost — app.js — SPA Router + UI Logic
// ============================================================

let currentScreen = '';
let currentTripId = null;
let mapInstance = null;

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
  initData();
  initSupabase();
  setupRouter();
  setupEventListeners();
  setupOfflineDetection();
  const isLoggedIn = loadFromStorage('loggedIn');
  if (!isLoggedIn) {
    navigateTo('login');
  } else {
    navigateTo(getRouteFromHash() || 'home');
  }
});

// --- ROUTER ---
function setupRouter() {
  window.addEventListener('hashchange', () => {
    const route = getRouteFromHash();
    navigateTo(route);
  });
}

function getRouteFromHash() {
  const hash = window.location.hash.replace('#/', '') || 'home';
  return hash;
}

async function navigateTo(route) {
  const isLoggedIn = loadFromStorage('loggedIn');
  if (!isLoggedIn && route !== 'login') { route = 'login'; window.location.hash = '#/login'; }

  // Parse route params
  let screenId = route;
  let param = null;
  if (route.startsWith('viagem/')) { screenId = 'viagem-detalhe'; param = route.split('/')[1]; currentTripId = param; }
  else if (route.startsWith('despesas/')) { screenId = 'despesas'; param = route.split('/')[1]; currentTripId = param; }

  // Hide all screens
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('screen-' + screenId);
  if (target) { target.classList.add('active'); currentScreen = screenId; }
  else { document.getElementById('screen-home').classList.add('active'); currentScreen = 'home'; }

  // Update nav
  updateNav(screenId);
  updateTopBar(screenId);
  updateFab(screenId);

  // Render screen content
  await renderScreen(screenId, param);
  window.scrollTo(0, 0);
}

async function renderScreen(screenId, param) {
  switch(screenId) {
    case 'home': await renderHome(); break;
    case 'nova-viagem': renderNewTrip(); break;
    case 'viagem-detalhe': await renderTripDetail(param); break;
    case 'despesas': await renderExpenses(param); break;
    case 'viagens': await renderTrips(); break;
    case 'relatorios': await renderReports(); break;
    case 'perfil': renderProfile(); break;
  }
}

function updateNav(screenId) {
  document.querySelectorAll('.bottom-nav__item').forEach(item => {
    item.classList.toggle('active', item.dataset.nav === screenId || 
      (screenId === 'viagem-detalhe' && item.dataset.nav === 'viagens') ||
      (screenId === 'despesas' && item.dataset.nav === 'viagens'));
  });
  document.querySelectorAll('.top-bar__nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.nav === screenId);
  });
}

function updateTopBar(screenId) {
  const topBar = document.getElementById('topBar');
  const bottomNav = document.getElementById('bottomNav');
  if (screenId === 'login') { topBar.style.display = 'none'; bottomNav.style.display = 'none'; }
  else { topBar.style.display = ''; bottomNav.style.display = ''; }
}

function updateFab(screenId) {
  const fab = document.getElementById('mainFab');
  const label = document.getElementById('fabLabel');
  if (screenId === 'home') { fab.classList.remove('hidden'); label.textContent = 'Nova Viagem'; fab.onclick = () => { window.location.hash = '#/nova-viagem'; }; }
  else if (screenId === 'despesas') { fab.classList.remove('hidden'); label.textContent = 'Adicionar Despesa'; fab.onclick = () => openExpenseModal(currentTripId); }
  else { fab.classList.add('hidden'); }
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
  // Theme toggle
  document.getElementById('btnThemeToggle').addEventListener('click', toggleTheme);

  // Login form
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  
  document.getElementById('loginToggleBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    const btn = document.getElementById('loginBtnText');
    const toggle = document.getElementById('loginToggleText');
    const toggleBtn = document.getElementById('loginToggleBtn');
    if (btn.textContent === 'Entrar') { btn.textContent = 'Criar Conta'; toggle.textContent = 'Já tem conta?'; toggleBtn.textContent = 'Entrar'; }
    else { btn.textContent = 'Entrar'; toggle.textContent = 'Novo por aqui?'; toggleBtn.textContent = 'Criar Conta'; }
  });

  // Social login
  document.getElementById('btnGoogleLogin')?.addEventListener('click', handleGoogleLogin);
  document.getElementById('btnAppleLogin')?.addEventListener('click', () => showToast('Apple Login em breve!', 'warning'));

  // Welcome overlay
  document.getElementById('welcomeBtn').addEventListener('click', () => {
    document.getElementById('welcomeOverlay').classList.remove('active'); // Changed from 'open' to 'active'
    window.location.hash = '#/home';
  });

  // New trip form
  document.getElementById('newTripForm').addEventListener('submit', (e) => { e.preventDefault(); submitNewTrip(); });

  // Trip preview on budget change
  ['tripBudget', 'tripStartDate', 'tripEndDate', 'tripPeople'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateTripPreview);
  });

  // Expense form
  document.getElementById('expenseForm').addEventListener('submit', handleExpenseSubmit);
  document.getElementById('expAmount').addEventListener('input', updateExpensePreview);

  // Search trips
  document.getElementById('searchTrips').addEventListener('input', (e) => renderTrips(e.target.value));

  // Filter buttons
  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTrips(document.getElementById('searchTrips').value, btn.dataset.filter);
    });
  });

  // Cities datalist
  const dl1 = document.getElementById('citiesListOrigin');
  const dl2 = document.getElementById('citiesListDest');
  BR_CITIES.forEach(c => {
    dl1.innerHTML += `<option value="${c}">`;
    dl2.innerHTML += `<option value="${c}">`;
  });
}

// --- AUTH ---
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const isSignup = document.getElementById('loginBtnText').textContent === 'Criar Conta';
  const errorEl = document.getElementById('loginError');
  const errorText = document.getElementById('loginErrorText');

  errorEl.classList.add('hidden');

  if (isSupabaseConfigured()) {
    try {
      let result;
      if (isSignup) {
        result = await supabaseClient.auth.signUp({ email, password });
        if (result.error) throw result.error;
        showToast('Confirme seu e-mail para continuar!', 'success');
        return;
      } else {
        result = await supabaseClient.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
      }
      
      const user = result.data.user;
      updateUser({ email: user.email, name: user.email.split('@')[0], id: user.id });
    } catch (err) {
      errorText.textContent = err.message;
      errorEl.classList.remove('hidden');
      return;
    }
  } else {
    if (!email || password.length < 6) {
      errorText.textContent = 'Email e senha (min. 6 caracteres) obrigatórios.';
      errorEl.classList.remove('hidden');
      return;
    }
    updateUser({ email, name: email.split('@')[0] });
  }

  saveToStorage('loggedIn', true);
  finishAuth();
}

async function handleGoogleLogin() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname
      }
    });
    if (error) showToast('Erro Google: ' + error.message, 'error');
  } else {
    updateUser({ email: 'user@google.com', name: 'Viajante Google' });
    saveToStorage('loggedIn', true);
    finishAuth();
  }
}

function finishAuth() {
  const overlay = document.getElementById('welcomeOverlay');
  if (overlay) overlay.classList.add('active');
}

function handleLogout() {
  if (isSupabaseConfigured()) supabaseClient.auth.signOut();
  removeFromStorage('loggedIn');
  window.location.hash = '#/login';
  window.location.reload();
}

// --- THEME ---
function toggleTheme() {
  const html = document.documentElement;
  const newTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);
  updateUser({ theme: newTheme });
  destroyCharts();
  if (currentScreen === 'relatorios') renderReports();
}

// --- OFFLINE ---
function setupOfflineDetection() {
  window.addEventListener('offline', () => showToast('Você está offline. Dados locais disponíveis.', 'warning'));
  window.addEventListener('online', () => showToast('Conexão restaurada!', 'success'));
}

// --- TOAST ---
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: 'check_circle', error: 'error', warning: 'warning' };
  toast.innerHTML = `<span class="material-symbols-outlined icon-filled" style="font-size:1.25rem;">${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// --- MODAL ---
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function openExpenseModal(tripId, editId = null) {
  document.getElementById('expTripId').value = tripId;
  document.getElementById('expEditId').value = editId || '';
  document.getElementById('expDate').value = new Date().toISOString().split('T')[0];
  if (editId) {
    const exp = getExpenses().find(e => e.id === editId);
    if (exp) {
      document.getElementById('expCategory').value = exp.category;
      document.getElementById('expAmount').value = exp.amount;
      document.getElementById('expDate').value = exp.date;
      document.getElementById('expDescription').value = exp.description;
      document.getElementById('expSubmitText').textContent = 'Salvar';
    }
  } else {
    document.getElementById('expenseForm').reset();
    document.getElementById('expDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('expSubmitText').textContent = 'Adicionar';
  }
  updateExpensePreview();
  openModal('modalExpense');
}

function updateExpensePreview() {
  const tripId = document.getElementById('expTripId').value;
  const amount = parseFloat(document.getElementById('expAmount').value) || 0;
  const editId = document.getElementById('expEditId').value;
  let current = getTripTotal(tripId);
  if (editId) { const old = getExpenses().find(e => e.id === editId); if (old) current -= old.amount; }
  document.getElementById('expensePreviewTotal').textContent = formatCurrency(current + amount);
}

async function submitNewTrip() {
  const name = document.getElementById('tripName').value;
  const destination = document.getElementById('tripDestination').value;
  const startDate = document.getElementById('tripStartDate').value;
  const endDate = document.getElementById('tripEndDate').value;
  const budget = parseFloat(document.getElementById('tripBudget').value);
  const people = parseInt(document.getElementById('tripPeople').value);
  const description = document.getElementById('tripDescription').value;

  if (!name || !destination || !startDate || !endDate || isNaN(budget)) {
    showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
    return;
  }

  const trip = { 
    title: name, 
    destination, 
    start_date: startDate, 
    end_date: endDate, 
    budget, 
    status: 'planejando',
    description
  };
  
  await addTrip(trip);
  showToast('Viagem planejada com sucesso!', 'success');
  window.location.hash = '#/viagens';
}

async function submitExpense() {
  const tripId = document.getElementById('expTripId').value;
  const category = document.getElementById('expCategory').value;
  const amount = parseFloat(document.getElementById('expAmount').value);
  const date = document.getElementById('expDate').value;
  const description = document.getElementById('expDesc').value;

  if (isNaN(amount) || !date) {
    showToast('Valor e data são obrigatórios.', 'error');
    return;
  }

  const expense = { trip_id: tripId, category, amount, date, description };
  await addExpense(expense);
  closeModal('expenseModal');
  showToast('Despesa adicionada!', 'success');
  if (currentScreen === 'despesas') renderExpenses(tripId);
  else if (currentScreen === 'home') renderHome();
}

function handleExpenseSubmit(e) {
  e.preventDefault();
  const tripId = document.getElementById('expTripId').value;
  const editId = document.getElementById('expEditId').value;
  const data = {
    tripId,
    category: document.getElementById('expCategory').value,
    amount: parseFloat(document.getElementById('expAmount').value),
    date: document.getElementById('expDate').value,
    description: document.getElementById('expDescription').value,
    status: 'approved'
  };
  if (editId) { updateExpense(editId, data); showToast('Despesa atualizada!', 'success'); }
  else { addExpense(data); showToast('Despesa adicionada!', 'success'); }
  closeModal('modalExpense');
  renderExpenses(tripId);
}

function confirmDelete(title, text, callback) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmText').textContent = text;
  document.getElementById('confirmBtn').onclick = () => { callback(); closeModal('modalConfirm'); };
  openModal('modalConfirm');
}

// --- SHARE ---
function shareTrip(tripId) {
  const link = window.location.origin + window.location.pathname + '#/viagem/' + tripId;
  document.getElementById('shareLink').value = link;
  drawQR(link);
  openModal('modalShare');
}

function copyShareLink() {
  const input = document.getElementById('shareLink');
  navigator.clipboard.writeText(input.value).then(() => showToast('Link copiado!', 'success'));
}

function drawQR(text) {
  const canvas = document.getElementById('qrCanvas');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 180, 180);
  ctx.fillStyle = '#181c23'; ctx.font = '11px Inter';
  ctx.textAlign = 'center';
  ctx.fillText('QR Code', 90, 85);
  ctx.fillText('(Requer lib qrcode.js)', 90, 102);
}

// --- RENDER: HOME ---
async function renderHome() {
  const user = getUser();
  const monthlyTotal = await getMonthlyTotal();
  const yearlyTotal = await getYearlyTotal();
  const activeTripsCount = await getActiveTripsCount();
  const trips = await getTrips();
  const activeTrip = trips.find(t => t.status === 'active' || t.status === 'over') || trips[0];

  let activeTripHtml = '';
  if (activeTrip) {
    const spent = await getTripTotal(activeTrip.id);
    const pct = Math.round((spent / (activeTrip.budget || 1)) * 100);
    const st = getBudgetStatus(spent, activeTrip.budget);
    activeTripHtml = `
      <div class="card clickable-card mb-8" onclick="window.location.hash='#/viagem/${activeTrip.id}'">
        <div class="flex-between mb-4">
          <span class="chip chip-${st === 'danger' ? 'danger' : 'active'}">${STATUS[activeTrip.status]?.label}</span>
          <span class="label-sm text-muted">#-${activeTrip.id.substring(0,6)}</span>
        </div>
        <h2 class="title-md mb-2">${activeTrip.name || activeTrip.title}</h2>
        <p class="body-sm text-muted mb-6">${activeTrip.description || ''}</p>
        <div class="flex-between mb-2">
          <div class="flex-col">
            <span class="label-xs text-muted">ORÇAMENTO TOTAL</span>
            <span class="title-xs">${formatCurrency(activeTrip.budget)}</span>
          </div>
          <div class="flex-col text-right">
            <span class="label-xs text-muted">GASTO REAL</span>
            <span class="title-xs" style="color:var(--primary);">${formatCurrency(spent)}</span>
          </div>
        </div>
        <div class="flex-between mb-2 mt-4">
          <span class="label-xs font-bold">${pct}% DO ORÇAMENTO</span>
          <span class="label-xs font-bold" style="color:var(--secondary);">${formatCurrency(Math.max(0, activeTrip.budget - spent))} RESTANTES</span>
        </div>
        <div class="progress-bar">
          <div class="progress-bar__fill progress-bar__fill--${st === 'danger' ? 'danger' : st === 'warning' ? 'warning' : 'primary'}" style="width: ${Math.min(pct, 100)}%"></div>
        </div>
      </div>
    `;
  }
  
  const grid = document.getElementById('homeBentoGrid');
  grid.innerHTML = activeTripHtml;
}

// --- RENDER: NEW TRIP ---
function renderNewTrip() {
  document.getElementById('newTripForm').reset();
  document.getElementById('tripPreview').style.display = 'none';
}

function updateTripPreview() {
  const budget = parseFloat(document.getElementById('tripBudget').value);
  const people = parseInt(document.getElementById('tripPeople').value) || 1;
  const start = document.getElementById('tripStartDate').value;
  const end = document.getElementById('tripEndDate').value;
  const preview = document.getElementById('tripPreview');
  const content = document.getElementById('tripPreviewContent');
  if (!budget || !start || !end) { preview.style.display = 'none'; return; }
  const days = daysBetween(start, end) || 1;
  const perDay = budget / days;
  const perPerson = budget / people;
  preview.style.display = 'block';
  content.innerHTML = `
    <div class="stat-card"><span class="stat-card__label">Dias</span><span class="stat-card__value">${days}</span></div>
    <div class="stat-card"><span class="stat-card__label">Por Dia</span><span class="stat-card__value">${formatCurrency(perDay)}</span></div>
    <div class="stat-card"><span class="stat-card__label">Por Pessoa</span><span class="stat-card__value">${formatCurrency(perPerson)}</span></div>
    <div class="stat-card"><span class="stat-card__label">Orçamento</span><span class="stat-card__value">${formatCurrency(budget)}</span></div>`;
}

function handleNewTrip(e) {
  e.preventDefault();
  const trip = addTrip({
    name: document.getElementById('tripName').value,
    origin: document.getElementById('tripOrigin').value,
    destination: document.getElementById('tripDestination').value,
    startDate: document.getElementById('tripStartDate').value,
    endDate: document.getElementById('tripEndDate').value,
    budget: parseFloat(document.getElementById('tripBudget').value),
    numPeople: parseInt(document.getElementById('tripPeople').value) || 1,
    description: document.getElementById('tripDescription').value,
    status: 'planning',
    coverUrl: ''
  });
  showToast(`Viagem "${trip.name}" criada!`, 'success');
  window.location.hash = '#/viagem/' + trip.id;
}

// --- RENDER: TRIP DETAIL ---
async function renderTripDetail(tripId) {
  const trip = await getTripById(tripId);
  const el = document.getElementById('tripDetailContent');
  if (!trip) { el.innerHTML = '<p class="text-muted text-center mt-8">Viagem não encontrada.</p>'; return; }
  const spent = await getTripTotal(tripId);
  const pct = Math.round((spent/(trip.budget||1))*100);
  const status = getBudgetStatus(spent, trip.budget);
  const days = daysBetween(trip.start_date || trip.startDate, trip.end_date || trip.endDate);
  const itinerary = getItinerary()[tripId] || [];
  const coords = CITY_COORDS[trip.destination];

  el.innerHTML = `
    <div style="background:linear-gradient(135deg,var(--primary),var(--primary-container));border-radius:var(--radius-xl);padding:var(--space-8);color:white;margin-bottom:var(--space-6);position:relative;overflow:hidden;">
      <div style="position:absolute;top:0;right:0;width:200px;height:200px;background:rgba(255,255,255,0.05);border-radius:var(--radius-full);transform:translate(30%,-30%);"></div>
      <button class="btn-icon" onclick="window.location.hash='#/home'" style="color:white;margin-bottom:1rem;"><span class="material-symbols-outlined">arrow_back</span></button>
      <span class="chip" style="background:rgba(255,255,255,0.2);color:white;margin-bottom:0.5rem;">${STATUS[trip.status]?.label}</span>
      <h2 class="headline-lg" style="margin-bottom:0.25rem;">${trip.name || trip.title}</h2>
      <p style="opacity:0.8;">${trip.destination} • ${formatDateShort(trip.start_date || trip.startDate)} — ${formatDateShort(trip.end_date || trip.endDate)}</p>
      <div style="margin-top:1.5rem;display:flex;gap:1rem;">
        <button class="btn" style="background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.25);font-size:0.8rem;" onclick="window.location.hash='#/despesas/${tripId}'"><span class="material-symbols-outlined" style="font-size:1rem;">receipt_long</span>Despesas</button>
        <button class="btn" style="background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.25);font-size:0.8rem;" onclick="shareTrip('${tripId}')"><span class="material-symbols-outlined" style="font-size:1rem;">share</span>Compartilhar</button>
      </div>
    </div>
    <div class="grid-2 mb-6" style="gap:1rem;">
      <div class="stat-card"><span class="stat-card__label">Orçamento</span><span class="stat-card__value">${formatCurrency(trip.budget)}</span></div>
      <div class="stat-card"><span class="stat-card__label">Gasto</span><span class="stat-card__value text-primary">${formatCurrency(spent)}</span></div>
      <div class="stat-card"><span class="stat-card__label">Restante</span><span class="stat-card__value" style="color:var(--${status==='ok'?'secondary':status==='warning'?'tertiary':'error'});">${formatCurrency(trip.budget-spent)}</span></div>
      <div class="stat-card"><span class="stat-card__label">Dias</span><span class="stat-card__value">${days}</span></div>
    </div>
    <div class="mb-4"><div class="flex-between mb-2"><span class="label-sm text-muted">${pct}% do orçamento</span></div><div class="progress-bar progress-bar--lg"><div class="progress-bar__fill progress-bar__fill--${status==='danger'?'danger':status==='warning'?'warning':'primary'}" style="width:${Math.min(pct,100)}%"></div></div></div>
    ${coords ? `<h3 class="title-lg font-semibold mb-3 mt-6">Mapa</h3><div id="tripMap" class="map-container mb-6"></div>` : ''}
    <h3 class="title-lg font-semibold mb-4 mt-6">Cronograma</h3>
    ${itinerary.length ? `<div class="timeline">${itinerary.map(day => `
      <div class="timeline__item">
        <div class="timeline__dot timeline__dot--active"></div>
        <div class="timeline__day">DIA ${day.day} • ${formatDateShort(day.date)}</div>
        ${day.items.map(item => `
          <div class="timeline__content mb-3" style="display:flex;align-items:center;gap:1rem;">
            <span class="material-symbols-outlined text-primary">${item.icon}</span>
            <div><strong class="body-md">${item.time} — ${item.title}</strong>${item.desc ? `<p class="body-sm text-muted">${item.desc}</p>` : ''}</div>
          </div>`).join('')}
      </div>`).join('')}</div>` : '<p class="text-muted body-sm">Nenhum item no cronograma ainda.</p>'}`;

  // Init map
  if (coords) {
    setTimeout(() => {
      if (mapInstance) { mapInstance.remove(); mapInstance = null; }
      const mapEl = document.getElementById('tripMap');
      if (mapEl) {
        mapInstance = L.map('tripMap').setView(coords, 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(mapInstance);
        L.marker(coords).addTo(mapInstance).bindPopup(`<b>${trip.destination}</b>`).openPopup();
        if (CITY_COORDS[trip.origin]) {
          L.marker(CITY_COORDS[trip.origin]).addTo(mapInstance).bindPopup(`<b>${trip.origin} (Origem)</b>`);
          const bounds = L.latLngBounds([coords, CITY_COORDS[trip.origin]]);
          mapInstance.fitBounds(bounds, { padding: [30, 30] });
        }
      }
    }, 100);
  }
}

// --- RENDER: EXPENSES ---
async function renderExpenses(tripId) {
  const trip = await getTripById(tripId);
  const el = document.getElementById('expensesContent');
  if (!trip) { el.innerHTML = '<p class="text-muted text-center mt-8">Viagem não encontrada.</p>'; return; }
  const expenses = await getExpensesByTrip(tripId);
  const spent = expenses.reduce((s,e)=>s+e.amount,0);
  const pct = Math.round((spent/(trip.budget||1))*100);
  const catTotals = getTripTotalByCategory(expenses);
  const days = daysBetween(trip.start_date || trip.startDate, trip.end_date || trip.endDate) || 1;
  const dailyAvg = spent / days;

  el.innerHTML = `
    <div class="mb-6">
      <button class="btn-ghost mb-3" onclick="window.location.hash='#/viagem/${tripId}'" style="padding-left:0;"><span class="material-symbols-outlined" style="font-size:1rem;">arrow_back</span> ${trip.name || trip.title}</button>
      <span class="label-sm text-primary" style="display:block;margin-bottom:0.25rem;">ORÇAMENTO DA VIAGEM</span>
      <div style="display:flex;align-items:baseline;gap:1rem;"><h2 class="display-md">${formatCurrency(spent)}</h2><span class="text-muted title-md">gasto</span></div>
      <div class="progress-bar progress-bar--lg mt-4 mb-2"><div class="progress-bar__fill progress-bar__fill--${pct>100?'danger':pct>=80?'warning':'primary'}" style="width:${Math.min(pct,100)}%"></div></div>
      <div class="flex-between"><span class="label-sm text-muted">Restante: ${formatCurrency(trip.budget-spent)}</span><span class="label-sm text-muted">Média/dia: ${formatCurrency(dailyAvg)}</span></div>
    </div>
    <div class="grid-4 mb-6">
      ${Object.keys(CATEGORIES).filter(c=>catTotals[c]).map(c=>{
        const cat=CATEGORIES[c]; const total=catTotals[c]; const cpct=Math.round((total/(spent||1))*100);
        return `<div class="cat-card"><div class="cat-card__header"><span class="material-symbols-outlined" style="color:${cat.color};">${cat.icon}</span><span class="cat-card__percent">${cpct}%</span></div><div><div class="cat-card__label">${cat.label}</div><div class="cat-card__value">${formatCurrency(total)}</div></div></div>`;
      }).join('')}
      <div class="cat-card cat-card--accent" style="cursor:pointer;" onclick="openExpenseModal('${tripId}')"><div class="cat-card__header"><span class="material-symbols-outlined">add_circle</span></div><div><div class="cat-card__label">Adicionar</div><div class="cat-card__value">Nova</div></div></div>
    </div>
    <h3 class="title-lg font-semibold mb-4">Atividade Recente</h3>
    <div style="display:flex;flex-direction:column;gap:0.75rem;">
      ${expenses.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(exp=>{
        const cat=CATEGORIES[exp.category]||{label:'Outros',icon:'category',color:'var(--outline)'};
        return `<div class="expense-card" onclick="openExpenseModal('${tripId}','${exp.id}')">
          <div class="expense-card__swipe"></div>
          <div style="display:flex;align-items:center;gap:1.25rem;flex:1;min-width:0;">
            <div class="expense-card__icon" style="color:${cat.color};"><span class="material-symbols-outlined" style="font-size:1.5rem;">${cat.icon}</span></div>
            <div class="expense-card__info"><div class="expense-card__title truncate">${exp.description||cat.label}</div><div class="expense-card__meta"><span class="chip chip-${exp.status==='approved'?'approved':'pending'}">${exp.status==='approved'?'Aprovado':'Pendente'}</span><span class="label-sm text-muted" style="font-size:0.65rem;">${formatDateShort(exp.date)}</span></div></div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.25rem;">
            <span class="title-md font-bold">${formatCurrency(exp.amount)}</span>
            <button class="btn-icon" style="width:1.5rem;height:1.5rem;" onclick="event.stopPropagation();confirmDelete('Excluir Despesa','Deseja excluir esta despesa?',async()=>{await deleteExpense('${exp.id}');renderExpenses('${tripId}');showToast('Despesa excluída','success');})"><span class="material-symbols-outlined" style="font-size:0.875rem;color:var(--error);">delete</span></button>
          </div>
        </div>`;
      }).join('')}
    </div>
    ${expenses.length ? '<div class="swipe-hint mt-4"><span class="material-symbols-outlined" style="font-size:0.875rem;">swipe_left</span> Toque para editar ou clique no ícone para excluir</div>' : '<p class="text-muted text-center mt-8 body-sm">Nenhuma despesa registrada ainda.</p>'}`;
}

// --- RENDER: TRIPS LIST ---
async function renderTrips(search = '', filter = 'all') {
  let trips = await getTrips();
  if (search) trips = trips.filter(t => (t.name || t.title || '').toLowerCase().includes(search.toLowerCase()) || (t.destination || '').toLowerCase().includes(search.toLowerCase()));
  if (filter !== 'all') trips = trips.filter(t => t.status === filter);

  const grid = document.getElementById('tripsGrid');
  grid.innerHTML = (await Promise.all(trips.map(async t => {
    const spent = await getTripTotal(t.id);
    const pct = Math.round((spent/(t.budget||1))*100);
    const st = getBudgetStatus(spent, t.budget);
    return `<div class="trip-card" onclick="window.location.hash='#/viagem/${t.id}'">
      <div class="trip-card__cover"><div style="width:100%;height:100%;background:linear-gradient(135deg,var(--primary),var(--primary-container));display:flex;align-items:center;justify-content:center;"><span class="material-symbols-outlined" style="font-size:3rem;color:rgba(255,255,255,0.3);">flight</span></div>
        <div class="trip-card__status"><span class="chip chip-${st==='danger'?'danger':t.status==='completed'?'approved':'pending'}" style="font-size:0.55rem;">${STATUS[t.status]?.label}</span></div>
      </div>
      <div class="trip-card__body">
        <div class="trip-card__title">${t.name || t.title}</div>
        <div class="trip-card__dates">${formatDateShort(t.start_date || t.startDate)} — ${formatDateShort(t.end_date || t.endDate)}${t.destination?' • '+t.destination:''}</div>
        <div class="trip-card__budget mt-4">
          <div class="flex-between mb-2"><span class="label-sm text-muted" style="font-size:0.6rem;">${formatCurrency(spent)} / ${formatCurrency(t.budget)}</span><span class="label-sm font-bold" style="color:var(--${st==='ok'?'secondary':st==='warning'?'tertiary':'error'});font-size:0.65rem;">${pct}%</span></div>
          <div class="progress-bar"><div class="progress-bar__fill progress-bar__fill--${st==='danger'?'danger':st==='warning'?'warning':'primary'}" style="width:${Math.min(pct,100)}%"></div></div>
        </div>
        <div style="display:flex;gap:0.5rem;margin-top:1rem;">
          <button class="btn-ghost" style="font-size:0.7rem;padding:0.25rem 0.5rem;" onclick="event.stopPropagation();duplicateTrip('${t.id}');renderTrips();showToast('Viagem duplicada!','success');"><span class="material-symbols-outlined" style="font-size:0.875rem;">content_copy</span></button>
          <button class="btn-ghost" style="font-size:0.7rem;padding:0.25rem 0.5rem;" onclick="event.stopPropagation();shareTrip('${t.id}')"><span class="material-symbols-outlined" style="font-size:0.875rem;">share</span></button>
          <button class="btn-ghost" style="font-size:0.7rem;padding:0.25rem 0.5rem;color:var(--error);" onclick="event.stopPropagation();confirmDelete('Excluir Viagem','Todos os dados serão perdidos.',async()=>{await deleteTrip('${t.id}');renderTrips();showToast('Viagem excluída','success');})"><span class="material-symbols-outlined" style="font-size:0.875rem;">delete</span></button>
        </div>
      </div>
    </div>`;
  }))).join('');
  if (!trips.length) grid.innerHTML = '<p class="text-muted text-center" style="grid-column:1/-1;padding:3rem;">Nenhuma viagem encontrada.</p>';
}

// --- RENDER: REPORTS ---
async function renderReports() {
  const trips = await getTrips();
  const allExpenses = await getExpenses();
  const totalSpent = allExpenses.reduce((s,e)=>s+e.amount,0);
  const activeTrip = trips.find(t=>t.status==='active'||t.status==='over') || trips[0];
  const el = document.getElementById('reportsContent');

  // Find over-budget trips
  const overTrips = await Promise.all(trips.map(async t => ({...t, spent: await getTripTotal(t.id)})));
  const overTripsFiltered = overTrips.filter(t => t.spent > t.budget);
  
  const alertHtml = overTripsFiltered.length ? overTripsFiltered.map(t=>{
    const p = Math.round((t.spent/t.budget)*100);
    return `<div class="alert alert-error mb-4"><span class="material-symbols-outlined icon-filled">warning</span><div style="flex:1;"><p class="font-bold body-sm">Alerta: ${t.name || t.title}</p><p class="body-sm" style="opacity:0.9;">Gastos atingiram ${p}% do orçamento (${formatCurrency(t.spent)} / ${formatCurrency(t.budget)})</p></div></div>`;
  }).join('') : '';

  el.innerHTML = `
    ${alertHtml}
    <div class="mb-8">
      <span class="label-sm text-primary" style="display:block;margin-bottom:0.25rem;">GASTO TOTAL GERAL</span>
      <h2 class="display-lg mb-4">${formatCurrency(totalSpent)}</h2>
      <div style="display:flex;gap:1rem;flex-wrap:wrap;">
        <button class="btn btn-primary" style="font-size:0.8rem;" onclick="exportPDF()"><span class="material-symbols-outlined" style="font-size:1rem;">picture_as_pdf</span>Exportar PDF</button>
        <button class="btn btn-secondary" style="font-size:0.8rem;" onclick="exportCSV()"><span class="material-symbols-outlined" style="font-size:1rem;">table_view</span>Excel / CSV</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr;gap:1.5rem;" class="mb-8">
      <div class="card"><h3 class="title-lg font-semibold mb-6">Categorias de Despesa</h3><div class="chart-container" style="height:280px;display:flex;align-items:center;justify-content:center;"><canvas id="chartPie"></canvas></div><div id="pieLegend" class="mt-4" style="display:flex;flex-direction:column;gap:0.5rem;"></div></div>
      ${activeTrip?`<div class="card"><h3 class="title-lg font-semibold mb-2">Tendências Diárias</h3><p class="label-sm text-muted mb-4">${formatDateShort(activeTrip.startDate)} — ${formatDateShort(activeTrip.endDate)}</p><div class="chart-container" style="height:260px;"><canvas id="chartLine"></canvas></div></div>`:''}
      <div class="card"><h3 class="title-lg font-semibold mb-6">Orçamento vs. Real</h3><div class="chart-container" style="height:${trips.length*60+80}px;"><canvas id="chartBar"></canvas></div></div>
    </div>
    <div class="card-surface" style="border:2px dashed var(--outline-variant);opacity:0.8;">
      <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:1rem;padding:1rem;">
        <span class="material-symbols-outlined" style="font-size:2.5rem;color:var(--outline);">lightbulb</span>
        <h4 class="title-md font-bold">Dica de Economia</h4>
        <p class="body-sm text-muted" style="max-width:400px;">${ECONOMY_TIPS[Math.floor(Math.random()*ECONOMY_TIPS.length)].tip}</p>
      </div>
    </div>`;

  // Render charts
  setTimeout(() => {
    // Pie
    const allCatTotals = {};
    allExpenses.forEach(e => { allCatTotals[e.category] = (allCatTotals[e.category]||0) + e.amount; });
    renderPieChart('chartPie', allCatTotals);
    const legend = document.getElementById('pieLegend');
    if (legend) {
      const catColors = {flight:'var(--primary)',hotel:'var(--tertiary)',food:'var(--secondary)',car:'var(--primary-container)',gas:'#e65100',transport:'#5c6bc0',extras:'#8e24aa'};
      legend.innerHTML = Object.keys(allCatTotals).map(c=>{
        const cat=CATEGORIES[c]; if(!cat)return '';
        return `<div class="flex-between"><div style="display:flex;align-items:center;gap:0.5rem;"><div style="width:0.75rem;height:0.75rem;border-radius:var(--radius-full);background:${catColors[c]||'var(--outline)'};"></div><span class="body-sm font-semibold">${cat.label}</span></div><span class="body-sm font-bold">${formatCurrency(allCatTotals[c])}</span></div>`;
      }).join('');
    }

    // Line
    if (activeTrip) {
      const tripExp = getExpensesByTrip(activeTrip.id);
      renderLineChart('chartLine', tripExp, activeTrip.startDate, activeTrip.endDate);
    }

    // Bar
    const barData = trips.slice(0,5).map(t => ({ label: t.name.length > 20 ? t.name.slice(0,20)+'...' : t.name, budget: t.budget, actual: getTripTotal(t.id) }));
    renderBarChart('chartBar', barData);
  }, 200);
}

// --- RENDER: PROFILE ---
function renderProfile() {
  const user = getUser();
  const el = document.getElementById('profileContent');
  const allExpenses = getExpenses();
  const totalSpent = allExpenses.reduce((s,e)=>s+e.amount,0);
  const tripsCount = getTrips().length;

  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:1.5rem;margin-bottom:2rem;">
      <div class="profile-avatar-lg"><img src="${user.avatar}" alt="Avatar"></div>
      <div><h2 class="title-lg font-bold">${user.name}</h2><p class="body-sm text-muted">${user.email||'Sem email'}</p><p class="label-sm text-primary mt-1">${tripsCount} viagens • ${formatCurrency(totalSpent)} total</p></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:0;">
      <div class="settings-item" onclick="toggleTheme()">
        <div class="settings-item__left"><div class="settings-item__icon"><span class="material-symbols-outlined">dark_mode</span></div><div><p class="body-md font-semibold">Modo Escuro</p><p class="body-sm text-muted">Alternar entre claro e escuro</p></div></div>
        <div class="toggle ${document.documentElement.getAttribute('data-theme')==='dark'?'active':''}" id="themeToggleProfile"><div class="toggle__knob"></div></div>
      </div>
      <div class="settings-item">
        <div class="settings-item__left"><div class="settings-item__icon"><span class="material-symbols-outlined">currency_exchange</span></div><div><p class="body-md font-semibold">Moeda</p><p class="body-sm text-muted">${user.currency||'BRL'} — Real Brasileiro</p></div></div>
        <select class="input-field" style="width:5rem;padding:0.5rem;" onchange="updateUser({currency:this.value});showToast('Moeda atualizada','success');">
          <option value="BRL" ${user.currency==='BRL'?'selected':''}>R$ BRL</option>
          <option value="USD" ${user.currency==='USD'?'selected':''}>$ USD</option>
          <option value="EUR" ${user.currency==='EUR'?'selected':''}>€ EUR</option>
        </select>
      </div>
      <div class="settings-item" onclick="downloadBackup()">
        <div class="settings-item__left"><div class="settings-item__icon"><span class="material-symbols-outlined">cloud_download</span></div><div><p class="body-md font-semibold">Exportar Dados</p><p class="body-sm text-muted">Backup em JSON</p></div></div>
        <span class="material-symbols-outlined text-muted">chevron_right</span>
      </div>
      <div class="settings-item" onclick="document.getElementById('importFile').click()">
        <div class="settings-item__left"><div class="settings-item__icon"><span class="material-symbols-outlined">upload_file</span></div><div><p class="body-md font-semibold">Importar CSV / JSON</p><p class="body-sm text-muted">Importar despesas</p></div></div>
        <span class="material-symbols-outlined text-muted">chevron_right</span>
      </div>
      <input type="file" id="importFile" accept=".json,.csv" class="hidden" onchange="handleImport(this)">
      <div class="settings-item" style="margin-top:2rem;" onclick="handleLogout()">
        <div class="settings-item__left"><div class="settings-item__icon" style="background:var(--error-container);"><span class="material-symbols-outlined" style="color:var(--error);">logout</span></div><div><p class="body-md font-semibold text-error">Sair</p><p class="body-sm text-muted">Fazer logout</p></div></div>
      </div>
    </div>`;
}

// --- EXPORT ---
function downloadBackup() {
  const data = exportData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `travelcost_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click(); URL.revokeObjectURL(url);
  showToast('Backup exportado!', 'success');
}

function exportPDF() { showToast('Exportação PDF: Em desenvolvimento', 'warning'); }
function exportCSV() {
  const expenses = getExpenses();
  const trips = getTrips();
  let csv = 'Viagem,Categoria,Valor,Data,Descrição,Status\n';
  expenses.forEach(e => {
    const trip = trips.find(t=>t.id===e.tripId);
    const cat = CATEGORIES[e.category];
    csv += `"${trip?.name||''}","${cat?.label||''}",${e.amount},"${e.date}","${e.description}","${e.status}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `travelcost_despesas_${new Date().toISOString().split('T')[0]}.csv`;
  a.click(); URL.revokeObjectURL(url);
  showToast('CSV exportado!', 'success');
}

function handleImport(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    if (importData(e.target.result)) {
      showToast('Dados importados com sucesso!', 'success');
      renderScreen(currentScreen);
    } else { showToast('Erro ao importar arquivo.', 'error'); }
  };
  reader.readAsText(file);
  input.value = '';
}
