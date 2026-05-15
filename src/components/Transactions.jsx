import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, ArrowUpRight, ArrowDownLeft, X,
  Utensils, Car, Gamepad2, Home, Heart, MoreHorizontal, Target,
  Calendar, Tag, AlertCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useDemoMode } from '../contexts/DemoContext';

// Catálogo completo (inclui 'metas' usado pelos aportes vindos da tela de Metas).
const CATEGORIES = [
  { key: 'alimentacao', label: 'Alimentação', icon: Utensils,        color: '#ef233c' },
  { key: 'transporte',  label: 'Transporte',  icon: Car,             color: '#6366f1' },
  { key: 'lazer',       label: 'Lazer',       icon: Gamepad2,        color: '#f59e0b' },
  { key: 'moradia',     label: 'Moradia',     icon: Home,            color: '#10b981' },
  { key: 'saude',       label: 'Saúde',       icon: Heart,           color: '#ec4899' },
  { key: 'outros',      label: 'Outros',      icon: MoreHorizontal,  color: '#71717a' },
  { key: 'metas',       label: 'Metas',       icon: Target,          color: '#8b5cf6' },
];

// 'metas' não aparece no picker de "Nova transação" — só vem via aporte em
// uma meta na tela de Metas.
const FORM_CATEGORIES = CATEGORIES.filter((c) => c.key !== 'metas');

const CATEGORY_BY_KEY = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

function brl(n) {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 240, damping: 22 } },
};

// ─── Modal de adicionar transação ───────────────────────────────────────────
// Form em sub-componente: monta/desmonta junto com o modal, então o estado
// reseta naturalmente sem precisar de useEffect.
function AddTransactionForm({ onClose, onCreated }) {
  const [type, setType]         = useState('expense');
  const [title, setTitle]       = useState('');
  const [amount, setAmount]     = useState('');
  const [category, setCategory] = useState('alimentacao');
  const [date, setDate]         = useState(todayISO);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const parsedAmount = useMemo(() => {
    const cleaned = amount.replace(/\./g, '').replace(',', '.');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }, [amount]);

  const handleSubmit = async () => {
    setError('');

    if (!title.trim()) {
      setError('Informe um título para a transação.');
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Informe um valor válido maior que zero.');
      return;
    }
    if (!date) {
      setError('Informe a data da transação.');
      return;
    }

    setSaving(true);
    const { data, error: insertErr } = await supabase
      .from('transactions')
      .insert({
        title: title.trim().slice(0, 120),
        amount: parsedAmount,
        category,
        type,
        date,
      })
      .select()
      .single();

    if (insertErr) {
      setSaving(false);
      setError('Não foi possível salvar. Tente novamente.');
      return;
    }

    onCreated(data);
    onClose();
  };

  return (
    <motion.div
      key="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        key="panel"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl w-full max-w-md shadow-2xl shadow-accent/5 overflow-hidden"
      >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-border">
              <h3 className="font-heading font-bold text-gray-900 dark:text-white text-lg">Nova transação</h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Tipo */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl">
                {[
                  { id: 'expense', label: 'Despesa', icon: ArrowDownLeft },
                  { id: 'income',  label: 'Receita', icon: ArrowUpRight  },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const active = type === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setType(opt.id)}
                      className={`relative flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        active
                          ? opt.id === 'expense'
                            ? 'bg-accent text-white'
                            : 'bg-emerald-500 text-white'
                          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Título */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Almoço no restaurante"
                  maxLength={120}
                  className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors"
                />
              </div>

              {/* Valor */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Valor
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
                    placeholder="0,00"
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg pl-11 pr-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors font-heading font-semibold"
                  />
                </div>
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Categoria
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {FORM_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const active = category === cat.key;
                    return (
                      <button
                        key={cat.key}
                        onClick={() => setCategory(cat.key)}
                        className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                          active
                            ? 'border-transparent text-gray-900 dark:text-white'
                            : 'border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-white/15'
                        }`}
                        style={active ? { backgroundColor: `${cat.color}22`, borderColor: `${cat.color}66` } : {}}
                      >
                        <Icon className="w-4 h-4" style={active ? { color: cat.color } : {}} />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Data */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Data
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>

              {/* Erro */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2 p-2.5 bg-accent/10 border border-accent/20 rounded-lg"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                    <p className="text-accent text-xs">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg/40">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-accent hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Salvando…
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </>
                )}
              </motion.button>
            </div>
      </motion.div>
    </motion.div>
  );
}

function AddTransactionModal({ open, onClose, onCreated }) {
  return (
    <AnimatePresence>
      {open && (
        <AddTransactionForm onClose={onClose} onCreated={onCreated} />
      )}
    </AnimatePresence>
  );
}

