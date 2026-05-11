import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Utensils, Car, Gamepad2, Home, Heart, MoreHorizontal,
  Target, AlertTriangle, AlertCircle, Plus, Repeat, CalendarClock, CreditCard,
  ArrowUpRight, ArrowDownLeft,
} from 'lucide-react';

import { Card } from '../Card';
import { Button } from '../Button';
import { MonthlyExpensesChart } from '../MonthlyExpensesChart';
import { supabase } from '../../lib/supabaseClient';

// ─── Constants ─────────────────────────────────────────────────────────────
const CATEGORY_META = {
  alimentacao: { label: 'Alimentação', icon: Utensils,       color: '#ef233c' },
  transporte:  { label: 'Transporte',  icon: Car,            color: '#6366f1' },
  lazer:       { label: 'Lazer',       icon: Gamepad2,       color: '#f59e0b' },
  moradia:     { label: 'Moradia',     icon: Home,           color: '#10b981' },
  saude:       { label: 'Saúde',       icon: Heart,          color: '#ec4899' },
  outros:      { label: 'Outros',      icon: MoreHorizontal, color: '#71717a' },
  metas:       { label: 'Metas',       icon: Target,         color: '#8b5cf6' },
};

// Regra 50/30/20: essenciais vs supérfluos. Aportes em metas (categoria 'metas')
// não entram em nenhum dos dois — eles são contabilizados como POUPANÇA real
// na seção "Investimentos (20%)" mais abaixo.
const NEEDS_CATS = ['moradia', 'alimentacao', 'saude', 'transporte'];
const WANTS_CATS = ['lazer', 'outros'];

const SHORT_MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

// ─── Helpers ───────────────────────────────────────────────────────────────
function brl(n) {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function parseLocalDate(iso) {
  // 'YYYY-MM-DD' → Date local (evita drift de timezone)
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatRelativeDate(iso) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseLocalDate(iso);
  const diffDays = Math.round((today - target) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays > 1 && diffDays <= 6) return `${diffDays} dias atrás`;
  const dd = String(target.getDate()).padStart(2, '0');
  const mm = SHORT_MONTHS[target.getMonth()].toLowerCase();
  return `${dd} de ${mm}`;
}

function formatSupabaseError(err) {
  if (!err) return 'Erro desconhecido.';
  if (err.code === '42P01') {
    return 'A tabela "transactions" ainda não existe. Aplique a migration no SQL Editor do Supabase.';
  }
  if (err.code === '42501') return 'Você não tem permissão para realizar essa ação.';
  return err.message || 'Não foi possível carregar os dados. Tente novamente.';
}

// ─── Animações ─────────────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show:   { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 110, damping: 16 } },
};

