// =====================================================================
// bankSeed.js — simulação de "conectar banco".
//
// O app não fala com bancos reais; "conectar" é uma simulação. Pra que
// o resto da experiência (Visão Geral, Transações, Categorias, Gráfico
// mensal, Parcelamentos, Assinaturas) tenha conteúdo realista, ao
// conectar um banco a gente popula o Supabase com:
//   - 20 transações dos últimos 90 dias (mix de receitas e despesas);
//   - 3 parcelamentos em andamento (iPhone, Notebook, TV);
//   - 3 assinaturas mensais (Netflix, Spotify, Academia).
//
// Cada banco gera dados com perfil próprio:
//   - Bancos digitais (Nubank, Inter, C6, PicPay) → mais delivery,
//     transporte por app e streaming.
//   - Bancos tradicionais (Itaú, Bradesco, Santander, Caixa) → mais
//     supermercado, combustível e contas físicas.
//
// Identificação:
//   Cada linha inserida leva `bank_source = bank.id`. Isso permite a
//   limpeza precisa em clearBankData via `eq('bank_source', bank.id)`,
//   sem afetar registros criados manualmente pelo usuário (que ficam
//   com bank_source = NULL).
//
// Pré-requisito: migration 20260511050000_bank_source.sql aplicada.
// =====================================================================

import { supabase } from './supabaseClient';

// ─── Helpers ────────────────────────────────────────────────────────────────
function isoDay(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDay(d);
}

function daysAhead(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return isoDay(d);
}

// Variação leve (±10%) em valores monetários pra que cada banco
// mostre números levemente diferentes.
function jitter(base) {
  const factor = 0.90 + Math.random() * 0.20;
  return Number((base * factor).toFixed(2));
}

// ─── Classificação dos bancos ───────────────────────────────────────────────
const DIGITAL_BANKS = new Set(['nubank', 'inter', 'c6', 'picpay']);

function profileOf(bank) {
  return DIGITAL_BANKS.has(bank.id) ? 'digital' : 'tradicional';
}

// ─── Templates de transações por perfil ─────────────────────────────────────
// Datas em "dias atrás" para espalhar pelos últimos ~90 dias.
// (date, title, amount, category, type)

const DIGITAL_TRANSACTIONS = [
  // Receitas
  { d: 2,  title: 'Salário',                 amount: 4500,   category: 'outros',      type: 'income'  },
  { d: 35, title: 'Freelance Design',        amount: 850,    category: 'outros',      type: 'income'  },

  // Alimentação — delivery pesado
  { d: 3,  title: 'iFood',                   amount: 48,     category: 'alimentacao', type: 'expense' },
  { d: 8,  title: 'iFood',                   amount: 67,     category: 'alimentacao', type: 'expense' },
  { d: 18, title: 'iFood',                   amount: 35,     category: 'alimentacao', type: 'expense' },
  { d: 25, title: 'Rappi',                   amount: 89,     category: 'alimentacao', type: 'expense' },
  { d: 42, title: 'iFood',                   amount: 52,     category: 'alimentacao', type: 'expense' },
  { d: 60, title: 'Uber Eats',               amount: 78,     category: 'alimentacao', type: 'expense' },

  // Transporte — apps
  { d: 5,  title: 'Uber',                    amount: 28,     category: 'transporte',  type: 'expense' },
  { d: 12, title: 'Uber',                    amount: 45,     category: 'transporte',  type: 'expense' },
  { d: 22, title: '99',                      amount: 22,     category: 'transporte',  type: 'expense' },
  { d: 50, title: 'Uber',                    amount: 38,     category: 'transporte',  type: 'expense' },

  // Lazer — streaming/games (entradas recentes garantem dados no mês atual
  // pra Regra 50/30/20 ter "wants" não-zerado logo após conectar o banco)
  { d: 4,  title: 'Netflix',                 amount: 44.90,  category: 'lazer',       type: 'expense' },
  { d: 9,  title: 'Spotify',                 amount: 21.90,  category: 'lazer',       type: 'expense' },
  { d: 15, title: 'Steam',                   amount: 89,     category: 'lazer',       type: 'expense' },
  { d: 30, title: 'Amazon Prime Video',      amount: 19.90,  category: 'lazer',       type: 'expense' },
  { d: 70, title: 'PlayStation Store',       amount: 199,    category: 'lazer',       type: 'expense' },

  // Moradia
  { d: 6,  title: 'Internet Vivo Fibra',     amount: 99.90,  category: 'moradia',     type: 'expense' },
  { d: 27, title: 'Aluguel',                 amount: 1500,   category: 'moradia',     type: 'expense' },
  { d: 33, title: 'Conta de Luz',            amount: 145,    category: 'moradia',     type: 'expense' },

  // Saúde
  { d: 20, title: 'Farmácia Drogasil',       amount: 67,     category: 'saude',       type: 'expense' },

  // Outros
  { d: 45, title: 'Amazon',                  amount: 159,    category: 'outros',      type: 'expense' },
];

