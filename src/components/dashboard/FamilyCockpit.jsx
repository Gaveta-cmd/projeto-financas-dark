/**
 * FamilyCockpit — aba "Visão Geral" com dados reais do Supabase.
 * Usa: useHousehold, useSpendingLimits, useDemoMode.
 */
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Wallet, TrendingDown, TrendingUp,
  ShoppingCart, Zap, Gamepad2, Utensils, Car, Heart, Home, MoreHorizontal,
  CalendarClock, ArrowUpRight, ArrowDownLeft, Bell, ChevronRight,
  Loader2, AlertCircle, Users,
} from 'lucide-react';

import { Card }   from '../Card';
import { Button } from '../Button';
import { useHousehold }      from '../../hooks/useHousehold';
import { useSpendingLimits } from '../../hooks/useSpendingLimits';
import { useDemoMode }       from '../../contexts/DemoContext';
import { useHouseholdCtx }   from '../../contexts/HouseholdContext';
import { api }          from '../../lib/api';

// ─── Mapeamento de categorias ─────────────────────────────────────────────────
const CATEGORY_META = {
  alimentacao: { label: 'Alimentação', icon: Utensils,       color: '#ef233c' },
  transporte:  { label: 'Transporte',  icon: Car,            color: '#6366f1' },
  lazer:       { label: 'Lazer',       icon: Gamepad2,       color: '#f59e0b' },
  moradia:     { label: 'Moradia',     icon: Home,           color: '#10b981' },
  saude:       { label: 'Saúde',       icon: Heart,          color: '#ec4899' },
  outros:      { label: 'Outros',      icon: MoreHorizontal, color: '#71717a' },
};

const CATEGORY_ORDER = ['alimentacao', 'transporte', 'lazer', 'moradia', 'saude', 'outros'];
const MEMBER_COLORS  = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#ec4899'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function brl(n) {
  return Math.abs(Number(n)).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function initials(name = '') {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function parseLocalDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysUntil(iso) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.ceil((parseLocalDate(iso) - today) / 86_400_000);
}

function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return dt.toISOString().split('T')[0];
}

function barColor(pct) {
  if (pct >= 90) return '#ef233c';
  if (pct >= 60) return '#f59e0b';
  return '#10b981';
}

function urgencyFor(days) {
  if (days === 0) return { label: 'Vence hoje',    cls: 'bg-accent/15 text-accent border-accent/30',                  dot: 'bg-accent animate-pulse' };
  if (days === 1) return { label: 'Vence amanhã',  cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30',      dot: 'bg-orange-400' };
  if (days <= 7)  return { label: `Em ${days} dias`, cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30',       dot: 'bg-amber-400' };
  return           { label: `Em ${days} dias`,     cls: 'bg-gray-100/50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10', dot: 'bg-gray-400' };
}

function formatRelative(iso) {
  const d = daysUntil(iso);
  if (d === 0)  return 'Hoje';
  if (d === -1) return 'Ontem';
  if (d < 0)    return `${Math.abs(d)}d atrás`;
  return parseLocalDate(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// ─── Animações ────────────────────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const rowVariant = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 22 } },
};

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function AnimatedBar({ pct, color }) {
  const v = Math.min(Math.max(Number(pct) || 0, 0), 100);
  return (
    <div className="h-2 w-full bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${v}%` }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
      />
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, subColor = 'text-gray-400', accent = false }) {
  return (
    <motion.div variants={rowVariant}>
      <Card className="h-full">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent ? 'bg-accent/15' : 'bg-gray-100 dark:bg-white/5'}`}>
            <Icon className={`w-[18px] h-[18px] ${accent ? 'text-accent' : 'text-gray-500 dark:text-gray-400'}`} />
          </div>
          {sub && <span className={`text-xs font-semibold ${subColor}`}>{sub}</span>}
        </div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
        <p className="text-2xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tight">
          R$ {brl(value)}
        </p>
      </Card>
    </motion.div>
  );
}

function BudgetRow({ category, spent, limit }) {
  const meta  = CATEGORY_META[category] ?? CATEGORY_META.outros;
  const Icon  = meta.icon;
  const pct   = limit > 0 ? Math.min((spent / limit) * 100, 100) : (spent > 0 ? 100 : 0);
  const color = barColor(pct);

  const statusLabel = pct >= 90 ? 'Crítico' : pct >= 60 ? 'Atenção' : 'Saudável';
  const statusCls   = pct >= 90 ? 'text-accent' : pct >= 60 ? 'text-amber-400' : 'text-emerald-500';

  return (
    <motion.div variants={rowVariant}>
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}1a` }}>
            <Icon className="w-3.5 h-3.5" style={{ color }} />
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{meta.label}</span>
        </div>
        <div className="flex items-center gap-3 text-xs shrink-0">
          <span className={`font-semibold ${statusCls} hidden sm:inline`}>{statusLabel}</span>
          <span className="text-gray-400 font-mono">
            R$ {brl(spent)}
            {limit > 0 && <span className="opacity-50"> / R$ {brl(limit)}</span>}
          </span>
          <span className="font-bold w-9 text-right" style={{ color }}>
            {limit > 0 ? `${pct.toFixed(0)}%` : '—'}
          </span>
        </div>
      </div>
      <AnimatedBar pct={pct} color={color} />
    </motion.div>
  );
}

