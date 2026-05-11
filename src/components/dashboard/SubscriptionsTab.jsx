import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, X, Repeat, AlertCircle, Calendar, Clock,
  Tv, Heart, Briefcase, GraduationCap, MoreHorizontal, CheckCircle2,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

// Traduz erros comuns do Postgres/Supabase para algo acionável.
function formatSupabaseError(err) {
  if (!err) return 'Erro desconhecido.';
  if (err.code === '42P01') {
    return 'A tabela "subscriptions" ainda não existe no banco. Aplique a migration 20260511010000_subscriptions.sql no SQL Editor do Supabase.';
  }
  if (err.code === '23514') return 'Algum valor está fora do permitido (verifique nome, valor, ciclo ou cor).';
  if (err.code === '42501') return 'Você não tem permissão para realizar essa ação.';
  if (err.code === '23503') return 'Sessão expirada. Saia e entre novamente.';
  return err.message || 'Não foi possível salvar. Tente novamente.';
}

// ─── Catálogo ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'entretenimento', label: 'Entretenimento', icon: Tv              },
  { key: 'saude',          label: 'Saúde',          icon: Heart           },
  { key: 'produtividade',  label: 'Produtividade',  icon: Briefcase       },
  { key: 'educacao',       label: 'Educação',       icon: GraduationCap   },
  { key: 'outros',         label: 'Outros',         icon: MoreHorizontal  },
];
const CATEGORY_BY_KEY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

const COLOR_SWATCHES = [
  '#ef233c', '#f59e0b', '#10b981', '#6366f1',
  '#ec4899', '#8b5cf6', '#0ea5e9', '#71717a',
];

