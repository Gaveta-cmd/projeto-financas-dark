// =====================================================================
// bankSeed.js — simulação de "conectar banco".
//
// O app não fala com bancos reais; "conectar" é uma simulação. Pra que
// o resto da experiência (Visão Geral, Transações, Categorias, Gráfico
// mensal, Parcelamentos, Assinaturas) tenha conteúdo realista, ao
// conectar um banco a gente popula o Supabase com:
//   - 20 transações dos últimos 90 dias (mix de receitas e despesas);
//   - 3 parcelamentos em andamento (iPhone, Notebook, TV);
//   - 3 assinaturas mensais — catálogo PRÓPRIO por banco (ver
//     SUBSCRIPTIONS_BY_BANK) pra não repetir "Netflix" 8 vezes quando
//     o usuário conecta vários bancos.
//
// Cada banco gera dados com perfil próprio:
//   - Bancos digitais (Nubank, Inter, C6, PicPay) → mais delivery,
//     transporte por app e streaming.
//   - Bancos tradicionais (Itaú, Bradesco, Santander, Caixa) → mais
//     supermercado, combustível e contas físicas.
//
// Dedup ao conectar:
//   - Transações: dedup por (title, mês). Salário/Aluguel/Netflix de
//     um banco bloqueia o mesmo título no mesmo mês de outros bancos.
//   - Assinaturas e parcelamentos: dedup por `name`. Idempotente.
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
// Cada banco tem seu próprio mix pra ficar mais realista quando o usuário
// conecta vários — em vez de aparecer "Netflix" 8 vezes, cada banco contribui
// com serviços diferentes. Categoria precisa respeitar o CHECK do banco:
// ('entretenimento', 'saude', 'produtividade', 'educacao', 'outros').
const SUBSCRIPTIONS_BY_BANK = {
  nubank: [
    { name: 'Netflix',            amount: 44.90, category: 'entretenimento', color: '#ef233c', next: 8  },
    { name: 'Spotify',            amount: 21.90, category: 'entretenimento', color: '#10b981', next: 15 },
    { name: 'Academia',           amount: 89.90, category: 'saude',          color: '#f59e0b', next: 22 },
  ],
  inter: [
    { name: 'Disney+',            amount: 33.90, category: 'entretenimento', color: '#0ea5e9', next: 10 },
    { name: 'Deezer',             amount: 19.90, category: 'entretenimento', color: '#ec4899', next: 18 },
    { name: 'Duolingo',           amount: 35.90, category: 'educacao',       color: '#10b981', next: 25 },
  ],
  itau: [
    { name: 'HBO Max',            amount: 39.90, category: 'entretenimento', color: '#8b5cf6', next: 7  },
    { name: 'Apple Music',        amount: 21.90, category: 'entretenimento', color: '#ef233c', next: 14 },
    { name: 'Plano de Saúde',     amount: 320.00, category: 'saude',         color: '#10b981', next: 21 },
  ],
  bradesco: [
    { name: 'Amazon Prime',       amount: 14.90, category: 'entretenimento', color: '#0ea5e9', next: 9  },
    { name: 'Youtube Premium',    amount: 24.90, category: 'entretenimento', color: '#ef233c', next: 16 },
    { name: 'Academia',           amount: 89.90, category: 'saude',          color: '#f59e0b', next: 22 },
  ],
  c6: [
    { name: 'Crunchyroll',        amount: 24.90, category: 'entretenimento', color: '#f59e0b', next: 11 },
    { name: 'Spotify',            amount: 21.90, category: 'entretenimento', color: '#10b981', next: 17 },
    { name: 'iCloud',             amount: 14.90, category: 'produtividade',  color: '#71717a', next: 24 },
  ],
  picpay: [
    { name: 'Netflix',            amount: 44.90, category: 'entretenimento', color: '#ef233c', next: 8  },
    { name: 'Twitch Turbo',       amount: 17.90, category: 'entretenimento', color: '#8b5cf6', next: 13 },
    { name: 'Canva Pro',          amount: 39.90, category: 'produtividade',  color: '#0ea5e9', next: 20 },
  ],
  santander: [
    { name: 'HBO Max',            amount: 39.90, category: 'entretenimento', color: '#8b5cf6', next: 10 },
    { name: 'Deezer',             amount: 19.90, category: 'entretenimento', color: '#ec4899', next: 18 },
    { name: 'Seguro de Vida',     amount: 79.90, category: 'saude',          color: '#10b981', next: 26 },
  ],
  caixa: [
    { name: 'Amazon Prime',       amount: 14.90, category: 'entretenimento', color: '#0ea5e9', next: 9  },
    { name: 'Claro Música',       amount: 16.90, category: 'entretenimento', color: '#ef233c', next: 16 },
    { name: 'Plano Odontológico', amount: 49.90, category: 'saude',          color: '#10b981', next: 23 },
  ],
};

