const STORAGE_KEY = 'financas.transacoes';
const BUDGET_KEY = 'financas.orcamentos';
const THEME_KEY = 'financas.tema'; // mesma chave do script em index.html
const CURRENCY_KEY = 'financas.moeda';
const RANGE_KEY = 'financas.periodo';
const RANGES = [3, 6, 12];
const MAX_AMOUNT = 1000000000;
const SAVE_ERROR = 'Não foi possível guardar no navegador; os dados perdem-se ao fechar a página.';

const CATEGORIES = {
  expense: ['Alimentação', 'Habitação', 'Transportes', 'Lazer', 'Saúde', 'Educação', 'Internet', 'Água', 'Energia/Gás', 'Outros'],
  income: ['Salário', 'Freelance', 'Investimentos', 'Outros'],
};

// Cores do gráfico: azuis-acinzentados da paleta base + paleta quente
// (#FFB894 #FB9590 #DC586D #A33757 #852E4E #4C1D3D), alternando frio/quente para diferenciar fatias.
const CAT_COLORS = {
  light: {
    'Alimentação': '#07151C', 'Habitação': '#DC586D', 'Transportes': '#4B5F6D',
    'Lazer': '#FFB894', 'Saúde': '#A33757', 'Educação': '#8DA4AB',
    'Internet': '#4C1D3D', 'Água': '#5B9BB5', 'Energia/Gás': '#FB9590', 'Outros': '#B3BFC2',
  },
  dark: {
    'Alimentação': '#CCD0CF', 'Habitação': '#FB9590', 'Transportes': '#8DA4AB',
    'Lazer': '#FFB894', 'Saúde': '#DC586D', 'Educação': '#6E858F',
    'Internet': '#A33757', 'Água': '#7CC0DA', 'Energia/Gás': '#B8C9CC', 'Outros': '#4B5F6D',
  },
};
// Categorias antigas (versão em pt-BR) mapeadas para as novas
const LEGACY = { 'Moradia': 'Habitação', 'Transporte': 'Transportes', 'Água e Energia': 'Energia/Gás' };

// Ícones de linha (24x24, estilo Lucide). Conteúdo estático; a categoria só serve de chave.
const ICON_SHAPES = {
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  game: '<path d="M6 11h4M8 9v4M15 12h.01M18 10h.01"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258A4 4 0 0 0 17.32 5z"/>',
  health: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
  cap: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  wifi: '<path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/>',
  utilities: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  water: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  laptop: '<path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/>',
  trend: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
};
const CAT_ICONS = {
  expense: {
    'Alimentação': 'cart', 'Habitação': 'home', 'Transportes': 'car', 'Lazer': 'game',
    'Saúde': 'health', 'Educação': 'cap', 'Internet': 'wifi', 'Água': 'water', 'Energia/Gás': 'utilities', 'Outros': 'more',
  },
  income: { 'Salário': 'wallet', 'Freelance': 'laptop', 'Investimentos': 'trend', 'Outros': 'more' },
};

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho',
  'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const $ = (id) => document.getElementById(id);
const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const toCents = (n) => Math.round(n * 100);

// Moedas: só muda a apresentação; os valores guardados não são convertidos
const CURRENCIES = {
  EUR: { symbol: '€', name: 'euros' },
  AOA: { symbol: 'Kz', name: 'kwanzas' },
};
const DEC = new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
let currency = readCurrency();
function readCurrency() {
  try {
    const v = window.localStorage.getItem(CURRENCY_KEY);
    return has(CURRENCIES, v) ? v : 'EUR';
  } catch {
    return 'EUR';
  }
}
const money = {
  format: (v) => `${DEC.format(v)} ${CURRENCIES[currency].symbol}`,
  formatToParts: (v) => [
    ...DEC.formatToParts(v),
    { type: 'literal', value: ' ' },
    { type: 'currency', value: CURRENCIES[currency].symbol },
  ],
};