function UpcomingRow({ bill }) {
  const u = urgencyFor(bill.daysLeft);
  return (
    <motion.div
      variants={rowVariant}
      className="flex items-center justify-between gap-3 py-3 border-b border-gray-100 dark:border-dark-border last:border-0"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${u.dot}`} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{bill.name}</p>
          <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wide border rounded-full px-2 py-0.5 mt-0.5 ${u.cls}`}>
            {u.label}
          </span>
        </div>
      </div>
      {bill.amount != null && (
        <span className="text-sm font-heading font-bold text-gray-900 dark:text-white shrink-0">
          R$ {brl(bill.amount)}
        </span>
      )}
    </motion.div>
  );
}

function TxRow({ tx, memberMap }) {
  const isIncome = tx.type === 'income';
  const meta     = CATEGORY_META[tx.category] ?? CATEGORY_META.outros;
  const member   = memberMap[tx.user_id];

  return (
    <motion.div
      variants={rowVariant}
      className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-dark-border last:border-0"
    >
      {/* Avatar membro */}
      {member ? (
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ background: member.color }}
          title={member.nickname}
        >
          {initials(member.nickname)}
        </div>
      ) : (
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
          style={{ backgroundColor: `${meta.color}1a`, borderColor: `${meta.color}33` }}
        >
          <meta.icon className="w-4.5 h-4.5" style={{ color: meta.color }} />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{tx.title}</p>
        <p className="text-xs text-gray-400">
          {formatRelative(tx.date)}
          {member && ` · ${member.nickname}`}
        </p>
      </div>

      {/* Valor */}
      <div className="flex items-center gap-1.5 shrink-0">
        {isIncome
          ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
          : <ArrowDownLeft className="w-3.5 h-3.5 text-accent" />
        }
        <span className={`text-sm font-heading font-bold ${isIncome ? 'text-emerald-500' : 'text-accent'}`}>
          {isIncome ? '+' : '−'} R$ {brl(tx.amount)}
        </span>
      </div>
    </motion.div>
  );
}