// ─── ProgressBar ───────────────────────────────────────────────────────────
function ProgressBar({ value, color = 'bg-gray-900 dark:bg-white' }) {
  return (
    <div className="h-2 w-full bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
      />
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────
function SkeletonBlock({ className = '', style }) {
  return (
    <motion.div
      className={`bg-gray-200 dark:bg-zinc-800 rounded-lg ${className}`}
      style={style}
      animate={{ opacity: [0.4, 0.85, 0.4] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function LoadingState() {
  return (
    <>
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1 min-w-0">
          <SkeletonBlock className="h-4 w-32 mb-3" />
          <SkeletonBlock className="h-16 md:h-20 w-full max-w-md" />
        </div>
        <div className="flex gap-3">
          <SkeletonBlock className="h-11 w-24" />
          <SkeletonBlock className="h-11 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        {[0, 1, 2].map((i) => (
          <SkeletonBlock key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <SkeletonBlock className="h-[420px] lg:col-span-2 rounded-2xl" />
        <SkeletonBlock className="h-[420px] rounded-2xl" />
      </div>
    </>
  );
}

// ─── Empty state (zero transactions) ──────────────────────────────────────
function EmptyOverview({ onGoToTransactions }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center text-center py-20 bg-white dark:bg-dark-surface border border-dashed border-gray-200 dark:border-dark-border rounded-2xl"
    >
      <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-5">
        <Plus className="w-8 h-8 text-accent" />
      </div>
      <h2 className="text-2xl md:text-3xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
        Comece pela primeira <span className="text-accent">transação</span>
      </h2>
      <p className="text-gray-500 text-sm max-w-sm leading-relaxed mb-6">
        A Visão Geral é alimentada pelas suas receitas e despesas. Sem transações, não há saldo, regra 50/30/20 nem gráfico para mostrar.
      </p>
      {onGoToTransactions && (
        <button
          onClick={onGoToTransactions}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-red-600 text-white text-sm font-semibold transition-colors shadow-lg shadow-accent/20"
        >
          <Plus className="w-4 h-4" />
          Adicionar transação
        </button>
      )}
    </motion.div>
  );
}

// ─── Linha de transação recente ───────────────────────────────────────────
function TransactionRow({ tx }) {
  const meta = CATEGORY_META[tx.category] ?? CATEGORY_META.outros;
  const Icon = meta.icon;
  const isIncome = tx.type === 'income';

  return (
    <div className="group relative flex items-center justify-between p-4 bg-white dark:bg-dark-surface/50 border border-gray-200 dark:border-dark-border rounded-xl hover:bg-gray-50 dark:hover:bg-dark-surface transition-all overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-1 bg-accent transform -translate-x-full group-hover:translate-x-0 transition-transform" />
      <div className="flex items-center gap-4 min-w-0">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border"
          style={{ backgroundColor: `${meta.color}1a`, borderColor: `${meta.color}33` }}
        >
          <Icon className="w-5 h-5" style={{ color: meta.color }} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{tx.title}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            {isIncome
              ? <ArrowUpRight className="w-3 h-3 text-emerald-500" />
              : <ArrowDownLeft className="w-3 h-3 text-accent" />}
            <span>{formatRelativeDate(tx.date)} · {meta.label}</span>
          </p>
        </div>
      </div>
      <p className={`font-bold font-heading shrink-0 ml-3 ${isIncome ? 'text-emerald-500' : 'text-gray-700 dark:text-gray-300'}`}>
        {isIncome ? '+' : '-'}R$ {brl(Math.abs(tx.amount))}
      </p>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────
export function OverviewTab({ accounts = [], onGoToTransactions, onGoToGoals }) {
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [transactions, setTransactions]   = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [installments, setInstallments]   = useState([]);
  const [cardsBill, setCardsBill]         = useState(0);
  const [goalsList, setGoalsList]         = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');

      // Tudo em paralelo. Cada query falha de forma isolada — só transactions
      // bloqueia a página, as outras caem para 0/[] sem alarde (ex.: cards
      // ainda não tem migration aplicada).
      const [txRes, subRes, insRes, cardRes, goalsRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('id, title, amount, category, type, date, created_at')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase.from('subscriptions').select('amount, billing_cycle'),
        supabase.from('installments').select('installment_amount, paid_installments, total_installments'),
        supabase.from('cards').select('used_amount'),
        supabase
          .from('goals')
          .select('id, name, target_amount, current_amount, deadline, color')
          .order('deadline', { ascending: true }),
      ]);

      if (cancelled) return;

      if (txRes.error) {
        setError(formatSupabaseError(txRes.error));
        setTransactions([]);
      } else {
        setTransactions(txRes.data ?? []);
      }

      setSubscriptions(subRes.error ? [] : (subRes.data ?? []));
      setInstallments(insRes.error ? [] : (insRes.data ?? []));
      setGoalsList(goalsRes.error ? [] : (goalsRes.data ?? []));

      if (cardRes.error) {
        setCardsBill(0);
      } else {
        const sum = (cardRes.data ?? []).reduce((s, c) => s + Number(c.used_amount ?? 0), 0);
        setCardsBill(sum);
      }

      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Saldo dos bancos conectados (mock local — entra como base do saldo total
  // e como fallback de orçamento para a regra 50/30/20).
  const bankBalance = useMemo(
    () => accounts.reduce((s, a) => s + Number(a.balance ?? 0), 0),
    [accounts],
  );

  // ─── Stats derivadas das transações ────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date();
    const currMonthStart = startOfMonth(now);

    // Inicializa últimos 6 meses (ordem cronológica crescente).
    const monthlyMap = new Map();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthlyMap.set(monthKey(d), {
        month: SHORT_MONTHS[d.getMonth()],
        alimentacao: 0, transporte: 0, lazer: 0,
        moradia: 0, saude: 0, outros: 0, metas: 0,
      });
    }

    let totalIncome      = 0;
    let totalExpense     = 0;
    let currIncome       = 0;
    let currExpense      = 0;
    let needsSpent       = 0;
    let wantsSpent       = 0;
    let goalsContributed = 0; // aportes em metas no mês atual
    const currCategorySpend = {};

    for (const t of transactions) {
      const amt = Number(t.amount);
      const d = parseLocalDate(t.date);
      const isCurrentMonth = d >= currMonthStart;

      if (t.type === 'income') {
        totalIncome += amt;
        if (isCurrentMonth) currIncome += amt;
      } else {
        totalExpense += amt;
        if (isCurrentMonth) {
          currExpense += amt;
          currCategorySpend[t.category] = (currCategorySpend[t.category] ?? 0) + amt;
          if (NEEDS_CATS.includes(t.category)) needsSpent += amt;
          else if (WANTS_CATS.includes(t.category)) wantsSpent += amt;
          if (t.category === 'metas') goalsContributed += amt;
        }
        const key = monthKey(d);
        if (monthlyMap.has(key)) {
          monthlyMap.get(key)[t.category] = (monthlyMap.get(key)[t.category] ?? 0) + amt;
        }
      }
    }

    // Saldo total = saldo dos bancos conectados + (receitas − despesas) das
    // transações registradas. Permite o usuário ter saldo mesmo sem ainda
    // ter cadastrado nenhuma transação.
    const saldo = bankBalance + totalIncome - totalExpense;

    // Base do 50/30/20: prefere receita do mês; cai para saldo dos bancos
    // conectados; por último, para receita total acumulada.
    let baseBudget;
    let baseLabel;
    if (currIncome > 0) {
      baseBudget = currIncome;
      baseLabel  = `Base: receita do mês (R$ ${brl(currIncome)})`;
    } else if (bankBalance > 0) {
      baseBudget = bankBalance;
      baseLabel  = `Base: saldo dos bancos (R$ ${brl(bankBalance)})`;
    } else {
      baseBudget = totalIncome;
      baseLabel  = `Base: receita total (R$ ${brl(totalIncome)})`;
    }
    const needsBudget  = baseBudget * 0.50;
    const wantsBudget  = baseBudget * 0.30;
    const savingsBudget = baseBudget * 0.20;
    // Poupança real do mês = aportes explícitos em metas + sobra (receita - gastos).
    // Como currExpense já inclui os aportes, somar goalsContributed garante que
    // o dinheiro que foi pra metas continue contando como poupado, e não como
    // gasto perdido.
    const leftover = currIncome - currExpense;
    const savingsActual = Math.max(0, goalsContributed + Math.max(0, leftover));

    // Categoria com maior gasto do mês corrente (para o alerta).
    let topCategory = null;
    let topCategoryAmount = 0;
    for (const [cat, val] of Object.entries(currCategorySpend)) {
      if (val > topCategoryAmount) {
        topCategoryAmount = val;
        topCategory = cat;
      }
    }

    return {
      totalIncome, totalExpense, saldo,
      currIncome, currExpense,
      needsSpent, wantsSpent,
      needsBudget, wantsBudget, savingsBudget, savingsActual, baseLabel,
      topCategory, topCategoryAmount,
      monthlyData: Array.from(monthlyMap.values()),
    };
  }, [transactions, bankBalance]);

  const subscriptionsMonthly = useMemo(() => {
    return subscriptions.reduce(
      (s, sub) => s + (sub.billing_cycle === 'yearly' ? Number(sub.amount) / 12 : Number(sub.amount)),
      0,
    );
  }, [subscriptions]);

  const installmentsMonthly = useMemo(() => {
    return installments
      .filter((i) => Number(i.paid_installments) < Number(i.total_installments))
      .reduce((s, i) => s + Number(i.installment_amount), 0);
  }, [installments]);

  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

  // Resumo de metas pra exibir no widget da Visão Geral.
  // Mostra as 3 mais urgentes (não concluídas primeiro, ordenadas por prazo).
  const goalsSummary = useMemo(() => {
    const withPct = goalsList.map((g) => {
      const t = Number(g.target_amount);
      const c = Number(g.current_amount);
      const pct = t > 0 ? Math.min(100, (c / t) * 100) : 0;
      return { ...g, _pct: pct, _completed: c >= t };
    });
    const incomplete = withPct.filter((g) => !g._completed);
    const completed  = withPct.filter((g) =>  g._completed);
    const top = [...incomplete, ...completed].slice(0, 3);
    const total       = withPct.length;
    const completedN  = completed.length;
    const avgPct      = total > 0
      ? withPct.reduce((s, g) => s + g._pct, 0) / total
      : 0;
    return { top, total, completedN, avgPct };
  }, [goalsList]);

  // ─── Render ────────────────────────────────────────────────────────────
  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 p-4 bg-accent/10 border border-accent/20 rounded-xl">
        <AlertCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div>
          <p className="text-accent font-semibold text-sm mb-1">Não foi possível carregar a Visão Geral</p>
          <p className="text-accent/80 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const hasTransactions = transactions.length > 0;
  const hasAccounts     = accounts.length > 0;
  // Só consideramos "vazio" se o usuário não tem NEM bancos conectados NEM
  // transações — senão dá pra mostrar saldo e KPIs com os dados disponíveis.
  if (!hasTransactions && !hasAccounts) {
    return <EmptyOverview onGoToTransactions={onGoToTransactions} />;
  }

  const [balInt, balDec] = brl(Math.abs(stats.saldo)).split(',');
  const saldoNegativo = stats.saldo < 0;

  // Alerta dinâmico: prioriza estouro de wants > needs > info da maior categoria.
  let alertTitle = 'Tudo sob controle';
  let alertBody  = 'Você ainda tem espaço no orçamento deste mês.';
  let alertTone  = 'info';

  if (stats.wantsBudget > 0 && stats.wantsSpent / stats.wantsBudget > 0.8) {
    alertTitle = 'Atenção com gastos supérfluos';
    alertBody  = `Você já comprometeu ${((stats.wantsSpent / stats.wantsBudget) * 100).toFixed(0)}% do seu orçamento de Lazer/Outros este mês.`;
    alertTone  = 'warn';
  } else if (stats.needsBudget > 0 && stats.needsSpent / stats.needsBudget > 0.8) {
    alertTitle = 'Gastos essenciais altos';
    alertBody  = `Você já comprometeu ${((stats.needsSpent / stats.needsBudget) * 100).toFixed(0)}% do orçamento essencial este mês.`;
    alertTone  = 'warn';
  } else if (stats.topCategory) {
    const meta = CATEGORY_META[stats.topCategory] ?? CATEGORY_META.outros;
    alertTitle = 'Maior gasto do mês';
    alertBody  = `${meta.label} concentra R$ ${brl(stats.topCategoryAmount)} este mês.`;
    alertTone  = 'info';
  }

  return (
    <>
      {/* Header — saldo real */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-2 uppercase tracking-wider text-sm">Saldo Total</p>
          <h1 className={`text-5xl md:text-7xl font-heading font-extrabold tracking-tighter ${
            saldoNegativo ? 'text-accent' : 'text-gray-900 dark:text-white'
          }`}>
            {saldoNegativo && '- '}R$ {balInt}
            <span className={saldoNegativo ? 'text-accent/60' : 'text-gray-400 dark:text-gray-500'}>,{balDec}</span>
          </h1>
          <p className="text-xs text-gray-500 mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {hasAccounts && (
              <span>
                Bancos: <span className="text-gray-900 dark:text-white font-semibold">R$ {brl(bankBalance)}</span>
              </span>
            )}
            <span>
              Receitas: <span className="text-emerald-500 font-semibold">R$ {brl(stats.totalIncome)}</span>
            </span>
            <span>
              Despesas: <span className="text-accent font-semibold">R$ {brl(stats.totalExpense)}</span>
            </span>
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary">Enviar</Button>
          <Button variant="primary" onClick={onGoToTransactions}>Adicionar</Button>
        </div>
      </motion.div>

      {/* KPIs extras */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8"
      >
        <motion.div variants={itemVariants} className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Repeat className="w-3.5 h-3.5 text-accent" />
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Assinaturas / mês</p>
          </div>
          <p className="text-2xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tight">
            R$ {brl(subscriptionsMonthly)}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            {subscriptions.length} {subscriptions.length === 1 ? 'ativa' : 'ativas'}
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <CalendarClock className="w-3.5 h-3.5 text-accent" />
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Parcelas / mês</p>
          </div>
          <p className="text-2xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tight">
            R$ {brl(installmentsMonthly)}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            {installments.filter((i) => Number(i.paid_installments) < Number(i.total_installments)).length}{' '}
            {installments.filter((i) => Number(i.paid_installments) < Number(i.total_installments)).length === 1 ? 'em aberto' : 'em aberto'}
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-3.5 h-3.5 text-accent" />
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Faturas cartões</p>
          </div>
          <p className="text-2xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tight">
            R$ {brl(cardsBill)}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">total em uso</p>
        </motion.div>
      </motion.div>

      {/* Grid principal */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Coluna 1: gráfico + transações */}
        <motion.div variants={itemVariants} className="flex flex-col gap-8 lg:col-span-2">
          <MonthlyExpensesChart
            monthlyData={stats.monthlyData}
            loading={false}
            onGoToTransactions={onGoToTransactions}
          />

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading font-bold text-gray-900 dark:text-white">Últimas Transações</h3>
              {onGoToTransactions && (
                <button
                  onClick={onGoToTransactions}
                  className="text-xs text-accent hover:text-accent/80 font-semibold transition-colors"
                >
                  Ver todas →
                </button>
              )}
            </div>
            {recentTransactions.length === 0 ? (
              <div className="p-6 text-center bg-white dark:bg-dark-surface border border-dashed border-gray-200 dark:border-dark-border rounded-xl">
                <p className="text-gray-500 text-sm">Sem transações ainda.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recentTransactions.map((t) => (
                  <TransactionRow key={t.id} tx={t} />
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Coluna 2: 50/30/20 + reserva + alerta */}
        <motion.div variants={itemVariants} className="flex flex-col gap-8">

          <Card withAccent={false}>
            <h3 className="text-lg font-heading font-bold text-gray-900 dark:text-white mb-1">Regra 50/30/20</h3>
            <p className="text-xs text-gray-500 mb-4">{stats.baseLabel}</p>
            {stats.needsBudget === 0 ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <Target className="w-8 h-8 text-gray-300 dark:text-gray-700" />
                <p className="text-sm text-gray-500">
                  Cadastre uma receita para calcular sua divisão 50/30/20.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Necessidades (50%)</span>
                    <span className="text-gray-900 dark:text-white font-semibold">
                      R$ {brl(stats.needsSpent)} / {brl(stats.needsBudget)}
                    </span>
                  </div>
                  <ProgressBar
                    value={(stats.needsSpent / stats.needsBudget) * 100}
                    color={stats.needsSpent / stats.needsBudget > 1 ? 'bg-accent' : 'bg-gray-900 dark:bg-white'}
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Lazer (30%)</span>
                    <span className="text-gray-900 dark:text-white font-semibold">
                      R$ {brl(stats.wantsSpent)} / {brl(stats.wantsBudget)}
                    </span>
                  </div>
                  <ProgressBar
                    value={(stats.wantsSpent / stats.wantsBudget) * 100}
                    color={stats.wantsSpent / stats.wantsBudget > 1 ? 'bg-accent' : 'bg-gray-500 dark:bg-gray-400'}
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Investimentos (20%)</span>
                    <span className="text-accent font-semibold">
                      R$ {brl(stats.savingsActual)} / {brl(stats.savingsBudget)}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-accent rounded-full shadow-[0_0_10px_#ef233c]"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((stats.savingsActual / Math.max(stats.savingsBudget, 1)) * 100, 100)}%` }}
                      transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Minhas Metas — preview real do goals */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center">
                  <Target className="w-4 h-4 text-accent" />
                </div>
                <h3 className="text-lg font-heading font-bold text-gray-900 dark:text-white">Minhas Metas</h3>
              </div>
              {goalsSummary.total > 0 && onGoToGoals && (
                <button
                  onClick={onGoToGoals}
                  className="text-xs text-accent hover:text-accent/80 font-semibold transition-colors"
                >
                  Ver todas →
                </button>
              )}
            </div>

            {goalsSummary.total === 0 ? (
              <div className="flex flex-col items-center text-center py-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Nenhuma meta cadastrada ainda.
                </p>
                <p className="text-xs text-gray-500 mb-4 max-w-[240px]">
                  Defina uma viagem, reserva ou compra grande e acompanhe o progresso aqui.
                </p>
                {onGoToGoals && (
                  <button
                    onClick={onGoToGoals}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-red-600 text-white text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Criar primeira meta
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2 mb-1">
                  <p className="text-3xl font-heading font-bold text-gray-900 dark:text-white">
                    {goalsSummary.avgPct.toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-500">conclusão média</p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {goalsSummary.total} {goalsSummary.total === 1 ? 'meta ativa' : 'metas ativas'}
                  {goalsSummary.completedN > 0 && (
                    <>
                      {' · '}
                      <span className="text-emerald-500 font-semibold">
                        {goalsSummary.completedN} concluída{goalsSummary.completedN === 1 ? '' : 's'}
                      </span>
                    </>
                  )}
                </p>

                <div className="flex flex-col gap-3">
                  {goalsSummary.top.map((g, i) => (
                    <div key={g.id}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-gray-700 dark:text-gray-300 font-medium truncate pr-2">
                          {g.name}
                        </span>
                        <span
                          className="font-heading font-bold shrink-0"
                          style={{ color: g._completed ? '#10b981' : g.color }}
                        >
                          {g._pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden relative">
                        <motion.div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{ background: g._completed ? '#10b981' : g.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${g._pct}%` }}
                          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.4 + i * 0.08 }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">
                        R$ {brl(g.current_amount)} de R$ {brl(g.target_amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* Alerta dinâmico */}
          <Card className={`${
            alertTone === 'warn'
              ? 'bg-accent/5 dark:bg-accent/5 border-accent/30 dark:border-accent/30'
              : 'bg-white dark:bg-dark-surface'
          }`}>
            <div className="flex items-start gap-4">
              <AlertTriangle className={`w-5 h-5 mt-1 shrink-0 ${
                alertTone === 'warn' ? 'text-accent animate-pulse' : 'text-gray-400 dark:text-gray-500'
              }`} />
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-1 tracking-tight">{alertTitle}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{alertBody}</p>
              </div>
            </div>
          </Card>

        </motion.div>
      </motion.div>
    </>
  );
}
