// =====================================================================
// bankSeed.js — simulação de dados ao "conectar" um banco.
//
// O app não fala com bancos reais; "conectar" é uma simulação. Pra que
// o resto da experiência (Visão Geral, Transações, Categorias, Gráfico
// mensal, Parcelamentos, Assinaturas) tenha conteúdo realista, ao
// conectar um banco a gente popula o Supabase com:
//   - ~12 transações dos últimos 30 dias (1 receita + 11 despesas
//     espalhadas pelas categorias);
//   - 2 assinaturas mensais (Netflix, Spotify);
//   - 1 parcelamento em andamento (Notebook 12x).
//
// Cada registro recebe o sufixo " · <Nome do Banco>" no título/nome.
// Isso serve pra:
//   1. mostrar pro usuário de onde o dado veio;
//   2. permitir limpar tudo de um banco específico via ilike no
//      desconectar (clearBankData).
//
// Os valores são levemente aleatorizados (jitter ±15%) pra que cada
// banco mostre números um pouco diferentes — sensação de "extrato real".
// =====================================================================

import { supabase } from './supabaseClient';

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

// Variação ±15% pra evitar valores idênticos entre bancos.
function jitter(base) {
  const factor = 0.85 + Math.random() * 0.30;
  return Number((base * factor).toFixed(2));
}

// Templates — referenciam o sufixo do banco no momento do seed.
function buildTransactions(tag) {
  return [
    { title: `Salário${tag}`,        amount: jitter(4200), category: 'outros',      type: 'income',  date: daysAgo(28) },
    { title: `Aluguel${tag}`,        amount: jitter(1500), category: 'moradia',     type: 'expense', date: daysAgo(25) },
    { title: `Mercado Extra${tag}`,  amount: jitter(280),  category: 'alimentacao', type: 'expense', date: daysAgo(22) },
    { title: `Uber${tag}`,           amount: jitter(32),   category: 'transporte',  type: 'expense', date: daysAgo(20) },
    { title: `iFood${tag}`,          amount: jitter(56),   category: 'alimentacao', type: 'expense', date: daysAgo(16) },
    { title: `Farmácia${tag}`,       amount: jitter(78),   category: 'saude',       type: 'expense', date: daysAgo(14) },
    { title: `Conta de Luz${tag}`,   amount: jitter(215),  category: 'moradia',     type: 'expense', date: daysAgo(12) },
    { title: `Posto Shell${tag}`,    amount: jitter(200),  category: 'transporte',  type: 'expense', date: daysAgo(10) },
    { title: `Cinema${tag}`,         amount: jitter(45),   category: 'lazer',       type: 'expense', date: daysAgo(7)  },
    { title: `Restaurante${tag}`,    amount: jitter(110),  category: 'alimentacao', type: 'expense', date: daysAgo(5)  },
    { title: `Mercado${tag}`,        amount: jitter(175),  category: 'alimentacao', type: 'expense', date: daysAgo(3)  },
    { title: `Uber${tag}`,           amount: jitter(28),   category: 'transporte',  type: 'expense', date: daysAgo(1)  },
  ];
}

function buildSubscriptions(tag) {
  return [
    { name: `Netflix${tag}`, amount: 39.90, billing_cycle: 'monthly', category: 'entretenimento', color: '#ef233c', next_billing_date: daysAhead(8)  },
    { name: `Spotify${tag}`, amount: 21.90, billing_cycle: 'monthly', category: 'entretenimento', color: '#10b981', next_billing_date: daysAhead(15) },
  ];
}

function buildInstallments(tag) {
  // Notebook em 12x, 3 parcelas pagas, começou há 3 meses.
  const total = jitter(4800);
  const count = 12;
  return [
    {
      name: `Notebook${tag}`,
      total_amount: total,
      installment_amount: Number((total / count).toFixed(2)),
      total_installments: count,
      paid_installments: 3,
      start_date: daysAgo(90),
    },
  ];
}

/**
 * Insere dados de demonstração no Supabase para um banco recém-conectado.
 * Falha de cada tabela é isolada — uma quebra (ex.: tabela ainda sem migration)
 * não impede as outras de seguirem.
 */
export async function seedBankData(bank) {
  const tag = ` · ${bank.name}`;
  const [txRes, subRes, insRes] = await Promise.all([
    supabase.from('transactions').insert(buildTransactions(tag)),
    supabase.from('subscriptions').insert(buildSubscriptions(tag)),
    supabase.from('installments').insert(buildInstallments(tag)),
  ]);
  return {
    transactions: !txRes.error,
    subscriptions: !subRes.error,
    installments:  !insRes.error,
    errors: [txRes.error, subRes.error, insRes.error].filter(Boolean),
  };
}

/**
 * Remove os dados de demonstração de um banco específico (match por sufixo
 * " · <Nome do Banco>" em title/name). É best-effort: se algo falhar a
 * desconexão local prossegue normalmente.
 */
export async function clearBankData(bank) {
  const pattern = `% · ${bank.name}`;
  await Promise.all([
    supabase.from('transactions').delete().ilike('title', pattern),
    supabase.from('subscriptions').delete().ilike('name', pattern),
    supabase.from('installments').delete().ilike('name', pattern),
  ]);
}