let trendRange = readRange();
function readRange() {
  try {
    const v = Number(window.localStorage.getItem(RANGE_KEY));
    return RANGES.includes(v) ? v : 6;
  } catch {
    return 6;
  }
}

let transactions = load();
let budgets = loadBudgets();
let donut = null;
let trend = null;
let view = { list: [], month: 'all' };

/* ---------- Persistência ---------- */
function newId() { return Date.now() + Math.random().toString(16).slice(2); }

// Sanea cada registo; descarta apenas os inválidos (nunca reescreve o armazenamento no arranque)
function load() {
  try {
    return sanitizeTransactions(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return [];
  }
}
function sanitizeTransactions(data) {
  if (!Array.isArray(data)) return [];
  const out = [];
  data.forEach((t) => {
    if (!t || typeof t !== 'object') return;
    if (t.type !== 'expense' && t.type !== 'income') return;
    const amount = Number(t.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (typeof t.date !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(t.date)) return;
    let category = typeof t.category === 'string' && t.category ? t.category : 'Outros';
    if (has(LEGACY, category)) category = LEGACY[category];
    out.push({
      id: typeof t.id === 'string' && t.id ? t.id : newId(),
      type: t.type,
      description: String(t.description == null ? '' : t.description),
      amount,
      category,
      date: t.date,
    });
  });
  return out;
}
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    return true;
  } catch {
    return false;
  }
}

function loadBudgets() {
  try {
    return sanitizeBudgets(JSON.parse(localStorage.getItem(BUDGET_KEY)));
  } catch {
    return {};
  }
}
function sanitizeBudgets(data) {
  const out = {};
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    Object.keys(data).forEach((k) => {
      const v = Number(data[k]);
      if (/^\d{4}-(0[1-9]|1[0-2])$/.test(k) && Number.isFinite(v) && v > 0 && v <= MAX_AMOUNT) out[k] = v;
    });
  }
  return out;
}

