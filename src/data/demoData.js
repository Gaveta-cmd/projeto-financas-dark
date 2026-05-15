function iso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
}

function inMonth(monthOffset, day) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + monthOffset);
  const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, maxDay));
  return iso(d);
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
}

function monthsFromNow(n) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  return iso(d);
}

export const DEMO_USER = {
  name: 'Davi Augusto',
  email: 'demo@vibeFinance.app',
};

export const DEMO_SESSION = {
  user: {
    id: 'demo-user-id',
    email: DEMO_USER.email,
    user_metadata: { full_name: DEMO_USER.name, birth_date: '1998-05-10' },
  },
};

export const DEMO_ACCOUNTS = [
  { id: 'demo-acc-nubank', bank: 'nubank', label: 'Nubank', balance: 2200, color: '#8b5cf6' },
  { id: 'demo-acc-inter',  bank: 'inter',  label: 'Inter',  balance: 1620, color: '#ec4899' },
];

// Total income: 16.600 | Total expenses: 7.970 | Net: 8.630
// bankBalance: 3.820 → saldo total ≈ R$ 12.450
export const DEMO_TRANSACTIONS = [
  // Mês atual
  { id: 'dt-01', title: 'Salário', amount: 5200, category: 'outros', type: 'income', date: daysAgo(9), created_at: daysAgo(9) },
  { id: 'dt-02', title: 'Freelance Dev', amount: 1000, category: 'outros', type: 'income', date: daysAgo(4), created_at: daysAgo(4) },
  { id: 'dt-03', title: 'Aluguel', amount: 1800, category: 'moradia', type: 'expense', date: daysAgo(11), created_at: daysAgo(11) },
  { id: 'dt-04', title: 'Supermercado Extra', amount: 420, category: 'alimentacao', type: 'expense', date: daysAgo(6), created_at: daysAgo(6) },
  { id: 'dt-05', title: 'iFood', amount: 95, category: 'alimentacao', type: 'expense', date: daysAgo(2), created_at: daysAgo(2) },
  { id: 'dt-06', title: 'Farmácia São João', amount: 67, category: 'saude', type: 'expense', date: daysAgo(5), created_at: daysAgo(5) },
  { id: 'dt-07', title: 'Uber', amount: 38, category: 'transporte', type: 'expense', date: daysAgo(3), created_at: daysAgo(3) },
  { id: 'dt-08', title: 'Cinema', amount: 65, category: 'lazer', type: 'expense', date: daysAgo(7), created_at: daysAgo(7) },

  // Mês anterior
  { id: 'dt-09', title: 'Salário', amount: 5200, category: 'outros', type: 'income', date: inMonth(-1, 5), created_at: inMonth(-1, 5) },
  { id: 'dt-10', title: 'Aluguel', amount: 1800, category: 'moradia', type: 'expense', date: inMonth(-1, 3), created_at: inMonth(-1, 3) },
  { id: 'dt-11', title: 'Mercado Pão de Açúcar', amount: 380, category: 'alimentacao', type: 'expense', date: inMonth(-1, 10), created_at: inMonth(-1, 10) },
  { id: 'dt-12', title: 'Restaurante Outback', amount: 165, category: 'alimentacao', type: 'expense', date: inMonth(-1, 14), created_at: inMonth(-1, 14) },
  { id: 'dt-13', title: 'Plano de Saúde', amount: 180, category: 'saude', type: 'expense', date: inMonth(-1, 7), created_at: inMonth(-1, 7) },
  { id: 'dt-14', title: 'Gasolina Shell', amount: 160, category: 'transporte', type: 'expense', date: inMonth(-1, 18), created_at: inMonth(-1, 18) },
  { id: 'dt-15', title: 'Show de Rock', amount: 220, category: 'lazer', type: 'expense', date: inMonth(-1, 22), created_at: inMonth(-1, 22) },
  { id: 'dt-16', title: 'Livros de Tecnologia', amount: 150, category: 'outros', type: 'expense', date: inMonth(-1, 25), created_at: inMonth(-1, 25) },

  // Dois meses atrás
  { id: 'dt-17', title: 'Salário', amount: 5200, category: 'outros', type: 'income', date: inMonth(-2, 5), created_at: inMonth(-2, 5) },
  { id: 'dt-18', title: 'Aluguel', amount: 1800, category: 'moradia', type: 'expense', date: inMonth(-2, 3), created_at: inMonth(-2, 3) },
  { id: 'dt-19', title: 'Supermercado', amount: 350, category: 'alimentacao', type: 'expense', date: inMonth(-2, 12), created_at: inMonth(-2, 12) },
  { id: 'dt-20', title: 'Seguro Auto', amount: 280, category: 'transporte', type: 'expense', date: inMonth(-2, 20), created_at: inMonth(-2, 20) },
];