function buildSubscriptions(bank) {
  const items = SUBSCRIPTIONS_BY_BANK[bank.id] ?? SUBSCRIPTIONS_BY_BANK.nubank;
  return items.map((s) => ({
    name:              s.name,
    amount:            s.amount,
    billing_cycle:     'monthly',
    category:          s.category,
    color:             s.color,
    next_billing_date: daysAhead(s.next),
    bank_source:       bank.id,
  }));
}

// ─── Dedup helpers ──────────────────────────────────────────────────────────
// Quando o usuário conecta vários bancos, cada banco rodava o seed completo
// e gerava cópias de "Salário", "Netflix", "iFood" do mesmo mês. Os helpers
// abaixo consultam o que já existe antes do INSERT e filtram só o que é novo.

// Transações: deduplica por (title, YYYY-MM). Cobre tanto duplicatas entre
// bancos quanto duplicatas vs. transações criadas manualmente pelo usuário.
async function filterNewTransactions(items) {
  if (items.length === 0) return items;
  const monthOf = (iso) => iso.slice(0, 7);
  const candidateMonths = new Set(items.map((t) => monthOf(t.date)));
  const earliest = [...candidateMonths].sort()[0] + '-01';

  const { data: existing, error } = await supabase
    .from('transactions')
    .select('title, date')
    .gte('date', earliest);

  // Se a query falhar, deixa o INSERT seguir — pior cenário é o comportamento
  // antigo (eventuais duplicatas). Não bloquear o seed por um SELECT instável.
  if (error || !existing) return items;

  const taken = new Set(existing.map((r) => `${r.title}::${monthOf(r.date)}`));
  return items.filter((t) => !taken.has(`${t.title}::${monthOf(t.date)}`));
}

// Assinaturas e parcelamentos: deduplica por `name` (ambas as tabelas têm
// nomes únicos por natureza — "Netflix" é "Netflix" venha de onde vier).
async function filterNewByName(table, items) {
  if (items.length === 0) return items;
  const { data: existing, error } = await supabase.from(table).select('name');
  if (error || !existing) return items;
  const taken = new Set(existing.map((r) => r.name));
  return items.filter((i) => !taken.has(i.name));
}

// ─── API pública ────────────────────────────────────────────────────────────
/**
 * Insere dados de demonstração no Supabase para um banco recém-conectado.
 * Antes de inserir, deduplica contra o que já existe — assim conectar
 * múltiplos bancos não gera 8 "Salário", 8 "Netflix", 8 "iFood".
 *
 * Cada tabela falha de forma isolada — uma quebra (ex.: tabela ainda sem
 * migration aplicada) não impede as outras de seguirem.
 */
export async function seedBankData(bank) {
  const [txItems, subItems, insItems] = await Promise.all([
    filterNewTransactions(buildTransactions(bank)),
    filterNewByName('subscriptions', buildSubscriptions(bank)),
    filterNewByName('installments',  buildInstallments(bank)),
  ]);

  // INSERTs em paralelo. Quando uma lista filtrada fica vazia, evita a
  // chamada e devolve um "sucesso vazio" pra manter o shape do retorno.
  const noopOk = Promise.resolve({ error: null });
  const [txRes, subRes, insRes] = await Promise.all([
    txItems.length  ? supabase.from('transactions').insert(txItems)   : noopOk,
    subItems.length ? supabase.from('subscriptions').insert(subItems) : noopOk,
    insItems.length ? supabase.from('installments').insert(insItems)  : noopOk,
  ]);

  return {
    transactions:  !txRes.error,
    subscriptions: !subRes.error,
    installments:  !insRes.error,
    inserted: {
      transactions:  txItems.length,
      subscriptions: subItems.length,
      installments:  insItems.length,
    },
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

  // Lista todas as transações do mês corrente vindas de seed (bank_source
  // não-nulo) pra saber: quais bancos existem? algum já tem lazer este mês?
  const { data: existing, error: existErr } = await supabase
    .from('transactions')
    .select('bank_source, category, date')
    .not('bank_source', 'is', null)
    .gte('date', monthStart);

  if (existErr || !existing) return 0;

  const bankIds = new Set();
  let anyLazerThisMonth = false;
  for (const row of existing) {
    bankIds.add(row.bank_source);
    if (row.category === 'lazer') anyLazerThisMonth = true;
  }

  // Já existe lazer no mês ou não há banco seedado → nada a fazer.
  if (anyLazerThisMonth || bankIds.size === 0) return 0;

  // Insere o lazer UMA única vez, atribuído ao primeiro banco encontrado.
  // Antes a função inseria por banco — quando o usuário tinha 8 bancos sem
  // lazer, virava 16 linhas (8 Netflix + 8 Spotify). Agora vira 2 linhas.
  const firstBankId = [...bankIds][0];
  const toInsert = [
    { title: 'Netflix', amount: jitter(44.90), category: 'lazer', type: 'expense', date: daysAgo(4), bank_source: firstBankId },
    { title: 'Spotify', amount: jitter(21.90), category: 'lazer', type: 'expense', date: daysAgo(9), bank_source: firstBankId },
  ];

  const { error: insErr } = await supabase.from('transactions').insert(toInsert);
  return insErr ? 0 : toInsert.length;
}
