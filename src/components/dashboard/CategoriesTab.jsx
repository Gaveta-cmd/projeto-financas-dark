import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Utensils, Car, Gamepad2, Home, Heart, MoreHorizontal, Target,
  PieChart as PieIcon, AlertCircle,
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus,
  Tv, Zap, Repeat, CalendarClock, Trophy, X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '../../lib/supabaseClient';
import { useDemoMode } from '../../contexts/DemoContext';
import { useSpendingLimits } from '../../hooks/useSpendingLimits';

const CATEGORIES = [
  { key: 'alimentacao',   label: 'Alimentação',   icon: Utensils,       color: '#ef233c' },
  { key: 'transporte',    label: 'Transporte',     icon: Car,            color: '#6366f1' },
  { key: 'lazer',         label: 'Lazer',          icon: Gamepad2,       color: '#f59e0b' },
  { key: 'moradia',       label: 'Moradia',        icon: Home,           color: '#10b981' },
  { key: 'saude',         label: 'Saúde',          icon: Heart,          color: '#ec4899' },
  { key: 'entretenimento', label: 'Entretenimento', icon: Tv,            color: '#8b5cf6' },
  { key: 'produtividade', label: 'Produtividade',  icon: Zap,            color: '#14b8a6' },
  { key: 'outros',        label: 'Outros',         icon: MoreHorizontal, color: '#71717a' },
  { key: 'metas',         label: 'Metas',          icon: Target,         color: '#8b5cf6' },
];

const CATEGORY_BY_KEY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

const CONFETTI_KEY = 'vf_celebrated_installments';

function getCelebrated() {
  try { return new Set(JSON.parse(localStorage.getItem(CONFETTI_KEY) || '[]')); }
  catch { return new Set(); }
}

function markCelebrated(id) {
  const set = getCelebrated();
  set.add(String(id));
  localStorage.setItem(CONFETTI_KEY, JSON.stringify([...set]));
}