/* ---------- Exportar / importar ---------- */
function exportData() {
  const payload = {
    app: 'financas-pessoais', version: 1, exportedAt: new Date().toISOString(),
    currency, transactions, budgets,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `financas-${todayISO()}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Junta os dados do ficheiro aos existentes (por id); nunca apaga nada
function importData(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('O ficheiro não é um JSON válido.'); }
  if (!data || typeof data !== 'object' || data.app !== 'financas-pessoais') {
    throw new Error('Este ficheiro não foi exportado por esta aplicação.');
  }
  const incoming = sanitizeTransactions(data.transactions);
  const known = new Set(transactions.map((t) => t.id));
  const fresh = incoming.filter((t) => !known.has(t.id));
  const newBudgets = sanitizeBudgets(data.budgets);
  const budgetsAdded = Object.keys(newBudgets).filter((m) => !has(budgets, m));
  budgetsAdded.forEach((m) => { budgets[m] = newBudgets[m]; }); // orçamentos já definidos aqui prevalecem
  transactions = transactions.concat(fresh);
  const ok = save() && saveBudgets();
  return { added: fresh.length, skipped: incoming.length - fresh.length, budgetsAdded: budgetsAdded.length, ok };
}
function saveBudgets() {
  try {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(budgets));
    return true;
  } catch {
    return false;
  }
}
function getBudget(month) { return has(budgets, month) ? budgets[month] : 0; }
function setBudget(month, value) {
  if (value > 0) budgets[month] = value; else delete budgets[month];
  return saveBudgets();
}

function reportSave(ok) { $('error').textContent = ok ? '' : SAVE_ERROR; }

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function addTransaction(t) {
  transactions.push({ id: newId(), ...t });
  return save();
}
// Remove e devolve {t, index, ok} para permitir desfazer
function removeTransaction(id) {
  const index = transactions.findIndex((t) => t.id === id);
  if (index < 0) return null;
  const [t] = transactions.splice(index, 1);
  return { t, index, ok: save() };
}
function restoreTransaction(t, index) {
  transactions.splice(Math.min(index, transactions.length), 0, t);
  return save();
}
function setCategory(id, category) {
  const t = transactions.find((x) => x.id === id);
  if (!t) return true;
  t.category = category;
  return save();
}

// Aviso temporário com ação opcional (ex.: Anular)
let toastTimer = null;
function showToast(message, actionLabel, onAction) {
  const toast = $('toast');
  toast.replaceChildren();
  const span = document.createElement('span');
  span.textContent = message;
  toast.append(span);
  if (actionLabel) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast-action';
    btn.textContent = actionLabel;
    btn.addEventListener('click', () => { hideToast(); onAction(); });
    toast.append(btn);
  }
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 7000);
}
function hideToast() {
  clearTimeout(toastTimer);
  $('toast').hidden = true;
}

/* ---------- Cálculos (em cêntimos inteiros) ---------- */
function filterByMonth(list, month) {
  return month === 'all' ? list : list.filter((t) => t.date.startsWith(month));
}

function sumCents(list, type) {
  return list.filter((t) => t.type === type).reduce((s, t) => s + toCents(t.amount), 0);
}

function computeTotals(list) {
  const income = sumCents(list, 'income');
  const expense = sumCents(list, 'expense');
  return { income: income / 100, expense: expense / 100, balance: (income - expense) / 100 };
}

// Map categoria -> cêntimos (Map evita colisões com chaves do protótipo)
function groupExpensesByCategory(list) {
  const groups = new Map();
  list.filter((t) => t.type === 'expense').forEach((t) => {
    groups.set(t.category, (groups.get(t.category) || 0) + toCents(t.amount));
  });
  return groups;
}

// Despesas dos n meses que terminam em endMonth ("YYYY-MM")
function monthlyExpenseTotals(endMonth, n) {
  let [y, m] = endMonth.split('-').map(Number);
  const out = [];
  for (let i = 0; i < n; i++) {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    out.unshift({ key, label: SHORT[m - 1], total: sumCents(filterByMonth(transactions, key), 'expense') / 100 });
    m--;
    if (m === 0) { m = 12; y--; }
  }
  return out;
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// Valor grande com as casas decimais mais pequenas
function setBig(el, value) {
  el.replaceChildren();
  const cents = document.createElement('span');
  cents.className = 'cents';
  let inCents = false;
  money.formatToParts(value).forEach((p) => {
    if (p.type === 'decimal') inCents = true;
    if (inCents) cents.append(p.value); else el.append(p.value);
  });
  if (inCents) el.append(cents);
}

/* ---------- Tema ---------- */
const root = document.documentElement;
const darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
let themeChoice = readThemeChoice(); // 'light' | 'dark' | null (segue o sistema)

function readThemeChoice() {
  try {
    const v = window.localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}
function currentTheme() {
  return themeChoice || (darkQuery && darkQuery.matches ? 'dark' : 'light');
}
const THEME_LABELS = { auto: 'Automático (sistema)', light: 'Claro', dark: 'Escuro' };
function applyTheme() {
  const theme = currentTheme();
  root.setAttribute('data-theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#07151C' : '#DDE0DF');
  const mode = themeChoice || 'auto';
  const toggle = $('theme-toggle');
  toggle.setAttribute('data-mode', mode);
  toggle.setAttribute('aria-label', `Tema: ${THEME_LABELS[mode]}. Clica para alterar.`);
  toggle.title = `Tema: ${THEME_LABELS[mode]}`;
}

function cssVar(name) {
  return getComputedStyle(root).getPropertyValue(name).trim();
}
function themeColors() {
  return {
    theme: currentTheme(),
    card: cssVar('--card'), text: cssVar('--text'), muted: cssVar('--muted'), line: cssVar('--line'),
    tooltipBg: cssVar('--tooltip-bg'), tooltipFg: cssVar('--tooltip-fg'),
    barActive: cssVar('--bar-active'), barIdle: cssVar('--bar-idle'),
  };
}
function catColor(name, colors) {
  const map = CAT_COLORS[colors.theme];
  return has(map, name) ? map[name] : map['Outros'];
}

/* ---------- Ícones ---------- */
const SVG_NS = 'http://www.w3.org/2000/svg';
function shapeIcon(shape) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.innerHTML = ICON_SHAPES[shape]; // constante estática
  return svg;
}
function categoryIcon(category, type) {
  const set = CAT_ICONS[type === 'income' ? 'income' : 'expense'];
  return shapeIcon(has(set, category) ? set[category] : 'more');
}

/* ---------- Formulários / filtros ---------- */
function selectedType() {
  return document.querySelector('input[name="type"]:checked').value;
}

function fillCategories() {
  $('category').replaceChildren(...CATEGORIES[selectedType()].map((c) => new Option(c, c)));
}

// Últimos n meses (do atual para trás) como "YYYY-MM"
function recentMonths(n) {
  let [y, m] = todayISO().slice(0, 7).split('-').map(Number);
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m--;
    if (m === 0) { m = 12; y--; }
  }
  return out;
}

function fillMonths() {
  const select = $('month-filter');
  const now = todayISO().slice(0, 7);
  const current = select.value || now;
  const months = new Set(transactions.map((t) => t.date.slice(0, 7)));
  Object.keys(budgets).forEach((m) => months.add(m));
  recentMonths(24).forEach((m) => months.add(m)); // meses anteriores vazios também aceitam dados
  const options = [new Option('Todos', 'all')];
  [...months].sort().reverse().forEach((m) => {
    const [y, mm] = m.split('-');
    options.push(new Option(`${MONTHS[+mm - 1]} ${y}`, m));
  });
  select.replaceChildren(...options);
  select.value = [...select.options].some((o) => o.value === current) ? current : 'all';
}

// Data sugerida para o formulário conforme o mês escolhido no filtro
function defaultDateFor(month) {
  const today = todayISO();
  if (month === 'all' || month === today.slice(0, 7)) return today;
  return `${month}-01`;
}

// Textos fixos que dependem da moeda
function applyCurrencyLabels() {
  const { symbol, name } = CURRENCIES[currency];
  $('currency-select').value = currency;
  $('amount-label').textContent = `Valor (${symbol})`;
  $('budget-input').placeholder = `Orçamento (${symbol})`;
  $('budget-input').setAttribute('aria-label', `Orçamento em ${name}`);
}

function renderBudget(list, month) {
  const input = $('budget-input');
  const btn = $('budget-btn');
  const fill = $('progress-fill');
  const pill = $('budget-pct');
  const text = $('budget-text');
  $('budget-error').textContent = '';

  if (month === 'all') {
    input.disabled = true;
    btn.disabled = true;
    input.value = '';
    fill.style.width = '0';
    fill.classList.remove('warn');
    pill.textContent = '—';
    pill.classList.remove('warn');
    $('progress').setAttribute('aria-valuenow', 0);
    text.textContent = 'Escolhe um mês para definir o orçamento.';
    return;
  }

  input.disabled = false;
  btn.disabled = false;
  const budget = getBudget(month);
  input.value = budget ? budget : '';
  const spent = computeTotals(list).expense;

  if (!budget) {
    fill.style.width = '0';
    fill.classList.remove('warn');
    pill.textContent = 'Sem orçamento';
    pill.classList.remove('warn');
    $('progress').setAttribute('aria-valuenow', 0);
    text.textContent = `Gastaste ${money.format(spent)} este mês. Define um orçamento para acompanhar.`;
    return;
  }

  const spentC = toCents(spent);
  const budgetC = toCents(budget);
  const pct = (spentC / budgetC) * 100;
  const over = spentC > budgetC;
  fill.style.width = `${Math.min(pct, 100)}%`;
  fill.classList.toggle('warn', pct >= 80);
  pill.textContent = `${Math.round(pct)}%`;
  pill.classList.toggle('warn', pct >= 80);
  $('progress').setAttribute('aria-valuenow', Math.min(Math.round(pct), 100));
  text.textContent = over
    ? `${money.format(spent)} de ${money.format(budget)} · Excedeste em ${money.format((spentC - budgetC) / 100)}`
    : `${money.format(spent)} de ${money.format(budget)} · Restam ${money.format((budgetC - spentC) / 100)}`;
}

/* ---------- Gráficos ---------- */
const chartAvailable = () => typeof Chart !== 'undefined';

function applyChartTheme(colors) {
  Chart.defaults.color = colors.muted;
  Chart.defaults.borderColor = colors.line;
  Chart.defaults.font.family = "'Space Grotesk', sans-serif";
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    Chart.defaults.animation = false;
  }
}

function tooltipStyle(colors, label) {
  return {
    backgroundColor: colors.tooltipBg,
    titleColor: colors.tooltipFg,
    bodyColor: colors.tooltipFg,
    borderColor: colors.line,
    borderWidth: 1,
    callbacks: { label },
  };
}

const centerText = {
  id: 'centerText',
  afterDraw(chart) {
    const { ctx, chartArea } = chart;
    const { centerTotal: total, centerColors: colors } = chart.config.options;
    if (total == null || !colors) return;
    const x = (chartArea.left + chartArea.right) / 2;
    const y = (chartArea.top + chartArea.bottom) / 2;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = colors.muted;
    ctx.font = "400 12px 'Space Grotesk', sans-serif";
    ctx.fillText('Total gasto', x, y - 17);
    ctx.fillStyle = colors.text;
    ctx.font = "700 23px 'Space Grotesk', sans-serif";
    ctx.fillText(money.format(total), x, y + 9);
    ctx.restore();
  },
};

function renderDonut(list, colors) {
  const groups = groupExpensesByCategory(list);
  // Mesma ordem (maior primeiro) nas fatias e na legenda
  const entries = [...groups.entries()].sort((a, b) => b[1] - a[1]);
  const totalC = entries.reduce((s, [, v]) => s + v, 0);
  $('chart-empty').hidden = entries.length > 0;
  $('chart').hidden = entries.length === 0;
  if (donut) { donut.destroy(); donut = null; }

  const legend = $('legend');
  legend.replaceChildren();
  if (!entries.length) return;

  entries.forEach(([name, cents]) => {
    const li = document.createElement('li');
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = catColor(name, colors);
    const label = document.createElement('span');
    label.textContent = name;
    const pct = document.createElement('span');
    pct.className = 'pct';
    pct.textContent = `${Math.round((cents / totalC) * 100)}%`;
    li.append(dot, label, pct);
    legend.append(li);
  });

  donut = new Chart($('chart'), {
    type: 'doughnut',
    data: {
      labels: entries.map(([name]) => name),
      datasets: [{
        data: entries.map(([, cents]) => cents / 100),
        backgroundColor: entries.map(([name]) => catColor(name, colors)),
        borderColor: colors.card,
        hoverBorderColor: colors.card,
        borderWidth: 4,
        borderRadius: 6,
      }],
    },
    options: {
      cutout: '70%',
      centerTotal: totalC / 100,
      centerColors: colors,
      plugins: {
        legend: { display: false },
        tooltip: tooltipStyle(colors, (c) => ` ${c.label}: ${money.format(c.parsed)}`),
      },
    },
    plugins: [centerText],
  });
}

function syncRangeButtons() {
  document.querySelectorAll('.range-btn').forEach((b) => {
    b.setAttribute('aria-pressed', String(Number(b.getAttribute('data-range')) === trendRange));
  });
  $('trend').setAttribute('aria-label', `Gráfico de barras com as despesas dos últimos ${trendRange} meses`);
}

function renderTrend(month, colors) {
  syncRangeButtons();
  const end = month === 'all' ? todayISO().slice(0, 7) : month;
  const data = monthlyExpenseTotals(end, trendRange);
  if (trend) { trend.destroy(); trend = null; }
  trend = new Chart($('trend'), {
    type: 'bar',
    data: {
      labels: data.map((d) => d.label),
      datasets: [{
        data: data.map((d) => d.total),
        backgroundColor: data.map((d) => (d.key === month ? colors.barActive : colors.barIdle)),
        borderRadius: 14,
        borderSkipped: false,
        maxBarThickness: trendRange > 6 ? 24 : 36,
      }],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: tooltipStyle(colors, (c) => ` ${money.format(c.parsed.y)}`),
      },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { color: colors.muted } },
        y: { beginAtZero: true, border: { display: false }, grid: { color: colors.line }, ticks: { color: colors.muted } },
      },
    },
  });
}

// Só gráficos: usado também ao alternar o tema (não toca no resto da página)
function renderCharts(list, month) {
  const ok = chartAvailable();
  $('chart-fail').hidden = ok;
  $('trend-fail').hidden = ok;
  if (!ok) {
    $('chart').hidden = true;
    $('chart-empty').hidden = true;
    $('trend').hidden = true;
    return;
  }
  $('trend').hidden = false;
  try {
    const colors = themeColors();
    applyChartTheme(colors);
    renderDonut(list, colors);
    renderTrend(month, colors);
  } catch (err) {
    console.error('Erro ao desenhar os gráficos', err);
  }
}

/* ---------- Lista ---------- */
function renderList(list) {
  const ul = $('list');
  $('list-empty').hidden = list.length > 0;
  const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));
  ul.replaceChildren(...sorted.map((t) => {
    const li = document.createElement('li');
    const avatar = document.createElement('div');
    avatar.className = `avatar ${t.type}`;
    avatar.append(categoryIcon(t.category, t.type));
    const info = document.createElement('div');
    info.className = 'info';
    const title = document.createElement('span');
    title.textContent = t.description;
    const meta = document.createElement('span');
    meta.className = 'meta';
    if (t.id === editingId) {
      meta.append(categoryEditor(t), ` · ${formatDate(t.date)}`);
    } else {
      meta.textContent = `${t.category} · ${formatDate(t.date)}`;
    }
    info.append(title, meta);
    const amount = document.createElement('span');
    amount.className = `amount ${t.type}`;
    amount.textContent = (t.type === 'expense' ? '− ' : '+ ') + money.format(t.amount);
    const edit = document.createElement('button');
    edit.className = 'del edit';
    edit.type = 'button';
    edit.title = 'Alterar categoria';
    edit.setAttribute('aria-label', `Alterar categoria de ${t.description || t.category}`);
    edit.append(shapeIcon('pencil'));
    edit.addEventListener('click', () => { editingId = t.id; render(); focusEditor(); });
    const del = document.createElement('button');
    del.className = 'del';
    del.type = 'button';
    del.title = 'Eliminar';
    del.setAttribute('aria-label', `Eliminar ${t.description || t.category}`);
    del.textContent = '✕';
    del.addEventListener('click', () => {
      const removed = removeTransaction(t.id);
      if (!removed) return;
      render();
      reportSave(removed.ok);
      showToast('Transação eliminada.', 'Anular', () => {
        const ok = restoreTransaction(removed.t, removed.index);
        render();
        reportSave(ok);
      });
    });
    li.append(avatar, info, amount, edit, del);
    return li;
  }));
}

// Seletor de categoria inline (substitui o nome da categoria enquanto se edita)
let editingId = null;
function categoryEditor(t) {
  const names = CATEGORIES[t.type].slice();
  if (!names.includes(t.category)) names.unshift(t.category);
  const select = document.createElement('select');
  select.className = 'cat-edit';
  select.setAttribute('aria-label', 'Categoria');
  names.forEach((n) => select.append(new Option(n, n, false, n === t.category)));
  select.addEventListener('change', () => {
    const ok = setCategory(t.id, select.value);
    editingId = null;
    render();
    reportSave(ok);
  });
  select.addEventListener('blur', () => { if (editingId === t.id) { editingId = null; render(); } });
  select.addEventListener('keydown', (e) => { if (e.key === 'Escape') { editingId = null; render(); } });
  return select;
}
function focusEditor() {
  const el = document.querySelector('.cat-edit');
  if (el) el.focus();
}

function render() {
  fillMonths();
  const month = $('month-filter').value;
  const list = filterByMonth(transactions, month);
  view = { list, month };
  const totals = computeTotals(list);
  const bal = $('total-balance');
  setBig(bal, totals.balance);
  bal.classList.toggle('negative', totals.balance < 0);
  $('total-income').textContent = money.format(totals.income);
  $('total-expense').textContent = money.format(totals.expense);
  renderBudget(list, month);
  renderList(list);
  renderCharts(list, month); // por último: uma falha nos gráficos não afeta o resto
}

/* ---------- Eventos ---------- */
document.querySelectorAll('input[name="type"]').forEach((r) => r.addEventListener('change', fillCategories));
$('month-filter').addEventListener('change', () => {
  $('date').value = defaultDateFor($('month-filter').value);
  render();
});

$('currency-select').addEventListener('change', (e) => {
  if (!has(CURRENCIES, e.target.value)) return;
  currency = e.target.value;
  try { window.localStorage.setItem(CURRENCY_KEY, currency); } catch { /* vale só nesta sessão */ }
  applyCurrencyLabels();
  render();
});

// Ciclo: automático (sistema) → claro → escuro → automático
document.querySelectorAll('.range-btn').forEach((b) => {
  b.addEventListener('click', () => {
    const n = Number(b.getAttribute('data-range'));
    if (!RANGES.includes(n) || n === trendRange) return;
    trendRange = n;
    try { window.localStorage.setItem(RANGE_KEY, String(n)); } catch { /* só não persiste */ }
    renderCharts(view.list, view.month);
  });
});

$('theme-toggle').addEventListener('click', () => {
  const order = [null, 'light', 'dark'];
  themeChoice = order[(order.indexOf(themeChoice) + 1) % order.length];
  try {
    if (themeChoice) window.localStorage.setItem(THEME_KEY, themeChoice);
    else window.localStorage.removeItem(THEME_KEY);
  } catch { /* sem armazenamento: vale só nesta sessão */ }
  applyTheme();
  renderCharts(view.list, view.month);
});

// Alterações feitas noutro separador
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY || (e.key === null)) { transactions = load(); budgets = loadBudgets(); editingId = null; render(); }
  else if (e.key === BUDGET_KEY) { budgets = loadBudgets(); render(); }
  else if (e.key === CURRENCY_KEY) { currency = readCurrency(); applyCurrencyLabels(); render(); }
  else if (e.key === THEME_KEY) { themeChoice = readThemeChoice(); applyTheme(); renderCharts(view.list, view.month); }
});

if (darkQuery) {
  const onSystemChange = () => {
    if (themeChoice) return; // escolha explícita do utilizador prevalece
    applyTheme();
    renderCharts(view.list, view.month);
  };
  if (darkQuery.addEventListener) darkQuery.addEventListener('change', onSystemChange);
  else if (darkQuery.addListener) darkQuery.addListener(onSystemChange);
}

// Valor monetário com 2 casas; NaN se inválido ou fora dos limites
function parseMoney(raw) {
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return NaN;
  const v = Math.round((n + Number.EPSILON) * 100) / 100;
  return v <= MAX_AMOUNT ? v : NaN;
}

$('budget-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const month = $('month-filter').value;
  if (month === 'all') return;
  const raw = $('budget-input').value.trim();
  const value = raw === '' ? 0 : parseMoney(raw);
  if (Number.isNaN(value) || value < 0) {
    $('budget-error').textContent = 'Introduz um valor válido (0 ou mais).';
    return;
  }
  const ok = setBudget(month, value);
  render();
  if (!ok) $('budget-error').textContent = SAVE_ERROR;
});

$('form').addEventListener('submit', (e) => {
  e.preventDefault();
  const description = $('description').value.trim();
  const amount = parseMoney($('amount').value);
  const date = $('date').value;
  const error = $('error');
  if (!description) { error.textContent = 'Indica uma descrição.'; return; }
  if (!(amount > 0)) { error.textContent = 'Indica um valor entre 0,01 e 1 000 000 000.'; return; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { error.textContent = 'Indica uma data.'; return; }
  error.textContent = '';
  const ok = addTransaction({ type: selectedType(), description, amount, category: $('category').value, date });
  $('description').value = '';
  $('amount').value = '';
  // Mostra o mês da transação (o filtro salta para ele) para o registo ficar visível
  fillMonths();
  $('month-filter').value = date.slice(0, 7);
  render();
  reportSave(ok);
});

$('export-btn').addEventListener('click', () => {
  exportData();
  $('data-msg').textContent = `Ficheiro com ${transactions.length} transações exportado.`;
});
$('import-btn').addEventListener('click', () => $('import-file').click());
$('import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = ''; // permite voltar a escolher o mesmo ficheiro
  if (!file) return;
  const msg = $('data-msg');
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error('Ficheiro demasiado grande.');
    const r = importData(await file.text());
    editingId = null;
    render();
    msg.textContent = `${r.added} transações importadas` +
      (r.skipped ? `, ${r.skipped} já existiam` : '') +
      (r.budgetsAdded ? `, ${r.budgetsAdded} orçamentos novos` : '') + '.' +
      (r.ok ? '' : ` ${SAVE_ERROR}`);
  } catch (err) {
    msg.textContent = err.message || 'Não foi possível importar o ficheiro.';
  }
});

(function greet() {
  const h = new Date().getHours();
  $('greeting').textContent = h < 12 ? 'Bom dia' : h < 20 ? 'Boa tarde' : 'Boa noite';
})();

applyTheme();
applyCurrencyLabels();
$('date').value = todayISO();
fillCategories();
render();
requestAnimationFrame(() => root.classList.add('theme-ready'));

/* ---------- Animações ao fazer scroll ---------- */
(function scrollEffects() {
  const targets = [...document.querySelectorAll('.app > section')];
  if (typeof IntersectionObserver === 'undefined' || !targets.length) return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  const show = (el) => el.classList.add('in');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      show(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
  targets.forEach((el, i) => {
    el.style.setProperty('--d', `${(i % 3) * 80}ms`);
    el.classList.add('reveal');
    io.observe(el);
  });
  // Rede de segurança: nada fica escondido se o observer falhar
  setTimeout(() => targets.forEach(show), 2500);

  // Destaca o item ativo da navegação
  const links = [...document.querySelectorAll('.nav a[href^="#"]')];
  const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const setActive = (a) => {
    links.forEach((l) => { l.classList.remove('active'); l.removeAttribute('aria-current'); });
    if (a) { a.classList.add('active'); a.setAttribute('aria-current', 'location'); }
  };
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const a = byId.get(e.target.id);
      if (a && e.isIntersecting) setActive(a);
    });
  }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
  byId.forEach((_, id) => { const el = document.getElementById(id); if (el) spy.observe(el); });
  window.addEventListener('scroll', () => { if (window.scrollY < 40) setActive(null); }, { passive: true });
})();

// Instalação/offline no telemóvel (só em http/https)
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}
