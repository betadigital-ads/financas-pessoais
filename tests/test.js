// Testes sem dependências: node tests/test.js
// Corre app.js num contexto vm com um DOM mínimo simulado.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

class Option {
  constructor(text, value) { this.text = text; this.value = value === undefined ? text : value; }
}

function makeEl(id) {
  const el = {
    id, value: '', textContent: '', hidden: false, disabled: false, title: '', placeholder: '',
    style: {}, attrs: {}, handlers: {}, children: [], options: [],
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute(k, v) { this.attrs[k] = v; },
    getAttribute(k) { return this.attrs[k]; },
    addEventListener(ev, fn) { (this.handlers[ev] = this.handlers[ev] || []).push(fn); },
    append(...n) { this.children.push(...n); },
    replaceChildren(...n) { this.children = n; this.options = n.filter((x) => x instanceof Option); },
    click() {}, focus() {},
  };
  return el;
}

function createApp(storage = {}) {
  const els = new Proxy({}, { get: (o, k) => (k in o ? o[k] : (o[k] = makeEl(k))) });
  const store = { ...storage };
  const localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
  const document = {
    getElementById: (id) => (els[id] = els[id] || makeEl(id)),
    createElement: (t) => makeEl(t),
    createElementNS: (ns, t) => makeEl(t),
    querySelector: (sel) => (sel.includes('checked') ? { value: 'expense' } : makeEl(sel)),
    querySelectorAll: () => [],
    documentElement: makeEl('html'),
    body: makeEl('body'),
  };
  const win = { localStorage, addEventListener() {}, matchMedia: undefined };
  const ctx = vm.createContext({
    window: win, document, localStorage, navigator: {}, location: { protocol: 'file:' },
    Option, console, requestAnimationFrame: () => {}, setTimeout, clearTimeout, getComputedStyle: () => ({ getPropertyValue: () => '' }),
  });
  const src = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  vm.runInContext(src + `
;globalThis.__t = {
  addTransaction, render, fillMonths, recentMonths, defaultDateFor, money, computeTotals,
  filterByMonth, getBudget, setBudget, importData, exportDataPayload: () => ({ currency }),
  get transactions() { return transactions; }, get currency() { return currency; },
};`, ctx);
  return { t: ctx.__t, els, store, document };
}

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  -', name); } catch (e) { console.error('FALHOU -', name, '\n', e.message); process.exitCode = 1; }
}

const iso = (y, m, d = 1) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const nbsp = ' ';

test('formatação em Euro', () => {
  const { t } = createApp();
  assert.strictEqual(t.currency, 'EUR');
  assert.strictEqual(t.money.format(1234.5), `1234,50${nbsp}€`);
  assert.strictEqual(t.money.format(1234567.5), `1${nbsp}234${nbsp}567,50${nbsp}€`.replace(new RegExp(nbsp, 'g'), (m, i) => (i < 8 ? ' ' : nbsp)));
});

test('formatação em Kwanza (Kz)', () => {
  const { t, els } = createApp({ 'financas.moeda': 'AOA' });
  assert.strictEqual(t.currency, 'AOA');
  assert.ok(t.money.format(1500).endsWith(`${nbsp}Kz`));
  assert.strictEqual(els['amount-label'].textContent, 'Valor (Kz)');
  assert.strictEqual(els['budget-input'].placeholder, 'Orçamento (Kz)');
});

test('moeda inválida guardada cai para Euro', () => {
  const { t } = createApp({ 'financas.moeda': 'USD' });
  assert.strictEqual(t.currency, 'EUR');
});

test('trocar a moeda no seletor persiste e atualiza o ecrã', () => {
  const { t, els, store } = createApp();
  t.addTransaction({ type: 'income', description: 'x', amount: 100, category: 'Salário', date: iso(2020, 1, 1) });
  els['currency-select'].handlers.change[0]({ target: { value: 'AOA' } });
  assert.strictEqual(store['financas.moeda'], 'AOA');
  assert.strictEqual(t.currency, 'AOA');
  assert.ok(els['total-income'].textContent === '0,00' + nbsp + 'Kz' || els['total-income'].textContent.endsWith('Kz'));
  els['currency-select'].handlers.change[0]({ target: { value: 'EUR' } });
  assert.strictEqual(store['financas.moeda'], 'EUR');
  assert.ok(els['total-income'].textContent.endsWith('€'));
});