export const DEMO_INSTALLMENTS = [
  {
    id: 'di-01',
    name: 'iPhone 15 Pro',
    total_amount: 7999,
    installment_amount: 666.58,
    total_installments: 12,
    paid_installments: 10,
    start_date: inMonth(-10, 1),
    created_at: inMonth(-10, 1),
  },
  {
    id: 'di-02',
    name: 'Notebook Dell XPS',
    total_amount: 6500,
    installment_amount: 541.67,
    total_installments: 12,
    paid_installments: 5,
    start_date: inMonth(-5, 1),
    created_at: inMonth(-5, 1),
  },
  {
    id: 'di-03',
    name: 'Geladeira Brastemp',
    total_amount: 3200,
    installment_amount: 533.33,
    total_installments: 6,
    paid_installments: 3,
    start_date: inMonth(-3, 15),
    created_at: inMonth(-3, 15),
  },
  {
    id: 'di-04',
    name: 'Curso React Avançado',
    total_amount: 800,
    installment_amount: 200,
    total_installments: 4,
    paid_installments: 2,
    start_date: inMonth(-2, 1),
    created_at: inMonth(-2, 1),
  },
  {
    id: 'di-05',
    name: 'Smart TV Samsung 4K',
    total_amount: 2400,
    installment_amount: 400,
    total_installments: 6,
    paid_installments: 6,
    start_date: inMonth(-6, 1),
    created_at: inMonth(-6, 1),
  },
];

export const DEMO_SUBSCRIPTIONS = [
  {
    id: 'ds-01',
    name: 'Netflix',
    amount: 55,
    billing_cycle: 'monthly',
    category: 'entretenimento',
    color: '#ef233c',
    next_billing_date: daysFromNow(6),
    created_at: inMonth(-6, 1),
  },
  {
    id: 'ds-02',
    name: 'Spotify',
    amount: 21,
    billing_cycle: 'monthly',
    category: 'entretenimento',
    color: '#10b981',
    next_billing_date: daysFromNow(11),
    created_at: inMonth(-8, 1),
  },
  {
    id: 'ds-03',
    name: 'Smart Fit',
    amount: 89,
    billing_cycle: 'monthly',
    category: 'saude',
    color: '#ec4899',
    next_billing_date: daysFromNow(4),
    created_at: inMonth(-12, 1),
  },
  {
    id: 'ds-04',
    name: 'GitHub Pro',
    amount: 25,
    billing_cycle: 'monthly',
    category: 'produtividade',
    color: '#71717a',
    next_billing_date: daysFromNow(14),
    created_at: inMonth(-3, 1),
  },
  {
    id: 'ds-05',
    name: 'ChatGPT Plus',
    amount: 105,
    billing_cycle: 'monthly',
    category: 'produtividade',
    color: '#8b5cf6',
    next_billing_date: daysFromNow(8),
    created_at: inMonth(-5, 1),
  },
];

export const DEMO_CARDS = [
  { id: 'dc-01', name: 'Nubank Roxo', limit_amount: 8000, used_amount: 3200, color: '#8b5cf6' },
  { id: 'dc-02', name: 'Inter',       limit_amount: 5000, used_amount: 1800, color: '#ec4899' },
];

export const DEMO_GOALS = [
  {
    id: 'dg-01',
    name: 'Viagem Europa',
    target_amount: 15000,
    current_amount: 6200,
    deadline: monthsFromNow(13),
    color: '#6366f1',
    category: 'viagem',
    created_at: inMonth(-3, 1),
  },
  {
    id: 'dg-02',
    name: 'Reserva de emergência',
    target_amount: 10000,
    current_amount: 4500,
    deadline: monthsFromNow(7),
    color: '#10b981',
    category: 'emergencia',
    created_at: inMonth(-5, 1),
  },
  {
    id: 'dg-03',
    name: 'Notebook novo',
    target_amount: 5000,
    current_amount: 2800,
    deadline: monthsFromNow(3),
    color: '#f59e0b',
    category: 'eletronico',
    created_at: inMonth(-2, 1),
  },
];

export const DEMO_DATA = {
  transactions: DEMO_TRANSACTIONS,
  installments: DEMO_INSTALLMENTS,
  subscriptions: DEMO_SUBSCRIPTIONS,
  cards: DEMO_CARDS,
  goals: DEMO_GOALS,
  accounts: DEMO_ACCOUNTS,
};
