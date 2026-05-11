import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, X, CreditCard, AlertCircle, Calendar, Clock,
  Wifi, CheckCircle2,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Traduz erros comuns do Postgres/Supabase para algo acionável.
function formatSupabaseError(err) {
  if (!err) return 'Erro desconhecido.';
  if (err.code === '42P01') {
    return 'A tabela "cards" ainda não existe no banco. Aplique a migration 20260511030000_cards.sql no SQL Editor do Supabase.';
  }
  if (err.code === '23514') return 'Algum valor está fora do permitido (verifique nome, dígitos, limite, valor utilizado, vencimento ou fechamento).';
  if (err.code === '42501') return 'Você não tem permissão para realizar essa ação.';
  if (err.code === '23503') return 'Sessão expirada. Saia e entre novamente.';
  return err.message || 'Não foi possível salvar. Tente novamente.';
}

const COLOR_SWATCHES = [
  '#ef233c', '#0f172a', '#1e40af', '#7c3aed',
  '#0891b2', '#059669', '#b45309', '#374151',
];

// ─── Helpers ───────────────────────────────────────────────────────────────
function brl(n) {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

// Calcula a próxima data de vencimento (em dias a partir de hoje) considerando
// o dia (1..31) do mês. Se já passou neste mês, usa o mês seguinte. Faz clamp
// para o último dia do mês (ex.: dia 31 em fevereiro).
function daysUntilDueDay(dueDay) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buildDate = (year, monthIndex, day) => {
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    return new Date(year, monthIndex, Math.min(day, lastDay));
  };

  let target = buildDate(today.getFullYear(), today.getMonth(), dueDay);
  if (target < today) {
    target = buildDate(today.getFullYear(), today.getMonth() + 1, dueDay);
  }
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

const containerVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  show:   { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 220, damping: 22 } },
};