function brl(n) {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function isoDay(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function monthBounds(offset) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return { start, end };
}

function fmtMonth(d) {
  const s = d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getEndMonth(inst) {
  const [y, m] = inst.start_date.split('-').map(Number);
  const endDate = new Date(y, m - 1 + inst.total_installments - 1, 1);
  const name = endDate.toLocaleString('pt-BR', { month: 'long' });
  return `${name.charAt(0).toUpperCase() + name.slice(1)} ${endDate.getFullYear()}`;
}

function computeChange(curr, prev) {
  if (curr === 0 && prev === 0) return null;
  if (prev === 0) return { dir: 'up', label: 'novo' };
  const pct = ((curr - prev) / prev) * 100;
  if (Math.abs(pct) < 0.5) return { dir: 'flat', label: '0%' };
  return {
    dir: pct > 0 ? 'up' : 'down',
    label: `${pct > 0 ? '+' : ''}${pct.toFixed(0)}%`,
  };
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl p-3 shadow-2xl">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.payload.color }} />
        <span className="text-gray-700 dark:text-gray-300 text-xs font-medium">{entry.payload.label}</span>
      </div>
      <p className="text-gray-900 dark:text-white font-heading font-bold text-sm">R$ {brl(entry.value)}</p>
      <p className="text-gray-500 text-[11px] mt-0.5">{entry.payload.percent.toFixed(1)}% do total</p>
    </div>
  );
}

function ChangeBadge({ change }) {
  if (!change) return null;
  const styles = {
    up:   'text-accent bg-accent/10 border-accent/20',
    down: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    flat: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
  };
  const Icon = change.dir === 'up' ? TrendingUp : change.dir === 'down' ? TrendingDown : Minus;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md border ${styles[change.dir]}`}>
      <Icon className="w-3 h-3" />
      {change.label}
    </span>
  );
}

function LimitBar({ spent, limit }) {
  const ratio = limit > 0 ? spent / limit : 0;
  const barColor = ratio > 1 ? '#ef4444' : ratio > 0.8 ? '#f59e0b' : '#10b981';
  return (
    <div className="h-1.5 w-full bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: barColor }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(ratio * 100, 100)}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}

export function CategoriesTab() {
  const { isDemo, demoData } = useDemoMode();
  const { limits, saveLimit, loading: loadingLimits } = useSpendingLimits();
  const [limitInputs, setLimitInputs]   = useState({});
  const [savingLimits, setSavingLimits] = useState({});

  const [monthOffset, setMonthOffset]   = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [celebration, setCelebration]   = useState(null);

  const { current, previous } = useMemo(() => ({
    current:  monthBounds(monthOffset),
    previous: monthBounds(monthOffset - 1),
  }), [monthOffset]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');

      let loadedTransactions = [];
      let loadedSubs = [];
      let loadedInsts = [];

      if (isDemo) {
        const startStr = isoDay(previous.start);
        const endStr   = isoDay(current.end);
        loadedTransactions = demoData.transactions.filter(
          (t) => t.type === 'expense' && t.date >= startStr && t.date <= endStr
        );
        loadedSubs  = demoData.subscriptions;
        loadedInsts = demoData.installments;
      } else {
        const [txRes, subRes, instRes] = await Promise.all([
          supabase
            .from('transactions')
            .select('amount, category, type, date, title')
            .eq('type', 'expense')
            .gte('date', isoDay(previous.start))
            .lte('date', isoDay(current.end)),
          supabase.from('subscriptions').select('id, name, amount, billing_cycle, category, color'),
          supabase.from('installments').select('id, name, total_amount, installment_amount, total_installments, paid_installments, start_date'),
        ]);

        if (cancelled) return;

        if (txRes.error) {
          setError('Não foi possível carregar suas categorias.');
          setLoading(false);
          return;
        }
        loadedTransactions = txRes.data ?? [];
        loadedSubs  = subRes.error  ? [] : (subRes.data  ?? []);
        loadedInsts = instRes.error ? [] : (instRes.data ?? []);
      }

      if (cancelled) return;

      setTransactions(loadedTransactions);
      setSubscriptions(loadedSubs);
      setInstallments(loadedInsts);

      // Detecta parcelamentos quitados não celebrados
      const celebrated = getCelebrated();
      const newlyDone = loadedInsts.filter(
        (inst) =>
          Number(inst.paid_installments) >= Number(inst.total_installments) &&
          !celebrated.has(String(inst.id)),
      );
      if (newlyDone.length > 0) {
        const first = newlyDone[0];
        markCelebrated(first.id);
        setCelebration({ name: first.name });
        setTimeout(() => {
          try { confetti({ particleCount: 130, spread: 80, origin: { y: 0.55 } }); } catch { /* ignore */ }
        }, 350);
      }

      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [current.end, previous.start, isDemo]);

  const breakdown = useMemo(() => {
    const currStart = isoDay(current.start);
    const currEnd   = isoDay(current.end);
    const prevStart = isoDay(previous.start);
    const prevEnd   = isoDay(previous.end);

    const empty = () => Object.fromEntries(CATEGORIES.map((c) => [c.key, 0]));
    const totalsCurrent  = empty();
    const totalsPrevious = empty();

    for (const t of transactions) {
      const v = Number(t.amount);
      if (!Number.isFinite(v)) continue;
      const catKey = CATEGORY_BY_KEY[t.category] ? t.category : 'outros';
      if (t.date >= currStart && t.date <= currEnd) {
        totalsCurrent[catKey] = (totalsCurrent[catKey] ?? 0) + v;
      } else if (t.date >= prevStart && t.date <= prevEnd) {
        totalsPrevious[catKey] = (totalsPrevious[catKey] ?? 0) + v;
      }
    }

    // Inclui assinaturas no mês atual
    for (const sub of subscriptions) {
      const monthly = sub.billing_cycle === 'yearly'
        ? Number(sub.amount) / 12
        : Number(sub.amount);
      const catKey = CATEGORY_BY_KEY[sub.category] ? sub.category : 'outros';
      totalsCurrent[catKey] = (totalsCurrent[catKey] ?? 0) + monthly;
    }

    // Agrupa subscriptions por categoria para exibição inline
    const subsByCat = {};
    for (const sub of subscriptions) {
      const catKey = CATEGORY_BY_KEY[sub.category] ? sub.category : 'outros';
      if (!subsByCat[catKey]) subsByCat[catKey] = [];
      subsByCat[catKey].push(sub);
    }

    const grand = Object.values(totalsCurrent).reduce((s, n) => s + n, 0);
    const rows = CATEGORIES.map((c) => ({
      ...c,
      value:   totalsCurrent[c.key],
      prev:    totalsPrevious[c.key],
      percent: grand > 0 ? (totalsCurrent[c.key] / grand) * 100 : 0,
      change:  computeChange(totalsCurrent[c.key], totalsPrevious[c.key]),
      subs:    subsByCat[c.key] ?? [],
    }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);

    return { rows, total: grand };
  }, [transactions, subscriptions, current.start, current.end, previous.start, previous.end]);

  const activeInstallments = useMemo(
    () => installments.filter((i) => Number(i.paid_installments) < Number(i.total_installments)),
    [installments],
  );

  const monthLabel    = fmtMonth(current.start);
  const isCurrentMonth = monthOffset === 0;

  async function handleSaveLimit(category) {
    const raw = limitInputs[category] !== undefined
      ? limitInputs[category]
      : limits[category];
    if (!raw || Number(raw) <= 0) return;
    setSavingLimits((prev) => ({ ...prev, [category]: true }));
    await saveLimit(category, raw);
    setSavingLimits((prev) => ({ ...prev, [category]: false }));
    setLimitInputs((prev) => { const n = { ...prev }; delete n[category]; return n; });
  }

  return (
    <div className="space-y-6">
      {/* Celebration toast */}
      <AnimatePresence>
        {celebration && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-white dark:bg-dark-surface border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 rounded-2xl px-5 py-4 flex items-center gap-4 max-w-sm w-[calc(100%-2rem)]"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-gray-900 dark:text-white text-sm">🎉 Parabéns!</p>
              <p className="text-xs text-gray-500 truncate">Você quitou {celebration.name}!</p>
            </div>
            <button
              onClick={() => setCelebration(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tight">
            Gastos por <span className="text-accent">categoria</span>
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Transações, assinaturas e parcelamentos — mês a mês.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl">
          <button
            onClick={() => setMonthOffset((o) => o - 1)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 text-xs font-semibold text-gray-900 dark:text-white min-w-[120px] text-center">
            {monthLabel}
          </span>
          <button
            onClick={() => setMonthOffset((o) => o + 1)}
            disabled={isCurrentMonth}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 h-80 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl animate-pulse" />
          <div className="lg:col-span-3 flex flex-col gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 p-4 bg-accent/10 border border-accent/20 rounded-xl">
          <AlertCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <p className="text-accent text-sm">{error}</p>
        </div>
      ) : breakdown.rows.length === 0 && activeInstallments.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16 bg-white dark:bg-dark-surface border border-dashed border-gray-200 dark:border-dark-border rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
            <PieIcon className="w-7 h-7 text-accent" />
          </div>
          <p className="text-gray-900 dark:text-white font-semibold mb-1">Sem despesas em {monthLabel}</p>
          <p className="text-gray-500 text-sm max-w-xs">
            Cadastre transações na aba <strong className="text-gray-700 dark:text-gray-300">Transações</strong> ou navegue para outro mês.
          </p>
        </div>
      ) : (
        <>
          {breakdown.rows.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Gráfico de pizza */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="lg:col-span-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl p-6 relative overflow-hidden"
              >
                <h3 className="text-sm font-heading font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-1">
                  Total em {monthLabel}
                </h3>
                <p className="text-3xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
                  R$ {brl(breakdown.total)}
                </p>
                {subscriptions.length > 0 && isCurrentMonth && (
                  <p className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
                    <Repeat className="w-3 h-3 text-accent shrink-0" />
                    Inclui {subscriptions.length} {subscriptions.length === 1 ? 'assinatura' : 'assinaturas'} ({brl(subscriptions.reduce((s, sub) => s + (sub.billing_cycle === 'yearly' ? Number(sub.amount) / 12 : Number(sub.amount)), 0))} /mês)
                  </p>
                )}
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={breakdown.rows}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={88}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {breakdown.rows.map((row) => (
                          <Cell key={row.key} fill={row.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} cursor={false} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Lista por categoria */}
              <div className="lg:col-span-3 flex flex-col gap-2.5">
                <AnimatePresence initial={false}>
                  {breakdown.rows.map((row, idx) => {
                    const Icon = (CATEGORY_BY_KEY[row.key] ?? CATEGORY_BY_KEY.outros).icon;
                    return (
                      <motion.div
                        key={row.key}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.04 }}
                        className="relative bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-4 overflow-hidden"
                      >
                        <div className="flex items-center gap-4 mb-3">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center border shrink-0"
                            style={{ backgroundColor: `${row.color}1a`, borderColor: `${row.color}33` }}
                          >
                            <Icon className="w-5 h-5" style={{ color: row.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-gray-900 dark:text-white font-semibold text-sm">{row.label}</p>
                              <ChangeBadge change={row.change} />
                            </div>
                            <p className="text-xs text-gray-500">
                              {row.percent.toFixed(1)}% do total
                              {row.prev > 0 && <> · mês passado: R$ {brl(row.prev)}</>}
                            </p>
                          </div>
                          <p className="text-gray-900 dark:text-white font-heading font-bold text-base shrink-0">
                            R$ {brl(row.value)}
                          </p>
                        </div>

                        {/* Barra de progresso */}
                        <div className="h-1.5 w-full bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden mb-3">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: row.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${row.percent}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 + idx * 0.04 }}
                          />
                        </div>

                        {/* Assinaturas dentro desta categoria */}
                        {row.subs.length > 0 && (
                          <div className="flex flex-col gap-1.5 mt-1">
                            {row.subs.map((sub) => {
                              const monthly = sub.billing_cycle === 'yearly'
                                ? Number(sub.amount) / 12
                                : Number(sub.amount);
                              return (
                                <div
                                  key={sub.id}
                                  className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-dark-bg/50"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Repeat className="w-3 h-3 text-gray-400 shrink-0" />
                                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{sub.name}</span>
                                    <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                                      Assinatura
                                    </span>
                                  </div>
                                  <span className="text-xs font-heading font-semibold text-gray-700 dark:text-gray-300 shrink-0 ml-2">
                                    R$ {brl(monthly)}/mês
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Limite de gasto */}
                        {!isDemo && !loadingLimits && (
                          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-border">
                            {limits[row.key] > 0 && (
                              <div className="mb-2.5">
                                <LimitBar spent={row.value} limit={limits[row.key]} />
                                <div className="flex items-center justify-between mt-1.5">
                                  <span className="text-[11px] text-gray-500">
                                    R$ {brl(row.value)} de R$ {brl(limits[row.key])}
                                  </span>
                                  {row.value > limits[row.key] && (
                                    <span className="text-[11px] font-semibold text-red-500 flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" />
                                      Limite ultrapassado
                                    </span>
                                  )}
                                  {row.value > limits[row.key] * 0.8 && row.value <= limits[row.key] && (
                                    <span className="text-[11px] font-semibold text-amber-500">
                                      {((row.value / limits[row.key]) * 100).toFixed(0)}% do limite
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                step="0.01"
                                placeholder="Limite mensal (R$)"
                                value={
                                  limitInputs[row.key] !== undefined
                                    ? limitInputs[row.key]
                                    : limits[row.key] > 0 ? String(limits[row.key]) : ''
                                }
                                onChange={(e) =>
                                  setLimitInputs((prev) => ({ ...prev, [row.key]: e.target.value }))
                                }
                                className="flex-1 text-xs px-3 py-1.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent/50 text-gray-900 dark:text-white placeholder:text-gray-400 min-w-0"
                              />
                              <button
                                onClick={() => handleSaveLimit(row.key)}
                                disabled={!!savingLimits[row.key]}
                                className="shrink-0 text-xs px-3 py-1.5 bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent font-semibold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                              >
                                {savingLimits[row.key] ? '...' : 'Salvar limite'}
                              </button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Seção de parcelamentos ativos */}
          {activeInstallments.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CalendarClock className="w-4 h-4 text-accent" />
                <h3 className="text-base font-heading font-semibold text-gray-900 dark:text-white">
                  Parcelamentos Ativos
                </h3>
                <span className="text-xs text-gray-500">({activeInstallments.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeInstallments.map((inst, idx) => {
                  const paid  = Number(inst.paid_installments);
                  const total = Number(inst.total_installments);
                  const pct   = total > 0 ? (paid / total) * 100 : 0;
                  const remaining = total - paid;

                  return (
                    <motion.div
                      key={inst.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {inst.name}
                            </p>
                            <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                              Parcelamento
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Termina em {getEndMonth(inst)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-heading font-bold text-gray-900 dark:text-white">
                            R$ {brl(inst.installment_amount)}
                          </p>
                          <p className="text-[10px] text-gray-500">/parcela</p>
                        </div>
                      </div>

                      {/* Barra de progresso */}
                      <div className="h-1.5 w-full bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden mb-1.5">
                        <motion.div
                          className="h-full rounded-full bg-indigo-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 + idx * 0.05 }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        <span>{paid}/{total} parcelas pagas</span>
                        <span>{remaining} restante{remaining !== 1 ? 's' : ''}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
