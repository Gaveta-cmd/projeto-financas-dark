import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Plus, Trash2, Pencil, Check, X, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { useBudgetEstimates } from '../../hooks/useBudgetEstimates';
import { useHousehold } from '../../hooks/useHousehold';

function brl(n) {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function offsetMonth(base, delta) {
  const [y, m] = base.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmtMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  const s = new Date(y, m - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const containerVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
};

function EstimateRow({ estimate, onDelete, onUpdate }) {
  const [editing,  setEditing]  = useState(false);
  const [label,    setLabel]    = useState(estimate.label);
  const [amount,   setAmount]   = useState(String(estimate.amount));
  const [saving,   setSaving]   = useState(false);

  async function handleSave() {
    if (!label.trim() || Number(amount) <= 0) return;
    setSaving(true);
    await onUpdate(estimate.id, label.trim(), amount);
    setSaving(false);
    setEditing(false);
  }

  function handleCancel() {
    setLabel(estimate.label);
    setAmount(String(estimate.amount));
    setEditing(false);
  }

  return (
    <motion.div
      layout
      variants={itemVariants}
      className="flex items-center gap-3 p-3 bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-xl"
    >
      {editing ? (
        <>
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Descrição"
            className="flex-1 min-w-0 text-sm px-2 py-1 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent/50 text-gray-900 dark:text-white"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="R$ 0,00"
            className="w-28 text-sm px-2 py-1 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent/50 text-gray-900 dark:text-white"
          />
          <button onClick={handleSave} disabled={saving} className="w-7 h-7 flex items-center justify-center rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleCancel} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{estimate.label}</p>
          </div>
          <span className="text-sm font-heading font-bold text-gray-900 dark:text-white shrink-0">
            R$ {brl(estimate.amount)}
          </span>
          <button onClick={() => setEditing(true)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-accent hover:bg-accent/10 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(estimate.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </motion.div>
  );
}

export function SimulatorTab() {
  const [monthOffset, setMonthOffset] = useState(0);
  const base  = currentYearMonth();
  const month = offsetMonth(base, monthOffset);

  const { estimates, loading, save, update, remove } = useBudgetEstimates(month);
  const { totalHouseholdIncome } = useHousehold();

  const [newLabel,  setNewLabel]  = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [adding,    setAdding]    = useState(false);
  const [showForm,  setShowForm]  = useState(false);

  const totalEstimated = useMemo(
    () => estimates.reduce((s, e) => s + Number(e.amount), 0),
    [estimates],
  );
  const surplus     = totalHouseholdIncome - totalEstimated;
  const commitPct   = totalHouseholdIncome > 0
    ? Math.min((totalEstimated / totalHouseholdIncome) * 100, 100)
    : 0;
  const surplusColor = surplus >= 0 ? 'text-emerald-500' : 'text-accent';
  const barColor     = commitPct >= 90 ? '#ef233c' : commitPct >= 60 ? '#f59e0b' : '#10b981';

  async function handleAdd() {
    if (!newLabel.trim() || Number(newAmount) <= 0) return;
    setAdding(true);
    await save(newLabel.trim(), newAmount);
    setAdding(false);
    setNewLabel('');
    setNewAmount('');
    setShowForm(false);
  }

  const isCurrentMonth = monthOffset === 0;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tight">
            Simulador de <span className="text-accent">Sobra</span>
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Estime suas despesas e veja quanto sobra para investir.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setMonthOffset((o) => o - 1)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 text-xs font-semibold text-gray-900 dark:text-white min-w-[130px] text-center">
            {fmtMonth(month)}
          </span>
          <button
            onClick={() => setMonthOffset((o) => o + 1)}
            disabled={isCurrentMonth}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de estimativas */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Despesas estimadas</h3>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent hover:bg-red-600 text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar
            </button>
          </div>

          {/* Formulário de adição */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 p-3 bg-accent/5 border border-accent/20 rounded-xl">
                  <input
                    autoFocus
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="Ex: Energia elétrica"
                    className="flex-1 min-w-0 text-sm px-3 py-2 bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40 text-gray-900 dark:text-white placeholder:text-gray-400"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="R$ 0,00"
                    className="w-28 text-sm px-3 py-2 bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40 text-gray-900 dark:text-white placeholder:text-gray-400"
                  />
                  <button
                    onClick={handleAdd}
                    disabled={adding}
                    className="px-3 py-2 rounded-lg bg-accent hover:bg-red-600 text-white text-xs font-semibold transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {adding ? '...' : 'Salvar'}
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-xl animate-pulse" />
              ))}
            </div>
          ) : estimates.length === 0 ? (
            <div className="flex flex-col items-center text-center py-12 bg-white dark:bg-dark-surface border border-dashed border-gray-200 dark:border-dark-border rounded-2xl">
              <Calculator className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm font-semibold text-gray-500">Nenhuma despesa estimada</p>
              <p className="text-xs text-gray-400 mt-1">Adicione suas contas fixas e variáveis do mês.</p>
            </div>
          ) : (
            <motion.div layout className="space-y-2">
              <AnimatePresence>
                {estimates.map((est) => (
                  <EstimateRow
                    key={est.id}
                    estimate={est}
                    onDelete={remove}
                    onUpdate={update}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>

        {/* Card de resultado */}
        <motion.div variants={itemVariants} className="space-y-4">
          {/* Renda total */}
          <div className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-2xl p-5">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Renda total da casa</p>
            <p className="text-2xl font-heading font-extrabold text-gray-900 dark:text-white">
              R$ {brl(totalHouseholdIncome)}
            </p>
          </div>

          {/* Resumo */}
          <div className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-2xl p-5 space-y-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total estimado</p>
              <p className="text-lg font-heading font-bold text-gray-900 dark:text-white">
                R$ {brl(totalEstimated)}
              </p>
            </div>

            {/* Barra de comprometimento */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-500">Renda comprometida</span>
                <span className="text-xs font-semibold" style={{ color: barColor }}>
                  {commitPct.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: barColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${commitPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-dark-border">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                Sobra para investir
              </p>
              <p className={`text-3xl font-heading font-extrabold ${surplusColor}`}>
                R$ {brl(Math.abs(surplus))}
              </p>
              {surplus < 0 && (
                <p className="text-xs text-accent mt-1">Estimativas superam a renda</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