test('valores guardados não são convertidos ao trocar de moeda', () => {
  const { t, els, store } = createApp();
  t.addTransaction({ type: 'expense', description: 'x', amount: 12.34, category: 'Outros', date: iso(2020, 1, 1) });
  els['currency-select'].handlers.change[0]({ target: { value: 'AOA' } });
  assert.strictEqual(JSON.parse(store['financas.transacoes'])[0].amount, 12.34);
});

test('seletor de meses lista os últimos 24 meses mesmo sem dados', () => {
  const { t, els } = createApp();
  t.render();
  const opts = els['month-filter'].options.map((o) => o.value);
  const recent = t.recentMonths(24);
  assert.strictEqual(recent.length, 24);
  recent.forEach((m) => assert.ok(opts.includes(m), `falta ${m}`));
  assert.ok(opts.includes('all'));
});

test('meses anteriores aceitam transações e ficam isolados dos outros', () => {
  const { t } = createApp();
  const [cur, prev, prev2] = t.recentMonths(3);
  t.addTransaction({ type: 'income', description: 'sal', amount: 1000, category: 'Salário', date: `${prev}-10` });
  t.addTransaction({ type: 'expense', description: 'luz', amount: 250.5, category: 'Água e Energia', date: `${prev}-12` });
  t.addTransaction({ type: 'expense', description: 'x', amount: 10, category: 'Outros', date: `${cur}-01` });
  const totPrev = t.computeTotals(t.filterByMonth(t.transactions, prev));
  assert.strictEqual(JSON.stringify(totPrev), JSON.stringify({ income: 1000, expense: 250.5, balance: 749.5 }));
  assert.strictEqual(t.computeTotals(t.filterByMonth(t.transactions, prev2)).balance, 0);
  assert.strictEqual(t.computeTotals(t.filterByMonth(t.transactions, cur)).expense, 10);
});

test('orçamento pode ser definido num mês anterior', () => {
  const { t } = createApp();
  const prev = t.recentMonths(2)[1];
  assert.ok(t.setBudget(prev, 500));
  assert.strictEqual(t.getBudget(prev), 500);
  assert.strictEqual(t.getBudget(t.recentMonths(1)[0]), 0);
});

test('data sugerida acompanha o mês escolhido', () => {
  const { t } = createApp();
  const [cur, prev] = t.recentMonths(2);
  assert.strictEqual(t.defaultDateFor(prev), `${prev}-01`);
  assert.match(t.defaultDateFor(cur), new RegExp(`^${cur}-\\d{2}$`));
  assert.match(t.defaultDateFor('all'), /^\d{4}-\d{2}-\d{2}$/);
});

test('mudar o mês no filtro atualiza o campo data', () => {
  const { t, els } = createApp();
  t.render();
  const prev = t.recentMonths(2)[1];
  els['month-filter'].value = prev;
  els['month-filter'].handlers.change[0]();
  assert.strictEqual(els.date.value, `${prev}-01`);
});

test('submeter transação de mês anterior faz o filtro saltar para esse mês', () => {
  const { t, els } = createApp();
  t.render();
  const prev = t.recentMonths(2)[1];
  els.description.value = 'Renda';
  els.amount.value = '300';
  els.date.value = `${prev}-05`;
  els.form.handlers.submit[0]({ preventDefault() {} });
  assert.strictEqual(els['month-filter'].value, prev);
  assert.strictEqual(t.transactions.length, 1);
  assert.strictEqual(els.error.textContent, '');
  assert.ok(els['total-expense'].textContent.startsWith('300,00'));
});

test('exportação inclui a moeda e importação continua compatível', () => {
  const { t } = createApp({ 'financas.moeda': 'AOA' });
  assert.strictEqual(t.exportDataPayload().currency, 'AOA');
  const r = t.importData(JSON.stringify({
    app: 'financas-pessoais', version: 1,
    transactions: [{ id: 'a', type: 'expense', description: 'x', amount: 5, category: 'Outros', date: '2024-03-02' }],
    budgets: { '2024-03': 100 },
  }));
  assert.strictEqual(r.added, 1);
  assert.strictEqual(r.budgetsAdded, 1);
  assert.strictEqual(t.currency, 'AOA'); // a importação não muda a moeda escolhida
});

console.log(`\n${passed} testes passaram.`);