// ─── Modal de confirmação de delete ─────────────────────────────────────────
function DeleteConfirmModal({ transaction, onConfirm, onCancel, deleting }) {
  return (
    <AnimatePresence>
      {transaction && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="bg-white dark:bg-dark-surface border border-accent/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl shadow-accent/10"
          >
            <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-heading font-bold text-gray-900 dark:text-white text-lg mb-2">Excluir transação?</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
              <span className="text-gray-900 dark:text-white font-semibold">{transaction.title}</span> será removida
              permanentemente. Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={deleting}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-dark-border rounded-lg hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-600 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={deleting}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-accent hover:bg-red-600 rounded-lg transition-colors disabled:opacity-60"
              >
                {deleting ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Item da lista ──────────────────────────────────────────────────────────
function TransactionRow({ tx, onDelete }) {
  const cat = CATEGORY_BY_KEY[tx.category] ?? CATEGORY_BY_KEY.outros;
  const Icon = cat.icon;
  const isIncome = tx.type === 'income';

  return (
    <motion.div
      variants={itemVariants}
      layout
      exit={{ opacity: 0, x: 30, transition: { duration: 0.18 } }}
      className="group relative flex items-center justify-between gap-4 p-4 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl hover:border-gray-300 dark:hover:border-white/15 transition-colors overflow-hidden"
    >
      {/* Accent line on hover */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 transition-transform -translate-x-full group-hover:translate-x-0"
        style={{ background: cat.color }}
      />

      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border"
          style={{ backgroundColor: `${cat.color}1a`, borderColor: `${cat.color}33` }}
        >
          <Icon className="w-5 h-5" style={{ color: cat.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{tx.title}</p>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {cat.label}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(tx.date)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p className={`font-heading font-bold text-base ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
            {isIncome ? '+' : '-'} R$ {brl(tx.amount)}
          </p>
        </div>
        <button
          onClick={() => onDelete(tx)}
          className="text-gray-400 dark:text-gray-600 hover:text-accent transition-colors p-2 rounded-lg hover:bg-accent/10 opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="Excluir"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────
export function Transactions() {
  const { isDemo, demoData, showDemoBlock } = useDemoMode();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [loadError, setLoadError]       = useState('');
  const [showAdd, setShowAdd]           = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);

      if (isDemo) {
        if (!cancelled) {
          const sorted = [...demoData.transactions].sort((a, b) => {
            if (a.date !== b.date) return a.date < b.date ? 1 : -1;
            return a.created_at < b.created_at ? 1 : -1;
          });
          setTransactions(sorted);
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('id, title, amount, category, type, date, created_at')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (cancelled) return;
      if (error) {
        setLoadError('Não foi possível carregar suas transações.');
        setTransactions([]);
      } else {
        setTransactions(data ?? []);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [isDemo]);

  const handleCreated = (tx) => {
    setTransactions((prev) => {
      const next = [tx, ...prev];
      next.sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        return a.created_at < b.created_at ? 1 : -1;
      });
      return next;
    });
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDelete) return;
    if (isDemo) { showDemoBlock(); setPendingDelete(null); return; }
    setDeleting(true);
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', pendingDelete.id);

    if (!error) {
      setTransactions((prev) => prev.filter((t) => t.id !== pendingDelete.id));
      setPendingDelete(null);
    }
    setDeleting(false);
  };

  const totals = useMemo(() => {
    let income = 0, expense = 0;
    for (const t of transactions) {
      const v = Number(t.amount);
      if (t.type === 'income') income += v;
      else expense += v;
    }
    return { income, expense, balance: income - expense };
  }, [transactions]);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-2 uppercase tracking-wider text-sm">Histórico</p>
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tighter">
            Suas <span className="text-accent">Transações</span>
          </h1>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => isDemo ? showDemoBlock() : setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-red-600 text-white text-sm font-semibold transition-colors shadow-lg shadow-accent/20"
        >
          <Plus className="w-4 h-4" />
          Nova transação
        </motion.button>
      </motion.div>

      {/* KPIs */}
      {transactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-4">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Receitas</p>
            <p className="text-emerald-600 dark:text-emerald-400 text-xl font-heading font-extrabold tracking-tight">
              R$ {brl(totals.income)}
            </p>
          </div>
          <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-4">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Despesas</p>
            <p className="text-accent text-xl font-heading font-extrabold tracking-tight">
              R$ {brl(totals.expense)}
            </p>
          </div>
          <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-4">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Saldo</p>
            <p className={`text-xl font-heading font-extrabold tracking-tight ${
              totals.balance >= 0 ? 'text-gray-900 dark:text-white' : 'text-accent'
            }`}>
              R$ {brl(totals.balance)}
            </p>
          </div>
        </motion.div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      ) : loadError ? (
        <div className="flex items-start gap-2 p-4 bg-accent/10 border border-accent/20 rounded-xl">
          <AlertCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <p className="text-accent text-sm">{loadError}</p>
        </div>
      ) : transactions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center text-center py-16 bg-white dark:bg-dark-surface border border-dashed border-gray-200 dark:border-dark-border rounded-2xl"
        >
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
            <Plus className="w-7 h-7 text-accent" />
          </div>
          <p className="text-gray-900 dark:text-white font-semibold mb-1">Nenhuma transação cadastrada</p>
          <p className="text-gray-500 text-sm max-w-xs">
            Comece adicionando sua primeira receita ou despesa para acompanhar suas finanças.
          </p>
          <button
            onClick={() => isDemo ? showDemoBlock() : setShowAdd(true)}
            className="mt-5 flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-red-600 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar transação
          </button>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-2.5"
        >
          <AnimatePresence initial={false}>
            {transactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                onDelete={(t) => isDemo ? showDemoBlock() : setPendingDelete(t)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modais */}
      <AddTransactionModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={handleCreated}
      />
      <DeleteConfirmModal
        transaction={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirmed}
        deleting={deleting}
      />
    </div>
  );
}
