import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingDown, TrendingUp, BarChart2, Link2 } from 'lucide-react';
import { Card } from './Card';

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = ['Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai'];

const CATEGORIES = [
  { key: 'alimentacao', label: 'Alimentação', color: '#ef233c' },
  { key: 'transporte',  label: 'Transporte',  color: '#6366f1' },
  { key: 'lazer',       label: 'Lazer',       color: '#f59e0b' },
  { key: 'moradia',     label: 'Moradia',     color: '#10b981' },
  { key: 'outros',      label: 'Outros',      color: '#71717a' },
];

const CATEGORY_SPLITS = {
  alimentacao: 0.24,
  transporte:  0.09,
  lazer:       0.14,
  moradia:     0.38,
  outros:      0.15,
};

const FILTER_TABS = [{ key: 'all', label: 'Todos', color: '#ef233c' }, ...CATEGORIES];

// ─── Mock data generation (deterministic per account id) ─────────────────────

function strToSeed(str) {
  return Array.from(str).reduce((h, c) => ((h * 33) ^ c.charCodeAt(0)) >>> 0, 5381);
}

function seeded(seed, offset = 0) {
  const x = Math.sin(seed + offset) * 10000;
  return x - Math.floor(x);
}

function generateAccountData(account) {
  const seed = strToSeed(account.id);
  const baseMonthly = account.balance * (0.40 + seeded(seed) * 0.20);

  return MONTHS.map((month, mIdx) => {
    const row = { month };
    CATEGORIES.forEach((cat, cIdx) => {
      const variance = 0.78 + seeded(seed, mIdx * 13 + cIdx * 7) * 0.44;
      row[cat.key] = Math.round(baseMonthly * CATEGORY_SPLITS[cat.key] * variance);
    });
    return row;
  });
}

