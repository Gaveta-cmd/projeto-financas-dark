import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Wallet, Users, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useHousehold } from '../../hooks/useHousehold';

const CATEGORY_COLORS = {
  alimentacao: '#ef233c',
  transporte:  '#6366f1',
  lazer:       '#f59e0b',
  moradia:     '#10b981',
  saude:       '#ec4899',
  outros:      '#71717a',
  metas:       '#8b5cf6',
};

function brl(n) {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel() {
  return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
}

const MEMBER_COLORS = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#ec4899'];

const containerVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 240, damping: 22 } },
};

export function HouseholdTab() {
  const {
    household, members, totalHouseholdIncome,
    fetchHouseholdTransactions, fetchSpendingByMember,
    loading,
  } = useHousehold();

  const month = currentMonth();

  const [txs,       setTxs]       = useState([]);
  const [byMember,  setByMember]  = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);

  useEffect(() => {
    if (!household) { setLoadingTx(false); return; }
    setLoadingTx(true);
    Promise.all([
      fetchHouseholdTransactions(month),
      fetchSpendingByMember(month),
    ]).then(([txList, spending]) => {
      setTxs(txList);
      setByMember(spending);
      setLoadingTx(false);
    });
  }, [household, month, fetchHouseholdTransactions, fetchSpendingByMember]);

  const totalSpent = useMemo(() =>
    txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
  [txs]);

  const balance = totalHouseholdIncome - totalSpent;

  // Breakdown por categoria
  const byCategory = useMemo(() => {
    const acc = {};
    for (const t of txs.filter(t => t.type === 'expense')) {
      acc[t.category] = (acc[t.category] ?? 0) + Number(t.amount);
    }
    return Object.entries(acc)
      .map(([cat, value]) => ({ name: cat, value }))
      .sort((a, b) => b.value - a.value);
  }, [txs]);

  const recentTxs = useMemo(() =>
    [...txs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10),
  [txs]);

  // Mapa userId → nickname para o feed
  const memberMap = useMemo(() =>
    Object.fromEntries(members.map((m, i) => [m.user_id, { nickname: m.nickname || 'Membro', color: MEMBER_COLORS[i % MEMBER_COLORS.length] }])),
  [members]);

  if (loading || loadingTx) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!household) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-gray-500 text-sm">Configure seu grupo familiar para ver as finanças da casa.</p>
      </div>
    );
  }

  const maxSpend = Math.max(...byMember.map(m => m.total), 1);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header do household */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Users className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h2 className="text-xl font-heading font-extrabold text-gray-900 dark:text-white">
            {household.name}
          </h2>
          <p className="text-xs text-gray-500 capitalize">{monthLabel()}</p>
        </div>
      </motion.div>

      {/* KPI cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Renda total da casa',
            value: `R$ ${brl(totalHouseholdIncome)}`,
            icon: Wallet,
            color: '#10b981',
            bg:   'bg-emerald-500/10',
          },
          {
            label: 'Total gasto no mês',
            value: `R$ ${brl(totalSpent)}`,
            icon: TrendingDown,
            color: '#ef233c',
            bg:   'bg-accent/10',
          },
          {
            label: 'Saldo familiar',
            value: `R$ ${brl(Math.abs(balance))}`,
            icon: TrendingUp,
            color: balance >= 0 ? '#10b981' : '#ef233c',
            bg:   balance >= 0 ? 'bg-emerald-500/10' : 'bg-accent/10',
            prefix: balance < 0 ? '- ' : '',
          },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-2xl p-5">
              <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4" style={{ color: kpi.color }} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{kpi.label}</p>
              <p className="text-xl font-heading font-extrabold text-gray-900 dark:text-white">
                {kpi.prefix ?? ''}{kpi.value}
              </p>
            </div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakdown por pessoa */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Gastos por membro</h3>
          <div className="space-y-3">
            {byMember.map((m, i) => (
              <div key={m.userId}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: MEMBER_COLORS[i % MEMBER_COLORS.length] }}
                    >
                      {initials(m.nickname)}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{m.nickname}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">R$ {brl(m.total)}</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(m.total / maxSpend) * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: MEMBER_COLORS[i % MEMBER_COLORS.length] }}
                  />
                </div>
              </div>
            ))}
            {byMember.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum gasto registrado no mês.</p>
            )}
          </div>
        </motion.div>

        {/* Gráfico por categoria */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Por categoria</h3>
          {byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} paddingAngle={2}>
                  {byCategory.map(entry => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? '#71717a'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, name) => [`R$ ${brl(v)}`, name]}
                  contentStyle={{ background: 'var(--color-dark-surface, #1e293b)', border: '1px solid var(--color-dark-border, #334155)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs text-gray-600 dark:text-gray-400">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-sm text-gray-400">Sem dados no mês.</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Feed de transações recentes da família */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-2xl p-5">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Últimas movimentações da casa</h3>
        {recentTxs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhuma transação no mês.</p>
        ) : (
          <div className="space-y-2">
            {recentTxs.map(t => {
              const m = memberMap[t.user_id];
              const isExpense = t.type === 'expense';
              return (
                <div key={t.id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-dark-border/50 last:border-0">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: m?.color ?? '#71717a' }}
                  >
                    {initials(m?.nickname)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.title}</p>
                    <p className="text-xs text-gray-400">{m?.nickname ?? '?'} · {t.date.split('-').reverse().join('/')}</p>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-bold shrink-0 ${isExpense ? 'text-accent' : 'text-emerald-500'}`}>
                    {isExpense ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                    R$ {brl(t.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