const CYCLES = [
  { id: 'monthly', label: 'Mensal' },
  { id: 'yearly',  label: 'Anual'  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────
function brl(n) {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function isoDay(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayISO() { return isoDay(new Date()); }

function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function daysUntil(iso) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function monthlyEquivalent(s) {
  return s.billing_cycle === 'yearly' ? Number(s.amount) / 12 : Number(s.amount);
}

const containerVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 240, damping: 22 } },
};

// ─── Modal: nova assinatura ────────────────────────────────────────────────
function AddSubscriptionForm({ onClose, onCreated }) {
  const [name, setName]         = useState('');
  const [amount, setAmount]     = useState('');
  const [cycle, setCycle]       = useState('monthly');
  const [category, setCategory] = useState('entretenimento');
  const [color, setColor]       = useState(COLOR_SWATCHES[0]);
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
    if (!name.trim()) {
      setError('Informe o nome do serviço.');
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Informe um valor válido maior que zero.');
      return;
    }
    if (!date) {
      setError('Informe a próxima data de cobrança.');
      return;
    }

    setSaving(true);
    const { data, error: insertErr } = await supabase
      .from('subscriptions')
      .insert({
        name: name.trim().slice(0, 80),
        amount: parsedAmount,
        billing_cycle: cycle,
        category,
        color,
        next_billing_date: date,
      })
      .select()
      .single();

    if (insertErr) {
      setSaving(false);
      setError(formatSupabaseError(insertErr));
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-border">
          <h3 className="font-heading font-bold text-gray-900 dark:text-white text-lg">Nova assinatura</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Nome do serviço
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Netflix, Spotify, academia…"
              maxLength={80}
              className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors"
            />
          </div>

          {/* Valor + ciclo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
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
                  className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg pl-11 pr-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors font-heading font-semibold"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Ciclo
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg h-[42px]">
                {CYCLES.map((c) => {
                  const active = cycle === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setCycle(c.id)}
                      className={`text-xs font-semibold rounded-md transition-colors ${
                        active
                          ? 'bg-accent text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Categoria
            </label>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const active = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
                    title={cat.label}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] font-medium transition-all ${
                      active
                        ? 'border-accent/60 bg-accent/10 text-accent'
                        : 'border-gray-200 dark:border-dark-border text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/15'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="leading-tight truncate w-full text-center">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cor */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Cor
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_SWATCHES.map((c) => {
                const active = color === c;
                return (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    aria-label={`Cor ${c}`}
                    className={`w-8 h-8 rounded-lg border-2 transition-transform ${active ? 'scale-110' : 'hover:scale-105'}`}
                    style={{ background: c, borderColor: active ? '#ffffff' : 'transparent' }}
                  />
                );
              })}
            </div>
          </div>

          {/* Próxima cobrança */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Próxima cobrança
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors [color-scheme:dark]"
            />
          </div>

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

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-dark-border bg-slate-50/40 dark:bg-dark-bg/40">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
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

// ─── Modal: confirmar exclusão ─────────────────────────────────────────────
function DeleteConfirmModal({ subscription, onConfirm, onCancel, deleting }) {
  return (
    <AnimatePresence>
      {subscription && (
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
            <h3 className="font-heading font-bold text-gray-900 dark:text-white text-lg mb-2">Cancelar assinatura?</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
              <span className="text-gray-900 dark:text-white font-semibold">{subscription.name}</span> será removida da sua lista.
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={deleting}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-dark-border rounded-lg hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600 transition-colors disabled:opacity-50"
              >
                Manter
              </button>
              <button
                onClick={onConfirm}
                disabled={deleting}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-accent hover:bg-red-600 rounded-lg transition-colors disabled:opacity-60"
              >
                {deleting ? 'Removendo…' : 'Remover'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Card de assinatura ────────────────────────────────────────────────────
function SubscriptionRow({ sub, onDelete }) {
  const cat = CATEGORY_BY_KEY[sub.category] ?? CATEGORY_BY_KEY.outros;
  const Icon = cat.icon;
  const days = daysUntil(sub.next_billing_date);
  const dueSoon = days >= 0 && days <= 7;
  const overdue = days < 0;

  return (
    <motion.div
      variants={itemVariants}
      layout
      exit={{ opacity: 0, x: 30, transition: { duration: 0.18 } }}
      className="group relative flex items-center justify-between gap-4 p-4 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl hover:border-gray-300 dark:hover:border-white/15 transition-colors overflow-hidden"
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 transition-transform -translate-x-full group-hover:translate-x-0"
        style={{ background: sub.color }}
      />

      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border"
          style={{ backgroundColor: `${sub.color}1a`, borderColor: `${sub.color}33` }}
        >
          <Icon className="w-5 h-5" style={{ color: sub.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{sub.name}</p>
            {overdue && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-accent bg-accent/10 border border-accent/30 px-1.5 py-0.5 rounded">
                <Clock className="w-2.5 h-2.5" />
                vencida
              </span>
            )}
            {dueSoon && !overdue && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-500 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                <Clock className="w-2.5 h-2.5" />
                {days === 0 ? 'hoje' : `em ${days}d`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Repeat className="w-3 h-3" />
              {sub.billing_cycle === 'yearly' ? 'Anual' : 'Mensal'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(sub.next_billing_date)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p className="font-heading font-bold text-base text-gray-900 dark:text-white">
            R$ {brl(sub.amount)}
          </p>
          {sub.billing_cycle === 'yearly' && (
            <p className="text-[10px] text-gray-500">~R$ {brl(monthlyEquivalent(sub))}/mês</p>
          )}
        </div>
        <button
          onClick={() => onDelete(sub)}
          className="text-gray-400 hover:text-accent transition-colors p-2 rounded-lg hover:bg-accent/10 opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="Remover"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────
export function SubscriptionsTab() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState('');
  const [showAdd, setShowAdd]       = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting]     = useState(false);
  const [toast, setToast]           = useState(null); // { type: 'success'|'error', message }

  function flashToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id, name, amount, billing_cycle, category, color, next_billing_date, created_at')
        .order('next_billing_date', { ascending: true });

      if (cancelled) return;
      if (error) {
        setLoadError(formatSupabaseError(error));
        setSubscriptions([]);
      } else {
        setSubscriptions(data ?? []);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleCreated = (sub) => {
    setSubscriptions((prev) => {
      const next = [sub, ...prev];
      next.sort((a, b) => (a.next_billing_date < b.next_billing_date ? -1 : 1));
      return next;
    });
    flashToast('success', `${sub.name} cadastrada com sucesso.`);
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const removed = pendingDelete;
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', pendingDelete.id);
    if (!error) {
      setSubscriptions((prev) => prev.filter((s) => s.id !== removed.id));
      setPendingDelete(null);
      flashToast('success', `${removed.name} removida.`);
    } else {
      flashToast('error', formatSupabaseError(error));
    }
    setDeleting(false);
  };

  const stats = useMemo(() => {
    let monthly = 0;
    let dueSoon = 0;
    for (const s of subscriptions) {
      monthly += monthlyEquivalent(s);
      const d = daysUntil(s.next_billing_date);
      if (d >= 0 && d <= 7) dueSoon += 1;
    }
    return { monthly, dueSoon };
  }, [subscriptions]);

  return (
    <div className="space-y-6 relative">
      {/* Toast (canto superior) */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className={`fixed top-4 right-4 z-[70] flex items-start gap-2 max-w-sm px-4 py-3 rounded-xl border shadow-2xl ${
              toast.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500'
                : 'bg-accent/15 border-accent/30 text-accent'
            }`}
          >
            {toast.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            }
            <p className="text-sm font-medium leading-snug">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl md:text-3xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tight">
            Suas <span className="text-accent">assinaturas</span>
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Acompanhe quanto você compromete todo mês com serviços recorrentes.
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-red-600 text-white text-sm font-semibold transition-colors shadow-lg shadow-accent/20"
        >
          <Plus className="w-4 h-4" />
          Nova assinatura
        </motion.button>
      </motion.div>

      {/* KPIs */}
      {!loading && subscriptions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-5">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Total mensal</p>
            <p className="text-3xl font-heading font-extrabold tracking-tight text-gray-900 dark:text-white">
              R$ {brl(stats.monthly)}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              {subscriptions.length} {subscriptions.length === 1 ? 'assinatura ativa' : 'assinaturas ativas'}
            </p>
          </div>
          <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-5">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Vencem em 7 dias</p>
            <p className={`text-3xl font-heading font-extrabold tracking-tight ${
              stats.dueSoon > 0 ? 'text-accent' : 'text-gray-900 dark:text-white'
            }`}>
              {stats.dueSoon}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              {stats.dueSoon === 0 ? 'Nada urgente por agora' : 'Reserve saldo para essas'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex flex-col gap-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : loadError ? (
        <div className="flex items-start gap-2 p-4 bg-accent/10 border border-accent/20 rounded-xl">
          <AlertCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <p className="text-accent text-sm">{loadError}</p>
        </div>
      ) : subscriptions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center text-center py-16 bg-white dark:bg-dark-surface border border-dashed border-gray-200 dark:border-dark-border rounded-2xl"
        >
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
            <Repeat className="w-7 h-7 text-accent" />
          </div>
          <p className="text-gray-900 dark:text-white font-semibold mb-1">Nenhuma assinatura cadastrada</p>
          <p className="text-gray-500 text-sm max-w-xs">
            Adicione Netflix, Spotify, academia ou qualquer outro serviço recorrente para acompanhar seus gastos fixos.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-5 flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-red-600 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar primeira
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
            {subscriptions.map((sub) => (
              <SubscriptionRow
                key={sub.id}
                sub={sub}
                onDelete={setPendingDelete}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modais */}
      <AnimatePresence>
        {showAdd && (
          <AddSubscriptionForm
            onClose={() => setShowAdd(false)}
            onCreated={handleCreated}
          />
        )}
      </AnimatePresence>
      <DeleteConfirmModal
        subscription={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirmed}
        deleting={deleting}
      />
    </div>
  );
}
