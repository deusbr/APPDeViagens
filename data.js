// ============================================================
// TravelCost — data.js
// Mock data, Supabase config, localStorage helpers
// ============================================================

// --- Supabase Configuration ---
// Replace with your own Supabase project credentials
const SUPABASE_URL = 'https://gqnzvaseiyimpaiobxib.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxbnp2YXNlaXlpbXBhaW9ieGliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MjEyNzgsImV4cCI6MjA5MDI5NzI3OH0.ebxPvkrmCzCh2TMacUnVNB2YFyOHwxfF7rVc-pYM5to';

let supabaseClient = null;

function initSupabase() {
  if (typeof supabase !== 'undefined' && supabase.createClient) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase client initialized');
  } else {
    console.warn('⚠️ Supabase SDK não carregado. Usando localStorage.');
  }
}

function isSupabaseConfigured() {
  return supabaseClient && !SUPABASE_URL.includes('YOUR_PROJECT');
}

// --- IDs ---
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// --- LocalStorage Helpers ---
function saveToStorage(key, data) {
  try {
    localStorage.setItem(`travelcost_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error('Erro ao salvar:', e);
  }
}

function loadFromStorage(key) {
  try {
    const data = localStorage.getItem(`travelcost_${key}`);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Erro ao carregar:', e);
    return null;
  }
}

function removeFromStorage(key) {
  localStorage.removeItem(`travelcost_${key}`);
}

// --- Date Helpers ---
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function formatCurrency(value, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
}

function formatPercent(value) {
  return Math.round(value) + '%';
}

function daysBetween(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil((e - s) / (1000 * 60 * 60 * 24));
}

// --- Category Config ---
const CATEGORIES = {
  flight: { label: 'Passagens', icon: 'flight', color: 'var(--primary)' },
  hotel: { label: 'Hospedagem', icon: 'hotel', color: 'var(--tertiary)' },
  food: { label: 'Alimentação', icon: 'restaurant', color: 'var(--secondary)' },
  car: { label: 'Carro', icon: 'directions_car', color: 'var(--primary-container)' },
  gas: { label: 'Gasolina', icon: 'local_gas_station', color: '#e65100' },
  transport: { label: 'Transporte', icon: 'commute', color: '#5c6bc0' },
  extras: { label: 'Extras', icon: 'category', color: '#8e24aa' }
};

// --- Status Config ---
const STATUS = {
  planning: { label: 'Planejando', color: 'var(--primary)', bg: 'var(--primary-fixed)' },
  active: { label: 'Em Andamento', color: 'var(--secondary)', bg: 'var(--secondary-fixed)' },
  completed: { label: 'Concluída', color: 'var(--outline)', bg: 'var(--surface-container-high)' },
  over: { label: 'Acima do Orçamento', color: 'var(--error)', bg: 'var(--error-container)' }
};

// --- Brazil Cities (Autocomplete) ---
const BR_CITIES = [
  'São Paulo, SP', 'Rio de Janeiro, RJ', 'Salvador, BA', 'Curitiba, PR',
  'Brasília, DF', 'Fortaleza, CE', 'Belo Horizonte, MG', 'Manaus, AM',
  'Recife, PE', 'Porto Alegre, RS', 'Belém, PA', 'Goiânia, GO',
  'Guarulhos, SP', 'Campinas, SP', 'São Luís, MA', 'Maceió, AL',
  'Florianópolis, SC', 'Natal, RN', 'Campo Grande, MS', 'Teresina, PI',
  'João Pessoa, PB', 'Aracaju, SE', 'Cuiabá, MT', 'Joinville, SC',
  'Vitória, ES', 'Londrina, PR', 'Santos, SP', 'Foz do Iguaçu, PR',
  'Gramado, RS', 'Paraty, RJ', 'Búzios, RJ', 'Bonito, MS',
  'Chapada Diamantina, BA', 'Fernando de Noronha, PE', 'Lençóis Maranhenses, MA',
  'Ouro Preto, MG', 'Jericoacoara, CE', 'Porto Seguro, BA', 'Ilhabela, SP',
  'Arraial do Cabo, RJ', 'Alter do Chão, PA', 'São Miguel dos Milagres, AL'
];

// --- City Coordinates (for map) ---
const CITY_COORDS = {
  'Curitiba, PR': [-25.4284, -49.2733],
  'Salvador, BA': [-12.9714, -38.5124],
  'São Paulo, SP': [-23.5505, -46.6333],
  'Manaus, AM': [-3.1190, -60.0217],
  'Rio de Janeiro, RJ': [-22.9068, -43.1729],
  'Florianópolis, SC': [-27.5969, -48.5495],
  'Brasília, DF': [-15.7975, -47.8919],
  'Fortaleza, CE': [-3.7172, -38.5433],
  'Belo Horizonte, MG': [-19.9167, -43.9345],
  'Recife, PE': [-8.0476, -34.8770],
  'Porto Alegre, RS': [-30.0346, -51.2177],
  'Foz do Iguaçu, PR': [-25.5163, -54.5854],
  'Gramado, RS': [-29.3783, -50.8764],
  'Natal, RN': [-5.7945, -35.2110],
  'Fernando de Noronha, PE': [-3.8547, -32.4247]
};

// --- Default User ---
const DEFAULT_USER = {
  id: 'local-user-1',
  name: 'Viajante',
  email: '',
  avatar: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230058bc"/><text x="50" y="55" text-anchor="middle" dy=".1em" font-size="40" fill="white" font-family="Inter">V</text></svg>',
  currency: 'BRL',
  theme: 'light'
};

// --- Mock Trips ---
const MOCK_TRIPS = [
  {
    id: 'trip-001',
    name: 'Salvador para Curitiba',
    destination: 'Curitiba, PR',
    origin: 'Salvador, BA',
    startDate: '2026-04-10',
    endDate: '2026-04-22',
    budget: 5000,
    numPeople: 2,
    status: 'active',
    description: 'Conferência de Negócios & Networking',
    coverUrl: '',
    createdAt: '2026-03-15T10:00:00Z'
  },
  {
    id: 'trip-002',
    name: 'Pesquisa no Amazonas',
    destination: 'Manaus, AM',
    origin: 'São Paulo, SP',
    startDate: '2026-05-01',
    endDate: '2026-05-14',
    budget: 12000,
    numPeople: 3,
    status: 'active',
    description: 'Pesquisa de campo e expedição',
    coverUrl: '',
    createdAt: '2026-02-20T14:00:00Z'
  },
  {
    id: 'trip-003',
    name: 'Meetup em São Paulo',
    destination: 'São Paulo, SP',
    origin: 'Curitiba, PR',
    startDate: '2026-03-20',
    endDate: '2026-03-23',
    budget: 1500,
    numPeople: 1,
    status: 'over',
    description: 'Evento de tecnologia e networking',
    coverUrl: '',
    createdAt: '2026-03-01T09:00:00Z'
  },
  {
    id: 'trip-004',
    name: 'Férias em Florianópolis',
    destination: 'Florianópolis, SC',
    origin: 'São Paulo, SP',
    startDate: '2025-12-20',
    endDate: '2026-01-05',
    budget: 8000,
    numPeople: 4,
    status: 'completed',
    description: 'Férias em família na praia',
    coverUrl: '',
    createdAt: '2025-11-10T10:00:00Z'
  }
];

// --- Mock Expenses ---
const MOCK_EXPENSES = [
  // Trip 1: Salvador → Curitiba
  { id: 'exp-001', tripId: 'trip-001', category: 'flight', amount: 1400, date: '2026-04-10', description: 'Passagens aéreas LATAM - SSA → CWB', status: 'approved' },
  { id: 'exp-002', tripId: 'trip-001', category: 'car', amount: 450, date: '2026-04-10', description: 'Aluguel Avis - Chevrolet Onix - 12 dias', status: 'approved' },
  { id: 'exp-003', tripId: 'trip-001', category: 'hotel', amount: 1200, date: '2026-04-10', description: 'Airbnb Centro Histórico - 12 noites', status: 'pending' },
  { id: 'exp-004', tripId: 'trip-001', category: 'gas', amount: 180, date: '2026-04-12', description: 'Posto Shell - Tanque cheio', status: 'approved' },
  { id: 'exp-005', tripId: 'trip-001', category: 'food', amount: 95, date: '2026-04-11', description: 'Restaurante Madero - Jantar', status: 'approved' },
  { id: 'exp-006', tripId: 'trip-001', category: 'transport', amount: 45, date: '2026-04-10', description: 'Uber Aeroporto → Hotel', status: 'approved' },
  { id: 'exp-007', tripId: 'trip-001', category: 'extras', amount: 30, date: '2026-04-13', description: 'Museu Oscar Niemeyer - 2 ingressos', status: 'approved' },
  // Trip 2: Amazonas
  { id: 'exp-008', tripId: 'trip-002', category: 'flight', amount: 2200, date: '2026-05-01', description: 'Passagens GOL - GRU → MAO', status: 'approved' },
  { id: 'exp-009', tripId: 'trip-002', category: 'hotel', amount: 4800, date: '2026-05-01', description: 'Amazon Jungle Palace - 14 noites', status: 'approved' },
  { id: 'exp-010', tripId: 'trip-002', category: 'food', amount: 1680, date: '2026-05-03', description: 'Alimentação estimada - 14 dias', status: 'pending' },
  { id: 'exp-011', tripId: 'trip-002', category: 'extras', amount: 1400, date: '2026-05-05', description: 'Passeios e guias locais', status: 'pending' },
  // Trip 3: São Paulo
  { id: 'exp-012', tripId: 'trip-003', category: 'flight', amount: 580, date: '2026-03-20', description: 'Passagens LATAM - CWB → CGH', status: 'approved' },
  { id: 'exp-013', tripId: 'trip-003', category: 'hotel', amount: 720, date: '2026-03-20', description: 'Hotel Ibis Paulista - 3 noites', status: 'approved' },
  { id: 'exp-014', tripId: 'trip-003', category: 'food', amount: 245, date: '2026-03-21', description: 'Refeições diversas', status: 'approved' },
  { id: 'exp-015', tripId: 'trip-003', category: 'transport', amount: 135, date: '2026-03-22', description: 'Uber e metrô', status: 'approved' },
  // Trip 4: Florianópolis
  { id: 'exp-016', tripId: 'trip-004', category: 'flight', amount: 3200, date: '2025-12-20', description: 'Passagens Azul - GRU → FLN (4 pessoas)', status: 'approved' },
  { id: 'exp-017', tripId: 'trip-004', category: 'hotel', amount: 2400, date: '2025-12-20', description: 'Airbnb Jurerê Internacional - 16 noites', status: 'approved' },
  { id: 'exp-018', tripId: 'trip-004', category: 'food', amount: 1600, date: '2025-12-25', description: 'Alimentação família - 16 dias', status: 'approved' },
  { id: 'exp-019', tripId: 'trip-004', category: 'car', amount: 800, date: '2025-12-20', description: 'Localiza - SUV - 16 dias', status: 'approved' },
];

// --- Itinerary Items (for trip detail timeline) ---
const MOCK_ITINERARY = {
  'trip-001': [
    { day: 1, date: '2026-04-10', items: [
      { time: '06:30', title: 'Voo SSA → CWB', icon: 'flight', desc: 'LATAM LA3421' },
      { time: '12:00', title: 'Check-in Airbnb', icon: 'cottage', desc: 'Centro Histórico de Curitiba' },
      { time: '14:00', title: 'Almoço', icon: 'restaurant', desc: 'Restaurante Madalosso' }
    ]},
    { day: 2, date: '2026-04-11', items: [
      { time: '09:00', title: 'Jardim Botânico', icon: 'park', desc: 'Visita ao cartão postal' },
      { time: '13:00', title: 'Almoço Madero', icon: 'restaurant', desc: '' },
      { time: '15:00', title: 'Ópera de Arame', icon: 'theater_comedy', desc: '' }
    ]},
    { day: 3, date: '2026-04-12', items: [
      { time: '08:00', title: 'Cultura e Gastronomia', icon: 'restaurant', desc: 'Tour gastronômico pelo centro' },
      { time: '14:00', title: 'Museu Oscar Niemeyer', icon: 'museum', desc: 'Exposição permanente' }
    ]},
    { day: 4, date: '2026-04-13', items: [
      { time: '09:00', title: 'Início da Viagem de Carro', icon: 'directions_car', desc: 'Rota dos vinhos' },
      { time: '18:00', title: 'Retorno ao Airbnb', icon: 'cottage', desc: '' }
    ]}
  ]
};

// --- Economy Tips ---
const ECONOMY_TIPS = [
  { category: 'gas', condition: (trips) => true, tip: 'Gasolina alta? Considere dividir corridas de app com outros viajantes ou usar transporte público local.' },
  { category: 'hotel', condition: (trips) => true, tip: 'Hospedagem representa sua maior despesa. Considere Airbnb para estadias longas — economia de até 40%.' },
  { category: 'food', condition: (trips) => true, tip: 'Economize em alimentação: explore mercados locais e cozinhe no Airbnb ao menos 1 refeição por dia.' },
  { category: 'flight', condition: (trips) => true, tip: 'Compre passagens com 30-45 dias de antecedência para melhores preços. Use alertas de preço do Google Flights.' },
  { category: 'car', condition: (trips) => true, tip: 'Aluguel de carro: compare Localiza, Movida e Unidas. Abasteça em postos de bairro para economizar.' }
];

// --- Init App Data ---
function initData() {
  const existingTrips = loadFromStorage('trips');
  if (!existingTrips) {
    saveToStorage('trips', MOCK_TRIPS);
    saveToStorage('expenses', MOCK_EXPENSES);
    saveToStorage('itinerary', MOCK_ITINERARY);
    console.log('📦 Dados de demonstração carregados');
  }

  const existingUser = loadFromStorage('user');
  if (!existingUser) {
    saveToStorage('user', DEFAULT_USER);
  }
}

// --- Data Access (Async for Supabase, Sync for Storage) ---
async function getTrips() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabaseClient.from('trips').select('*').order('created_at', { ascending: false });
    if (!error) return data;
    console.error('Erro Supabase Trips:', error);
  }
  return loadFromStorage('trips') || [];
}

async function getExpenses() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabaseClient.from('expenses').select('*').order('date', { ascending: false });
    if (!error) return data;
    console.error('Erro Supabase Expenses:', error);
  }
  return loadFromStorage('expenses') || [];
}

async function getExpensesByTrip(tripId) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabaseClient.from('expenses').select('*').eq('trip_id', tripId).order('date', { ascending: false });
    if (!error) return data;
    console.error('Erro Supabase ExpensesByTrip:', error);
  }
  return getExpenses().then(exps => exps.filter(e => e.trip_id === tripId));
}

async function getTripById(id) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabaseClient.from('trips').select('*').eq('id', id).single();
    if (!error) return data;
    console.error('Erro Supabase TripById:', error);
  }
  const trips = await getTrips();
  return trips.find(t => t.id === id);
}

function getExpensesByTrip(tripId) {
  return getExpenses().filter(e => e.tripId === tripId);
}

async function getTripTotal(tripId) {
  const expenses = await getExpensesByTrip(tripId);
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

function getTripTotalByCategory(expenses) {
  const totals = {};
  expenses.forEach(e => {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
  });
  return totals;
}

async function getAllTotals() {
  const expenses = await getExpenses();
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

async function getMonthlyTotal() {
  const now = new Date();
  const expenses = await getExpenses();
  return expenses
    .filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + e.amount, 0);
}

async function getYearlyTotal() {
  const now = new Date();
  const expenses = await getExpenses();
  return expenses
    .filter(e => new Date(e.date).getFullYear() === now.getFullYear())
    .reduce((sum, e) => sum + e.amount, 0);
}

async function getActiveTripsCount() {
  const trips = await getTrips();
  return trips.filter(t => t.status === 'active' || t.status === 'over').length;
}

function getBudgetStatus(spent, budget) {
  const pct = (spent / budget) * 100;
  if (pct > 100) return 'danger';
  if (pct >= 80) return 'warning';
  return 'ok';
}

// --- CRUD Operations ---
async function addTrip(trip) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabaseClient.from('trips').insert([trip]).select().single();
    if (!error) return data;
    console.error('Erro Supabase addTrip:', error);
  }
  const trips = await getTrips();
  trip.id = trip.id || generateId();
  trip.created_at = new Date().toISOString();
  trips.push(trip);
  saveToStorage('trips', trips);
  return trip;
}

function updateTrip(id, updates) {
  const trips = getTrips();
  const idx = trips.findIndex(t => t.id === id);
  if (idx !== -1) {
    trips[idx] = { ...trips[idx], ...updates };
    saveToStorage('trips', trips);
    return trips[idx];
  }
  return null;
}

async function deleteTrip(id) {
  if (isSupabaseConfigured()) {
    await supabaseClient.from('trips').delete().eq('id', id);
  }
  const trips = (await getTrips()).filter(t => t.id !== id);
  const expenses = (await getExpenses()).filter(e => e.tripId !== id);
  saveToStorage('trips', trips);
  saveToStorage('expenses', expenses);
}

function duplicateTrip(id) {
  const trip = getTripById(id);
  if (trip) {
    const newTrip = { ...trip, id: generateId(), name: trip.name + ' (Cópia)', status: 'planning', createdAt: new Date().toISOString() };
    const trips = getTrips();
    trips.push(newTrip);
    saveToStorage('trips', trips);
    return newTrip;
  }
  return null;
}

async function addExpense(expense) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabaseClient.from('expenses').insert([expense]).select().single();
    if (!error) return data;
    console.error('Erro Supabase addExpense:', error);
  }
  const expenses = await getExpenses();
  expense.id = expense.id || generateId();
  expense.created_at = new Date().toISOString();
  expenses.push(expense);
  saveToStorage('expenses', expenses);

  // Auto-update trip status
  const trip = getTripById(expense.tripId);
  if (trip) {
    const total = getTripTotal(expense.tripId);
    if (total > trip.budget) {
      updateTrip(expense.tripId, { status: 'over' });
    }
  }

  return expense;
}

function updateExpense(id, updates) {
  const expenses = getExpenses();
  const idx = expenses.findIndex(e => e.id === id);
  if (idx !== -1) {
    expenses[idx] = { ...expenses[idx], ...updates };
    saveToStorage('expenses', expenses);
    return expenses[idx];
  }
  return null;
}

async function deleteExpense(id) {
  const expenses = await getExpenses();
  const expense = expenses.find(e => e.id === id);
  if (isSupabaseConfigured()) {
    await supabaseClient.from('expenses').delete().eq('id', id);
  }
  const filtered = expenses.filter(e => e.id !== id);
  saveToStorage('expenses', filtered);

  // Re-check trip status
  if (expense) {
    const trip = getTripById(expense.tripId);
    if (trip) {
      const total = getTripTotal(expense.tripId);
      if (total <= trip.budget && trip.status === 'over') {
        updateTrip(expense.tripId, { status: 'active' });
      }
    }
  }
}

function updateUser(updates) {
  const user = getUser();
  const updated = { ...user, ...updates };
  saveToStorage('user', updated);
  return updated;
}

function exportData() {
  return JSON.stringify({
    trips: getTrips(),
    expenses: getExpenses(),
    itinerary: getItinerary(),
    user: getUser(),
    exportedAt: new Date().toISOString()
  }, null, 2);
}

function importData(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (data.trips) saveToStorage('trips', data.trips);
    if (data.expenses) saveToStorage('expenses', data.expenses);
    if (data.itinerary) saveToStorage('itinerary', data.itinerary);
    if (data.user) saveToStorage('user', data.user);
    return true;
  } catch (e) {
    console.error('Erro ao importar:', e);
    return false;
  }
}