const TRADICIONAL_TRANSACTIONS = [
  // Receitas
  { d: 2,  title: 'Salário',                       amount: 5800, category: 'outros',      type: 'income'  },
  { d: 40, title: '13º Salário',                   amount: 2400, category: 'outros',      type: 'income'  },

  // Alimentação — supermercado e padaria física
  { d: 4,  title: 'Supermercado Extra',            amount: 425,  category: 'alimentacao', type: 'expense' },
  { d: 7,  title: 'Padaria Real',                  amount: 32,   category: 'alimentacao', type: 'expense' },
  { d: 11, title: 'Açougue Bom Boi',               amount: 178,  category: 'alimentacao', type: 'expense' },
  { d: 22, title: 'Supermercado Pão de Açúcar',    amount: 287,  category: 'alimentacao', type: 'expense' },
  { d: 28, title: 'Padaria Real',                  amount: 28,   category: 'alimentacao', type: 'expense' },
  { d: 55, title: 'Supermercado Extra',            amount: 380,  category: 'alimentacao', type: 'expense' },

  // Transporte — combustível e mecânico
  { d: 5,  title: 'Posto Shell',                   amount: 220,  category: 'transporte',  type: 'expense' },
  { d: 18, title: 'Posto Ipiranga',                amount: 195,  category: 'transporte',  type: 'expense' },
  { d: 38, title: 'Mecânico Auto Center',          amount: 350,  category: 'transporte',  type: 'expense' },
  { d: 65, title: 'Posto BR',                      amount: 240,  category: 'transporte',  type: 'expense' },

  // Moradia — várias contas
  { d: 10, title: 'Conta de Luz',                  amount: 285,  category: 'moradia',     type: 'expense' },
  { d: 14, title: 'Conta de Água',                 amount: 95,   category: 'moradia',     type: 'expense' },
  { d: 25, title: 'Internet Vivo',                 amount: 119.90, category: 'moradia',   type: 'expense' },
  { d: 27, title: 'Aluguel',                       amount: 1800, category: 'moradia',     type: 'expense' },
  { d: 28, title: 'Condomínio',                    amount: 480,  category: 'moradia',     type: 'expense' },

  // Saúde
  { d: 16, title: 'Farmácia São Paulo',            amount: 89,   category: 'saude',       type: 'expense' },
  { d: 30, title: 'Plano de Saúde Unimed',         amount: 320,  category: 'saude',       type: 'expense' },

  // Lazer — inclui entradas recentes pra Regra 50/30/20 enxergar "wants"
  // no mês atual logo após conectar o banco
  { d: 3,  title: 'Ingresso Show',                 amount: 120,  category: 'lazer',       type: 'expense' },
  { d: 8,  title: 'Cinema Cinemark',               amount: 65,   category: 'lazer',       type: 'expense' },
  { d: 33, title: 'Cinema Cinemark',               amount: 65,   category: 'lazer',       type: 'expense' },
];

function buildTransactions(bank) {
  const profile = profileOf(bank);
  const tpl = profile === 'digital' ? DIGITAL_TRANSACTIONS : TRADICIONAL_TRANSACTIONS;
  return tpl.map((t) => ({
    title:       t.title,
    amount:      jitter(t.amount),
    category:    t.category,
    type:        t.type,
    date:        daysAgo(t.d),
    bank_source: bank.id,
  }));
}

// ─── Templates de parcelamentos (3 por banco) ───────────────────────────────
function buildInstallments(bank) {
  // Os totais sofrem leve jitter pra cada banco mostrar números diferentes.
  // installment_amount é derivado do total.
  const items = [
    { name: 'iPhone 15 Pro',  base: 11400, count: 12, paid: 6, startedDaysAgo: 180 },
    { name: 'Notebook',       base: 4800,  count: 10, paid: 3, startedDaysAgo: 90  },
    { name: 'TV Samsung',     base: 2280,  count: 6,  paid: 2, startedDaysAgo: 60  },
  ];
  return items.map((i) => {
    const total = jitter(i.base);
    return {
      name:               i.name,
      total_amount:       total,
      installment_amount: Number((total / i.count).toFixed(2)),
      total_installments: i.count,
      paid_installments:  i.paid,
      start_date:         daysAgo(i.startedDaysAgo),
      bank_source:        bank.id,
    };
  });
}