function mergeData(datasets) {
  return MONTHS.map((month, mIdx) => {
    const row = { month };
    CATEGORIES.forEach(cat => {
      row[cat.key] = datasets.reduce((s, data) => s + (data[mIdx]?.[cat.key] ?? 0), 0);
    });
    return row;
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function brl(n) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function useCountUp(target, delayMs = 600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    setValue(0);
    let raf, startTs = null;
    const duration = 1000;
    const step = (ts) => {
      if (!startTs) startTs = ts + delayMs;
      const elapsed = ts - startTs;
      if (elapsed < 0) { raf = requestAnimationFrame(step); return; }
      const t = Math.min(elapsed / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(step);
      else setValue(target);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps
  return value;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skeleton({ className = '', style }) {
  return (
    <motion.div
      className={`bg-zinc-800 rounded-lg ${className}`}
      style={style}
      animate={{ opacity: [0.4, 0.85, 0.4] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, e) => s + (e.value ?? 0), 0);
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-2xl min-w-[168px]">
      <p className="text-zinc-400 text-xs font-medium mb-2.5 uppercase tracking-wider">{label}</p>
      {payload.map((entry) => {
        const cat = CATEGORIES.find(c => c.key === entry.dataKey);
        return (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-sm mb-1.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.fill }} />
              <span className="text-zinc-300">{cat?.label ?? entry.dataKey}</span>
            </span>
            <span className="text-white font-semibold">R$ {brl(entry.value)}</span>
          </div>
        );
      })}
      {payload.length > 1 && (
        <div className="mt-2 pt-2 border-t border-zinc-700 flex justify-between text-sm">
          <span className="text-zinc-400">Total</span>
          <span className="text-white font-bold">R$ {brl(total)}</span>
        </div>
      )}
    </div>
  );
}

function KPICard({ label, value, sub, trendUp, animDelay = 0 }) {
  const displayValue = useCountUp(value, animDelay * 1000 + 500);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: animDelay, ease: 'easeOut' }}
      className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4"
    >
      <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className="text-white text-xl font-heading font-extrabold tracking-tight">
        R$ {brl(displayValue)}
      </p>
      {sub && (
        <div className={`flex items-center gap-1 text-xs font-semibold mt-1 ${
          trendUp === undefined
            ? 'text-zinc-500'
            : trendUp ? 'text-red-400' : 'text-emerald-400'
        }`}>
          {trendUp !== undefined && (
            trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
          )}
          <span>{sub}</span>
        </div>
      )}
    </motion.div>
  );
}

function EmptyState({ onGoToAccounts }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-14 gap-4 text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center">
        <BarChart2 className="w-7 h-7 text-zinc-600" />
      </div>
      <div>
        <p className="text-white font-semibold text-base mb-1.5">Gráfico indisponível</p>
        <p className="text-zinc-500 text-sm max-w-[260px] leading-relaxed">
          Conecte pelo menos uma conta bancária para visualizar seus gastos mensais por categoria.
        </p>
      </div>
      {onGoToAccounts && (
        <button onClick={onGoToAccounts} className="btn-connect mt-1">
          <Link2 className="w-4 h-4" />
          Conectar conta
        </button>
      )}
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MonthlyExpensesChart({ accounts = [], onGoToAccounts }) {
  const [loading, setLoading]             = useState(true);
  const [activeAccount, setActiveAccount] = useState('all');
  const [activeFilter, setActiveFilter]   = useState('all');

  // Reset selected account if it's disconnected
  useEffect(() => {
    if (activeAccount !== 'all' && !accounts.some(a => a.id === activeAccount)) {
      setActiveAccount('all');
    }
  }, [accounts]); // eslint-disable-line react-hooks/exhaustive-deps

  // Loading animation: fires on mount + when switching accounts
  useEffect(() => {
    if (accounts.length === 0) { setLoading(false); return; }
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 1300);
    return () => clearTimeout(t);
  }, [activeAccount, accounts.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate expense data per account (deterministic mock)
  const allAccountData = useMemo(
    () => accounts.map(acc => ({ id: acc.id, data: generateAccountData(acc) })),
    [accounts],
  );

  const monthlyData = useMemo(() => {
    if (activeAccount === 'all') return mergeData(allAccountData.map(a => a.data));
    return allAccountData.find(a => a.id === activeAccount)?.data ?? [];
  }, [activeAccount, allAccountData]);

  // KPI calculations
  const current = monthlyData[monthlyData.length - 1] ?? {};
  const prev    = monthlyData[monthlyData.length - 2] ?? {};

  const currentTotal = CATEGORIES.reduce((s, c) => s + (current[c.key] ?? 0), 0);
  const prevTotal    = CATEGORIES.reduce((s, c) => s + (prev[c.key]    ?? 0), 0);
  const deltaPercent = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;
  const isUp         = deltaPercent > 0;

  const biggestCat = CATEGORIES.reduce((best, c) =>
    (current[c.key] ?? 0) > (current[best.key] ?? 0) ? c : best,
  );

  const avgMonthly = monthlyData.length
    ? Math.round(
        monthlyData.reduce((s, m) => s + CATEGORIES.reduce((cs, c) => cs + (m[c.key] ?? 0), 0), 0)
        / monthlyData.length,
      )
    : 0;

  const visibleBars = activeFilter === 'all'
    ? CATEGORIES
    : CATEGORIES.filter(c => c.key === activeFilter);

  const showAccountTabs = accounts.length > 1;
  const accountTabs = [{ id: 'all', name: 'Todas as contas', color: '#ef233c', abbr: '' }, ...accounts];

  // Subtitle under header
  const subtitle = accounts.length === 0
    ? 'Nenhuma conta conectada'
    : accounts.length === 1
      ? `${accounts[0].name} · últimos 6 meses`
      : activeAccount === 'all'
        ? `${accounts.length} contas · últimos 6 meses`
        : `${accounts.find(a => a.id === activeAccount)?.name} · últimos 6 meses`;

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-heading font-bold text-white">Gastos Mensais</h2>
          <p className="text-zinc-500 text-sm mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* Empty state */}
      {accounts.length === 0 ? (
        <EmptyState onGoToAccounts={onGoToAccounts} />
      ) : (
        <>
          {/* Account selector — only when 2+ accounts */}
          {showAccountTabs && (
            <div className="flex gap-2 flex-wrap mb-5">
              {accountTabs.map((acc) => {
                const isActive = activeAccount === acc.id;
                return (
                  <motion.button
                    key={acc.id}
                    onClick={() => { setActiveAccount(acc.id); setActiveFilter('all'); }}
                    whileTap={{ scale: 0.93 }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
                      isActive
                        ? 'text-white border-transparent'
                        : 'text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200'
                    }`}
                    style={isActive ? { backgroundColor: acc.color, borderColor: acc.color } : {}}
                  >
                    {acc.abbr && (
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold leading-none"
                        style={
                          isActive
                            ? { background: 'rgba(255,255,255,0.2)' }
                            : { background: `${acc.color}33`, color: acc.color }
                        }
                      >
                        {acc.abbr[0]}
                      </span>
                    )}
                    {acc.name}
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Loading skeleton ↔ Chart content */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="skeleton"
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-5"
              >
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-[76px]" />)}
                </div>
                <div className="flex gap-2">
                  {[52, 44, 76, 64, 48, 60].map((w, i) => (
                    <Skeleton key={i} className="h-7 rounded-full" style={{ width: w }} />
                  ))}
                </div>
                <div className="flex items-end gap-2 h-52">
                  {[62, 80, 55, 90, 68, 84].map((h, i) => (
                    <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="flex gap-4 pt-1 border-t border-zinc-800">
                  {[72, 68, 48, 60, 52].map((w, i) => (
                    <Skeleton key={i} className="h-4 rounded" style={{ width: w }} />
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`content-${activeAccount}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col gap-5"
              >
                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <KPICard
                    label="Total em Mai"
                    value={currentTotal}
                    sub={`${isUp ? '+' : ''}${deltaPercent.toFixed(1)}% vs Abr`}
                    trendUp={isUp}
                    animDelay={0}
                  />
                  <KPICard
                    label="Maior Categoria"
                    value={current[biggestCat.key] ?? 0}
                    sub={biggestCat.label}
                    animDelay={0.08}
                  />
                  <KPICard
                    label="Média Mensal"
                    value={avgMonthly}
                    sub="últimos 6 meses"
                    animDelay={0.16}
                  />
                </div>

                {/* Category filter tabs */}
                <div className="flex gap-2 flex-wrap">
                  {FILTER_TABS.map((tab) => {
                    const isActive = activeFilter === tab.key;
                    return (
                      <motion.button
                        key={tab.key}
                        onClick={() => setActiveFilter(tab.key)}
                        whileTap={{ scale: 0.93 }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 border ${
                          isActive
                            ? 'text-white border-transparent'
                            : 'text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200'
                        }`}
                        style={isActive ? { backgroundColor: tab.color, borderColor: tab.color } : {}}
                      >
                        {tab.label}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Chart */}
                <div key={`${activeFilter}-${activeAccount}`} className="w-full h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyData}
                      margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                      barCategoryGap="28%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis
                        dataKey="month"
                        stroke="#52525b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        dy={8}
                      />
                      <YAxis
                        stroke="#52525b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 4 }}
                      />
                      {visibleBars.map((cat, idx) => (
                        <Bar
                          key={cat.key}
                          dataKey={cat.key}
                          fill={cat.color}
                          stackId={activeFilter === 'all' ? 'stack' : undefined}
                          radius={
                            activeFilter !== 'all'
                              ? [4, 4, 4, 4]
                              : idx === visibleBars.length - 1
                                ? [4, 4, 0, 0]
                                : [0, 0, 0, 0]
                          }
                          animationBegin={activeFilter === 'all' ? idx * 70 : 0}
                          animationDuration={600}
                          animationEasing="ease-out"
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1 border-t border-zinc-800">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setActiveFilter(activeFilter === cat.key ? 'all' : cat.key)}
                      className={`flex items-center gap-1.5 text-xs font-medium transition-all duration-200 ${
                        activeFilter !== 'all' && activeFilter !== cat.key
                          ? 'opacity-25'
                          : 'opacity-100 hover:opacity-70'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: cat.color }} />
                      <span className="text-zinc-400">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </Card>
  );
}