function Skeleton({ className = '' }) {
  return (
    <motion.div
      className={`bg-gray-200 dark:bg-zinc-800 rounded-lg ${className}`}
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-72 col-span-2" />
        <Skeleton className="h-72" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function FamilyCockpit({ onGoToTransactions }) {
  const { isDemo, demoData } = useDemoMode();
  const {
    household, members, totalHouseholdIncome,
    fetchHouseholdTransactions, loading: hhLoading,
  } = useHousehold();
  const { householdLimits, personalLimits } = useSpendingLimits();
  const hhCtx = useHouseholdCtx();
  const selectedMember = hhCtx?.selectedMember ?? 'all';

  const month = currentMonth();

  const [txs,         setTxs]         = useState([]);
  const [upcoming,    setUpcoming]     = useState([]);
  const [loadingData, setLoadingData]  = useState(true);
  const [alertDismissed, setAlertDismissed] = useState(false);

  // ── Carregamento de dados ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingData(true);

      if (isDemo) {
        setTxs(demoData.transactions ?? []);
        const notifs = [
          ...(demoData.subscriptions ?? []).slice(0, 3).map((s, i) => ({
            id: `s${i}`, name: s.name, daysLeft: i, amount: Number(s.amount),
          })),
        ];
        setUpcoming(notifs);
        setLoadingData(false);
        return;
      }

      // Transações do mês (household ou pessoais)
      let txList = [];
      if (household?.id) {
        txList = await fetchHouseholdTransactions(month);
      } else if (api) {
        const { data } = await api
          .from('transactions')
          .select('id, title, amount, category, type, date, user_id')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false });
        txList = data ?? [];
      }

      // Próximos vencimentos (30 dias)
      const upcomingList = [];
      if (api) {
        const today30 = addDays(new Date().toISOString().split('T')[0], 30);

        const [{ data: subs }, { data: insts }] = await Promise.all([
          api
            .from('subscriptions')
            .select('id, name, next_billing_date, amount')
            .lte('next_billing_date', today30)
            .gte('next_billing_date', new Date().toISOString().split('T')[0]),
          api
            .from('installments')
            .select('id, name, start_date, paid_installments, total_installments')
            .lt('paid_installments', 'total_installments'),
        ]);

        if (subs) {
          subs.forEach((s) => {
            const d = daysUntil(s.next_billing_date);
            if (d >= 0) upcomingList.push({ id: `s-${s.id}`, name: s.name, daysLeft: d, amount: Number(s.amount) });
          });
        }
        if (insts) {
          insts.forEach((inst) => {
            const nextDate = addDays(inst.start_date, (inst.paid_installments + 1) * 30);
            const d = daysUntil(nextDate);
            if (d >= 0 && d <= 30) upcomingList.push({ id: `i-${inst.id}`, name: inst.name, daysLeft: d, amount: null });
          });
        }
        upcomingList.sort((a, b) => a.daysLeft - b.daysLeft);
      }

      if (!cancelled) {
        setTxs(txList);
        setUpcoming(upcomingList.slice(0, 6));
        setLoadingData(false);
      }
    }

    if (!hhLoading) load();
    return () => { cancelled = true; };
  }, [household?.id, month, isDemo, hhLoading, fetchHouseholdTransactions]);

  // ── Dados derivados ─────────────────────────────────────────────────────
  const memberMap = useMemo(() => {
    const m = {};
    (members ?? []).forEach((mb, i) => {
      m[mb.user_id] = { nickname: mb.nickname || 'Membro', color: MEMBER_COLORS[i % MEMBER_COLORS.length] };
    });
    return m;
  }, [members]);

  // Transações filtradas pelo membro selecionado globalmente
  const filteredTxs = useMemo(
    () => selectedMember === 'all' ? txs : txs.filter(t => t.user_id === selectedMember),
    [txs, selectedMember],
  );

  // Gastos por categoria (somente despesas do mês)
  const categorySpend = useMemo(() => {
    const acc = {};
    const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
    for (const t of filteredTxs) {
      if (t.type !== 'expense') continue;
      const d = parseLocalDate(t.date);
      if (d < start) continue;
      acc[t.category] = (acc[t.category] ?? 0) + Number(t.amount);
    }
    return acc;
  }, [filteredTxs]);

  // KPIs
  const totalSpent = useMemo(
    () => Object.values(categorySpend).reduce((s, v) => s + v, 0),
    [categorySpend],
  );
  const totalIncome = useMemo(() => {
    const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
    return filteredTxs
      .filter((t) => t.type === 'income' && parseLocalDate(t.date) >= start)
      .reduce((s, t) => s + Number(t.amount), 0);
  }, [filteredTxs]);

  // Renda: usa household income se disponível, senão totalIncome das transações
  const incomeDisplay = totalHouseholdIncome > 0 ? totalHouseholdIncome : totalIncome;
  const surplus       = incomeDisplay - totalSpent;

  // Limites: prefere household, cai para personal
  const activeLimits = useMemo(() => {
    const hl = householdLimits ?? {};
    const pl = personalLimits  ?? {};
    const merged = { ...pl };
    for (const [k, v] of Object.entries(hl)) merged[k] = v;
    return merged;
  }, [householdLimits, personalLimits]);

  // Linhas do radar — categorias que têm gasto OU limite definido
  const budgetRows = useMemo(() => {
    const cats = new Set([...Object.keys(categorySpend), ...Object.keys(activeLimits)]);
    return CATEGORY_ORDER
      .filter((c) => cats.has(c))
      .map((c) => ({ category: c, spent: categorySpend[c] ?? 0, limit: activeLimits[c] ?? 0 }))
      .sort((a, b) => {
        const pA = a.limit > 0 ? a.spent / a.limit : (a.spent > 0 ? 1 : 0);
        const pB = b.limit > 0 ? b.spent / b.limit : (b.spent > 0 ? 1 : 0);
        return pB - pA;
      });
  }, [categorySpend, activeLimits]);

  const criticalCount = budgetRows.filter((r) => r.limit > 0 && r.spent / r.limit >= 0.9).length;

  const recentTxs = useMemo(() => filteredTxs.slice(0, 5), [filteredTxs]);

  const totalUpcoming = useMemo(
    () => upcoming.reduce((s, b) => s + (b.amount ?? 0), 0),
    [upcoming],
  );

  // ── Estados de loading / vazio ──────────────────────────────────────────
  if (hhLoading || loadingData) return <LoadingSkeleton />;

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

      {/* HEADER */}
      <motion.div variants={rowVariant} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Dashboard</p>
          <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tight">
            Visão <span className="text-accent">Geral</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {household?.name ?? 'Finanças pessoais'} — {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Button onClick={onGoToTransactions} className="self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Nova Transação
        </Button>
      </motion.div>

      {/* ALERTA ORÇAMENTO CRÍTICO */}
      <AnimatePresence>
        {!alertDismissed && criticalCount > 0 && (
          <motion.div
            key="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 p-3.5 bg-accent/10 border border-accent/25 rounded-xl">
              <Bell className="w-4 h-4 text-accent shrink-0 animate-pulse" />
              <p className="text-sm font-semibold text-accent flex-1">
                {criticalCount === 1 ? '1 categoria está' : `${criticalCount} categorias estão`} acima de 90% do limite mensal.
              </p>
              <button
                onClick={() => setAlertDismissed(true)}
                className="text-xs text-accent/70 hover:text-accent font-semibold transition-colors shrink-0"
              >
                Dispensar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LINHA 1 — KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          icon={Wallet}
          label="Renda Total da Casa"
          value={incomeDisplay}
          sub={household ? `${members?.length ?? 1} membros` : 'Este mês'}
          subColor="text-gray-400"
        />
        <KpiCard
          icon={TrendingDown}
          label="Despesas do Mês"
          value={totalSpent}
          sub={incomeDisplay > 0 ? `${((totalSpent / incomeDisplay) * 100).toFixed(0)}% da renda` : undefined}
          subColor={totalSpent / incomeDisplay > 0.8 ? 'text-accent' : 'text-amber-400'}
          accent
        />
        <KpiCard
          icon={TrendingUp}
          label="Sobra Estimada"
          value={Math.abs(surplus)}
          sub={surplus < 0 ? 'Acima da renda' : incomeDisplay > 0 ? `${((surplus / incomeDisplay) * 100).toFixed(0)}% livre` : undefined}
          subColor={surplus < 0 ? 'text-accent' : 'text-emerald-500'}
        />
      </div>

      {/* LINHA 2 — RADAR + VENCIMENTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Radar de Orçamento — 2/3 */}
        <motion.div variants={rowVariant} className="lg:col-span-2">
          <Card className="h-full">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-heading font-bold text-gray-900 dark:text-white">Radar de Orçamento</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {Object.keys(activeLimits).length === 0
                    ? 'Defina limites na aba Categorias'
                    : 'Limites mensais por categoria'}
                </p>
              </div>
              <button
                onClick={onGoToTransactions}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-accent transition-colors font-semibold"
              >
                Transações <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {budgetRows.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <TrendingDown className="w-9 h-9 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500">Nenhuma despesa registrada este mês.</p>
              </div>
            ) : (
              <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                {budgetRows.map((r) => (
                  <BudgetRow key={r.category} {...r} />
                ))}
              </motion.div>
            )}
          </Card>
        </motion.div>

        {/* Próximos Vencimentos — 1/3 */}
        <motion.div variants={rowVariant}>
          <Card className="h-full">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-base font-heading font-bold text-gray-900 dark:text-white">Próximos Vencimentos</h2>
                <p className="text-xs text-gray-500 mt-0.5">Assinaturas e parcelas</p>
              </div>
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <CalendarClock className="w-3.5 h-3.5 text-accent" />
              </div>
            </div>

            {upcoming.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <CalendarClock className="w-9 h-9 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500">Nenhum vencimento nos próximos 30 dias.</p>
              </div>
            ) : (
              <>
                <motion.div variants={container} initial="hidden" animate="show">
                  {upcoming.map((b) => <UpcomingRow key={b.id} bill={b} />)}
                </motion.div>
                {totalUpcoming > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-border flex items-center justify-between text-xs text-gray-500">
                    <span>Total (30 dias)</span>
                    <span className="font-bold text-gray-900 dark:text-white">R$ {brl(totalUpcoming)}</span>
                  </div>
                )}
              </>
            )}
          </Card>
        </motion.div>
      </div>

      {/* LINHA 3 — EXTRATO RECENTE */}
      <motion.div variants={rowVariant}>
        <Card>
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-base font-heading font-bold text-gray-900 dark:text-white">Extrato Recente da Casa</h2>
              <p className="text-xs text-gray-500 mt-0.5">Últimas movimentações</p>
            </div>
            <button
              onClick={onGoToTransactions}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-accent transition-colors font-semibold"
            >
              Ver tudo <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentTxs.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <ArrowDownLeft className="w-9 h-9 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-500">Nenhuma transação registrada este mês.</p>
            </div>
          ) : (
            <>
              <motion.div variants={container} initial="hidden" animate="show">
                {recentTxs.map((tx) => <TxRow key={tx.id} tx={tx} memberMap={memberMap} />)}
              </motion.div>

              {/* Mini-resumo */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-border grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">Entradas</p>
                  <p className="text-sm font-heading font-bold text-emerald-500">
                    + R$ {brl(recentTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0))}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">Saídas</p>
                  <p className="text-sm font-heading font-bold text-accent">
                    − R$ {brl(recentTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0))}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">Balanço</p>
                  {(() => {
                    const bal = recentTxs.reduce((s, t) => s + (t.type === 'income' ? 1 : -1) * Number(t.amount), 0);
                    return (
                      <p className={`text-sm font-heading font-bold ${bal >= 0 ? 'text-emerald-500' : 'text-accent'}`}>
                        {bal >= 0 ? '+' : '−'} R$ {brl(bal)}
                      </p>
                    );
                  })()}
                </div>
              </div>
            </>
          )}
        </Card>
      </motion.div>

    </motion.div>
  );
}