// ─── Modal: novo cartão ────────────────────────────────────────────────────
function AddCardForm({ onClose, onCreated }) {
  const [name, setName]         = useState('');
  const [digits, setDigits]     = useState('');
  const [limit, setLimit]       = useState('');
  const [used, setUsed]         = useState('');
  const [dueDay, setDueDay]     = useState('10');
  const [closeDay, setCloseDay] = useState('3');
  const [color, setColor]       = useState(COLOR_SWATCHES[0]);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const parsedLimit = useMemo(() => {
    const n = Number(limit.replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
  }, [limit]);

  const parsedUsed = useMemo(() => {
    if (!used) return 0;
    const n = Number(used.replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
  }, [used]);

  const handleSubmit = async () => {
    setError('');
    if (!name.trim()) {
      setError('Informe o nome do cartão.');
      return;
    }
    if (!/^[0-9]{4}$/.test(digits)) {
      setError('Os últimos 4 dígitos devem conter exatamente 4 números.');
      return;
    }
    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      setError('Informe um limite total válido maior que zero.');
      return;
    }
    if (!Number.isFinite(parsedUsed) || parsedUsed < 0) {
      setError('Informe um valor utilizado válido (zero ou positivo).');
      return;
    }
    if (parsedUsed > parsedLimit) {
      setError('O valor utilizado não pode ser maior que o limite.');
      return;
    }
    const due = Number(dueDay);
    const close = Number(closeDay);
    if (!Number.isInteger(due) || due < 1 || due > 31) {
      setError('Dia de vencimento deve estar entre 1 e 31.');
      return;
    }
    if (!Number.isInteger(close) || close < 1 || close > 31) {
      setError('Dia de fechamento deve estar entre 1 e 31.');
      return;
    }

    setSaving(true);
    const { data, error: insertErr } = await supabase
      .from('cards')
      .insert({
        name: name.trim().slice(0, 60),
        last_digits: digits,
        limit_amount: parsedLimit,
        used_amount: parsedUsed,
        due_date: due,
        closing_date: close,
        color,
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
          <h3 className="font-heading font-bold text-gray-900 dark:text-white text-lg">Novo cartão</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Nome + dígitos */}
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Nome do cartão
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nubank, Itaú Black…"
                maxLength={60}
                className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors"
              />
            </div>
            <div className="w-28">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Final
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={digits}
                onChange={(e) => setDigits(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                maxLength={4}
                className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-3 py-2.5 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors font-heading font-semibold tracking-wider text-center"
              />
            </div>
          </div>

          {/* Limite + usado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Limite total
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value.replace(/[^\d.,]/g, ''))}
                  placeholder="5.000,00"
                  className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg pl-11 pr-3 py-2.5 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors font-heading font-semibold"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Já utilizado
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={used}
                  onChange={(e) => setUsed(e.target.value.replace(/[^\d.,]/g, ''))}
                  placeholder="0,00"
                  className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg pl-11 pr-3 py-2.5 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors font-heading font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Vencimento + fechamento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Dia do vencimento
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value.replace(/\D/g, '').slice(0, 2))}
                className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Dia do fechamento
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={closeDay}
                onChange={(e) => setCloseDay(e.target.value.replace(/\D/g, '').slice(0, 2))}
                className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors"
              />
            </div>
          </div>

          {/* Cor */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Cor do cartão
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_SWATCHES.map((c) => {
                const active = color === c;
                return (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    aria-label={`Cor ${c}`}
                    className={`w-9 h-9 rounded-lg border-2 transition-transform ${active ? 'scale-110' : 'hover:scale-105'}`}
                    style={{ background: c, borderColor: active ? '#ffffff' : 'transparent' }}
                  />
                );
              })}
            </div>
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
function DeleteConfirmModal({ card, onConfirm, onCancel, deleting }) {
  return (
    <AnimatePresence>
      {card && (
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
            <h3 className="font-heading font-bold text-gray-900 dark:text-white text-lg mb-2">Remover cartão?</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
              <span className="text-gray-900 dark:text-white font-semibold">{card.name}</span> · final {card.last_digits} será removido da sua lista.
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

// ─── Cartão visual (estilo cartão de crédito real) ────────────────────────
function CreditCardView({ card, onDelete }) {
  const used = Number(card.used_amount);
  const total = Number(card.limit_amount);
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const overHeat = pct >= 80;

  const days = daysUntilDueDay(card.due_date);
  const dueSoon = days >= 0 && days <= 7;

  return (
    <motion.div
      variants={itemVariants}
      layout
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.18 } }}
      whileHover={{ y: -3 }}
      className="group relative rounded-2xl overflow-hidden border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface"
    >
      {/* Painel "cartão de crédito" */}
      <div
        className="relative p-5 pb-6 text-white overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}cc 55%, #0f0f0f 130%)`,
          minHeight: 180,
        }}
      >
        {/* Hover beam */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute -top-1/2 -left-1/4 w-2/3 h-[200%] rotate-12 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>

        {/* Grafismos sutis */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-4 top-4 w-10 h-7 rounded-md border border-dashed border-white/40" />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-white/70">Cartão</p>
            <p className="font-heading font-bold text-lg leading-tight truncate max-w-[180px]">{card.name}</p>
          </div>
          <button
            onClick={() => onDelete(card)}
            className="text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="Remover cartão"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="relative z-10 mt-7 flex items-center gap-3">
          <Wifi className="w-4 h-4 text-white/70 rotate-90" />
          <p className="font-heading font-bold text-xl tracking-[0.25em]">
            ····  ····  ····  {card.last_digits}
          </p>
        </div>

        <div className="relative z-10 mt-5 flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/60">Vencimento</p>
            <p className="font-heading font-semibold text-sm">Dia {card.due_date}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-white/60">Fechamento</p>
            <p className="font-heading font-semibold text-sm">Dia {card.closing_date}</p>
          </div>
        </div>

        {dueSoon && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-white bg-black/40 backdrop-blur border border-white/30 px-1.5 py-0.5 rounded">
              <Clock className="w-2.5 h-2.5" />
              {days === 0 ? 'vence hoje' : `vence em ${days}d`}
            </span>
          </div>
        )}
      </div>

      {/* Painel inferior: barra de uso */}
      <div className="p-4 bg-white dark:bg-dark-surface">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Limite utilizado</p>
          <p className={`text-[11px] font-heading font-bold ${overHeat ? 'text-accent' : 'text-gray-600 dark:text-gray-400'}`}>
            {pct.toFixed(0)}%
          </p>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`h-full rounded-full ${overHeat ? 'bg-accent' : 'bg-emerald-500'}`}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-gray-500">
            <span className={overHeat ? 'text-accent font-semibold' : 'text-gray-900 dark:text-white font-semibold'}>
              R$ {brl(used)}
            </span>
            {' '}de R$ {brl(total)}
          </span>
          <span className="text-gray-500">
            R$ {brl(Math.max(0, total - used))} livre
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────
export function Cards() {
  const [cards, setCards]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [loadError, setLoadError]         = useState('');
  const [showAdd, setShowAdd]             = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting]           = useState(false);
  const [toast, setToast]                 = useState(null);

  function flashToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('cards')
        .select('id, name, last_digits, limit_amount, used_amount, due_date, closing_date, color, created_at')
        .order('due_date', { ascending: true });

      if (cancelled) return;
      if (error) {
        setLoadError(formatSupabaseError(error));
        setCards([]);
      } else {
        setCards(data ?? []);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleCreated = (card) => {
    setCards((prev) => {
      const next = [card, ...prev];
      next.sort((a, b) => a.due_date - b.due_date);
      return next;
    });
    flashToast('success', `${card.name} cadastrado com sucesso.`);
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const removed = pendingDelete;
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', pendingDelete.id);
    if (!error) {
      setCards((prev) => prev.filter((c) => c.id !== removed.id));
      setPendingDelete(null);
      flashToast('success', `${removed.name} removido.`);
    } else {
      flashToast('error', formatSupabaseError(error));
    }
    setDeleting(false);
  };

  const stats = useMemo(() => {
    let totalUsed = 0;
    let totalLimit = 0;
    let dueSoon = 0;
    for (const c of cards) {
      totalUsed  += Number(c.used_amount);
      totalLimit += Number(c.limit_amount);
      const d = daysUntilDueDay(c.due_date);
      if (d >= 0 && d <= 7) dueSoon += 1;
    }
    return { totalUsed, totalLimit, dueSoon };
  }, [cards]);

  return (
    <div className="space-y-6 relative">
      {/* Toast */}
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
            Seus <span className="text-accent">cartões</span>
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Controle limites, vencimentos e quanto você já comprometeu da fatura.
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-red-600 text-white text-sm font-semibold transition-colors shadow-lg shadow-accent/20"
        >
          <Plus className="w-4 h-4" />
          Novo cartão
        </motion.button>
      </motion.div>

      {/* KPIs */}
      {!loading && cards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-5 md:col-span-2 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-50">
              <div className="absolute -top-10 -right-10 w-44 h-44 bg-accent/15 blur-3xl rounded-full" />
            </div>
            <div className="relative z-10">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Total de faturas do mês</p>
              <p className="text-4xl font-heading font-extrabold tracking-tight text-gray-900 dark:text-white">
                R$ {brl(stats.totalUsed)}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                de R$ {brl(stats.totalLimit)} disponíveis · {cards.length} {cards.length === 1 ? 'cartão' : 'cartões'}
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-5">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Vencem em 7 dias</p>
            <p className={`text-3xl font-heading font-extrabold tracking-tight ${
              stats.dueSoon > 0 ? 'text-accent' : 'text-gray-900 dark:text-white'
            }`}>
              {stats.dueSoon}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              {stats.dueSoon === 0 ? 'Nenhuma fatura urgente' : 'Reserve saldo p/ essas'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Lista de cartões */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[260px] bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : loadError ? (
        <div className="flex items-start gap-2 p-4 bg-accent/10 border border-accent/20 rounded-xl">
          <AlertCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <p className="text-accent text-sm">{loadError}</p>
        </div>
      ) : cards.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center text-center py-16 bg-white dark:bg-dark-surface border border-dashed border-gray-200 dark:border-dark-border rounded-2xl"
        >
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
            <CreditCard className="w-7 h-7 text-accent" />
          </div>
          <p className="text-gray-900 dark:text-white font-semibold mb-1">Nenhum cartão cadastrado</p>
          <p className="text-gray-500 text-sm max-w-xs">
            Adicione seus cartões de crédito para acompanhar limite, fatura e datas de vencimento em um só lugar.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-5 flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-red-600 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar primeiro
          </button>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence initial={false}>
            {cards.map((c) => (
              <CreditCardView key={c.id} card={c} onDelete={setPendingDelete} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modais */}
      <AnimatePresence>
        {showAdd && (
          <AddCardForm
            onClose={() => setShowAdd(false)}
            onCreated={handleCreated}
          />
        )}
      </AnimatePresence>
      <DeleteConfirmModal
        card={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirmed}
        deleting={deleting}
      />
    </div>
  );
}
