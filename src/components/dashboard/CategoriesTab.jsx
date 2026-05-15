import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Utensils, Car, Gamepad2, Home, Heart, MoreHorizontal, Target,
  PieChart as PieIcon, AlertCircle,
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useDemoMode } from '../../contexts/DemoContext';

const CATEGORIES = [
  { key: 'alimentacao', label: 'Alimentação', icon: Utensils,       color: '#ef233c' },
  { key: 'transporte',  label: 'Transporte',  icon: Car,            color: '#6366f1' },
  { key: 'lazer',       label: 'Lazer',       icon: Gamepad2,       color: '#f59e0b' },
  { key: 'moradia',     label: 'Moradia',     icon: Home,           color: '#10b981' },
  { key: 'saude',       label: 'Saúde',       icon: Heart,          color: '#ec4899' },
  { key: 'outros',      label: 'Outros',      icon: MoreHorizontal, color: '#71717a' },
  { key: 'metas',       label: 'Metas',       icon: Target,         color: '#8b5cf6' },
];

const CATEGORY_BY_KEY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

function brl(n) {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

// Local YYYY-MM-DD (sem usar toISOString que faria UTC e poderia "voltar 1 dia").
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

// Compara totais do mês atual vs anterior para uma categoria.
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

export function CategoriesTab() {
  const { isDemo, demoData } = useDemoMode();

  const [monthOffset, setMonthOffset] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const { current, previous } = useMemo(() => ({
    current:  monthBounds(monthOffset),
    previous: monthBounds(monthOffset - 1),
  }), [monthOffset]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');

      if (isDemo) {
        if (!cancelled) {
          // Filtra apenas despesas da janela de datas (como a query real faria)
          const startStr = isoDay(previous.start);
          const endStr   = isoDay(current.end);
          const filtered = demoData.transactions.filter(
            (t) => t.type === 'expense' && t.date >= startStr && t.date <= endStr
          );
          setTransactions(filtered);
          setLoading(false);
        }
        return;
      }

      const { data, error: err } = await supabase
        .from('transactions')
        .select('amount, category, type, date')
        .eq('type', 'expense')
        .gte('date', isoDay(previous.start))
        .lte('date', isoDay(current.end));

      if (cancelled) return;
      if (err) {
        setError('Não foi possível carregar suas categorias.');
        setTransactions([]);
      } else {
        setTransactions(data ?? []);
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
      if (totalsCurrent[t.category] === undefined) continue;
      if (t.date >= currStart && t.date <= currEnd) {
        totalsCurrent[t.category] += v;
      } else if (t.date >= prevStart && t.date <= prevEnd) {
        totalsPrevious[t.category] += v;
      }
    }

    const grand = Object.values(totalsCurrent).reduce((s, n) => s + n, 0);
    const rows = CATEGORIES.map((c) => ({
      ...c,
      value:   totalsCurrent[c.key],
      prev:    totalsPrevious[c.key],
      percent: grand > 0 ? (totalsCurrent[c.key] / grand) * 100 : 0,
      change:  computeChange(totalsCurrent[c.key], totalsPrevious[c.key]),
    }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);
    return { rows, total: grand };
  }, [transactions, current.start, current.end, previous.start, previous.end]);

  const monthLabel = fmtMonth(current.start);
  const isCurrentMonth = monthOffset === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tight">
            Gastos por <span className="text-accent">categoria</span>
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Veja para onde seu dinheiro está indo, mês a mês.
          </p>
        </div>

        {/* Seletor de mês */}
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
      ) : breakdown.rows.length === 0 ? (
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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Gráfico */}
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
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdown.rows}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
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

          {/* Lista detalhada */}
          <div className="lg:col-span-3 flex flex-col gap-2.5">
            <AnimatePresence initial={false}>
              {breakdown.rows.map((row, idx) => {
                const Icon = CATEGORY_BY_KEY[row.key].icon;
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
                        <div className="flex items-center gap-2">
                          <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">{row.label}</p>
                          <ChangeBadge change={row.change} />
                        </div>
                        <p className="text-xs text-gray-500">
                          {row.percent.toFixed(1)}% do total
                          {row.prev > 0 && (
                            <> · mês passado: R$ {brl(row.prev)}</>
                          )}
                        </p>
                      </div>
                      <p className="text-gray-900 dark:text-white font-heading font-bold text-base shrink-0">
                        R$ {brl(row.value)}
                      </p>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: row.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${row.percent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 + idx * 0.04 }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
