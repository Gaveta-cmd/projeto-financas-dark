import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Utensils, Car, Gamepad2, Home, Heart, MoreHorizontal,
  PieChart as PieIcon, AlertCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const CATEGORIES = [
  { key: 'alimentacao', label: 'Alimentação', icon: Utensils,       color: '#ef233c' },
  { key: 'transporte',  label: 'Transporte',  icon: Car,            color: '#6366f1' },
  { key: 'lazer',       label: 'Lazer',       icon: Gamepad2,       color: '#f59e0b' },
  { key: 'moradia',     label: 'Moradia',     icon: Home,           color: '#10b981' },
  { key: 'saude',       label: 'Saúde',       icon: Heart,          color: '#ec4899' },
  { key: 'outros',      label: 'Outros',      icon: MoreHorizontal, color: '#71717a' },
];

const CATEGORY_BY_KEY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

const RANGES = [
  { id: '30d', label: 'Últimos 30 dias', days: 30  },
  { id: '90d', label: 'Últimos 90 dias', days: 90  },
  { id: 'all', label: 'Tudo',            days: null },
];

function brl(n) {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
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

export function CategoriesTab() {
  const [rangeId, setRangeId]   = useState('30d');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');

      let query = supabase
        .from('transactions')
        .select('amount, category, type, date')
        .eq('type', 'expense');

      const range = RANGES.find((r) => r.id === rangeId);
      if (range?.days) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - range.days);
        query = query.gte('date', cutoff.toISOString().slice(0, 10));
      }

      const { data, error: err } = await query;
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
  }, [rangeId]);

  const breakdown = useMemo(() => {
    const totals = Object.fromEntries(CATEGORIES.map((c) => [c.key, 0]));
    for (const t of transactions) {
      const v = Number(t.amount);
      if (Number.isFinite(v) && totals[t.category] !== undefined) {
        totals[t.category] += v;
      }
    }
    const grand = Object.values(totals).reduce((s, n) => s + n, 0);
    const rows = CATEGORIES.map((c) => ({
      ...c,
      value: totals[c.key],
      percent: grand > 0 ? (totals[c.key] / grand) * 100 : 0,
    }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);
    return { rows, total: grand };
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tight">
            Gastos por <span className="text-accent">categoria</span>
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Veja para onde seu dinheiro está indo.
          </p>
        </div>
        <div className="flex gap-1 p-1 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl">
          {RANGES.map((r) => {
            const active = rangeId === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setRangeId(r.id)}
                className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  active ? 'text-white' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="categoriesRangeIndicator"
                    className="absolute inset-0 bg-accent rounded-lg"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl">
          <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
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
          <p className="text-gray-900 dark:text-white font-semibold mb-1">Sem despesas no período</p>
          <p className="text-gray-500 text-sm max-w-xs">
            Cadastre transações na aba <strong className="text-gray-700 dark:text-gray-300">Transações</strong> para visualizar o resumo.
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
              Total
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
                        <p className="text-gray-900 dark:text-white font-semibold text-sm">{row.label}</p>
                        <p className="text-xs text-gray-500">{row.percent.toFixed(1)}% do total</p>
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