// ─── Templates de assinaturas (3 por banco) ─────────────────────────────────
function buildSubscriptions(bank) {
  return [
    {
      name:              'Netflix',
      amount:            44.90,
      billing_cycle:     'monthly',
      category:          'entretenimento',
      color:             '#ef233c',
      next_billing_date: daysAhead(8),
      bank_source:       bank.id,
    },
    {
      name:              'Spotify',
      amount:            21.90,
      billing_cycle:     'monthly',
      category:          'entretenimento',
      color:             '#10b981',
      next_billing_date: daysAhead(15),
      bank_source:       bank.id,
    },
    {
      name:              'Academia',
      amount:            89.90,
      billing_cycle:     'monthly',
      category:          'saude',
      color:             '#f59e0b',
      next_billing_date: daysAhead(22),
      bank_source:       bank.id,
    },
  ];
}

// ─── API pública ────────────────────────────────────────────────────────────
/**
 * Insere dados de demonstração no Supabase para um banco recém-conectado.
 * Cada tabela falha de forma isolada — uma quebra (ex.: tabela ainda sem
 * migration aplicada) não impede as outras de seguirem.
 */
export async function seedBankData(bank) {
  const [txRes, subRes, insRes] = await Promise.all([
    supabase.from('transactions').insert(buildTransactions(bank)),
    supabase.from('subscriptions').insert(buildSubscriptions(bank)),
    supabase.from('installments').insert(buildInstallments(bank)),
  ]);
  return {
    transactions:  !txRes.error,
    subscriptions: !subRes.error,
    installments:  !insRes.error,
    errors: [txRes.error, subRes.error, insRes.error].filter(Boolean),
  };
}

/**
 * Remove os dados de demonstração de um banco específico — match por
 * `bank_source = bank.id`. Linhas criadas manualmente pelo usuário
 * (bank_source = NULL) ficam intactas. Best-effort: se algo falhar a
 * desconexão local prossegue normalmente.
 */
export async function clearBankData(bank) {
  await Promise.all([
    supabase.from('transactions').delete().eq('bank_source', bank.id),
    supabase.from('subscriptions').delete().eq('bank_source', bank.id),
    supabase.from('installments').delete().eq('bank_source', bank.id),
  ]);
}

/**
 * Backfill: bancos conectados ANTES desta versão do seed ficaram sem
 * transações de "lazer" no mês atual, o que zera o bloco "Lazer (30%)"
 * na Regra 50/30/20. Esta função detecta a falta e insere apenas o que
 * está faltando — não duplica nada se o lazer atual já existir.
 *
 * Roda como best-effort: erros são silenciados pra não atrapalhar a UI.
 * Retorna o número de transações inseridas (0 quando nada faltava).
 */
export async function backfillMissingLazer() {
  // Primeiro dia do mês corrente, no horário local, em ISO 'YYYY-MM-DD'.
  const today = new Date();
  const monthStart = isoDay(new Date(today.getFullYear(), today.getMonth(), 1));

  // Quais bancos seedados o usuário tem? (DISTINCT em bank_source não-nulo
  // do mês atual ou anterior — basta saber quais bancos têm seed presente.)
  const { data: existing, error: existErr } = await supabase
    .from('transactions')
    .select('bank_source, category, date')
    .not('bank_source', 'is', null);

  if (existErr || !existing) return 0;

  // Agrupa por bank_source: precisa de lazer no mês atual? Já tem?
  const bySource = new Map();
  for (const row of existing) {
    const entry = bySource.get(row.bank_source) ?? { hasAnyLazerThisMonth: false };
    if (row.category === 'lazer' && row.date >= monthStart) {
      entry.hasAnyLazerThisMonth = true;
    }
    bySource.set(row.bank_source, entry);
  }

  const toInsert = [];
  for (const [bankId, info] of bySource.entries()) {
    if (info.hasAnyLazerThisMonth) continue;
    // Insere o mesmo template de lazer recente que o seed novo usa.
    // Usa perfil "digital" como padrão — valores leves e nomes neutros.
    toInsert.push(
      { title: 'Netflix', amount: jitter(44.90), category: 'lazer', type: 'expense', date: daysAgo(4), bank_source: bankId },
      { title: 'Spotify', amount: jitter(21.90), category: 'lazer', type: 'expense', date: daysAgo(9), bank_source: bankId },
    );
  }

  if (toInsert.length === 0) return 0;

  const { error: insErr } = await supabase.from('transactions').insert(toInsert);
  return insErr ? 0 : toInsert.length;
}
