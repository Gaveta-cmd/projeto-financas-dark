import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, X, AlertCircle, Calendar,
  CalendarClock, CheckCircle2, Clock, Check,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

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

// Próxima parcela vence em start_date + paid_installments meses.
function nextDueDate(inst) {
  const [y, m, d] = inst.start_date.split('-').map(Number);
  return new Date(y, m - 1 + inst.paid_installments, d);
}

function isInCurrentMonth(date) {
  const now = new Date();
  return date.getFullYear() === now.getFullYear()
      && date.getMonth() === now.getMonth();
}

function isActive(inst) {
  return inst.paid_installments < inst.total_installments;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 240, damping: 22 } },
};

// ─── Modal: novo parcelamento ──────────────────────────────────────────────
function AddInstallmentForm({ onClose, onCreated }) {
  const [name, setName]             = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [count, setCount]           = useState('12');
  const [startDate, setStartDate]   = useState(todayISO);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  const parsedTotal = useMemo(() => {
    const cleaned = totalAmount.replace(/\./g, '').replace(',', '.');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }, [totalAmount]);

  const parsedCount = useMemo(() => {
    const n = parseInt(count, 10);
    return Number.isFinite(n) && n >= 1 && n <= 360 ? n : NaN;
  }, [count]);

  const installmentAmount = useMemo(() => {
    if (!Number.isFinite(parsedTotal) || !Number.isFinite(parsedCount) || parsedCount === 0) return null;
    return parsedTotal / parsedCount;
  }, [parsedTotal, parsedCount]);

  const handleSubmit = async () => {
    setError('');
    if (!name.trim()) {
      setError('Informe o nome da compra.');
      return;
    }
    if (!Number.isFinite(parsedTotal) || parsedTotal <= 0) {
      setError('Informe um valor total válido maior que zero.');
      return;
    }
    if (!Number.isFinite(parsedCount)) {
      setError('Quantidade de parcelas deve ser entre 1 e 360.');
      return;
    }
    if (!startDate) {
      setError('Informe a data de início.');
      return;
    }

    setSaving(true);
    const { data, error: insertErr } = await supabase
      .from('installments')
      .insert({
        name: name.trim().slice(0, 120),
        total_amount: parsedTotal,
        installment_amount: Number(installmentAmount.toFixed(2)),
        total_installments: parsedCount,
        paid_installments: 0,
        start_date: startDate,
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-border">
          <h3 className="font-heading font-bold text-gray-900 dark:text-white text-lg">Novo parcelamento</h3>
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
              Nome da compra
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Geladeira, notebook, viagem…"
              maxLength={120}
              className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors"
            />
          </div>

          {/* Valor total + parcelas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Valor total
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value.replace(/[^\d.,]/g, ''))}
                  placeholder="0,00"
                  className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg pl-11 pr-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors font-heading font-semibold"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Nº de parcelas
              </label>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="360"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors font-heading font-semibold"
              />
            </div>
          </div>

          {/* Preview do valor da parcela */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-accent/5 border border-accent/20">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Valor de cada parcela
            </span>
            <span className="text-base font-heading font-bold text-accent">
              {installmentAmount != null
                ? `R$ ${brl(installmentAmount)}`
                : '—'}
            </span>
          </div>

          {/* Data de início */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Data da 1ª parcela
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
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
function DeleteConfirmModal({ installment, onConfirm, onCancel, deleting }) {
  return (
    <AnimatePresence>
      {installment && (
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
            <h3 className="font-heading font-bold text-gray-900 dark:text-white text-lg mb-2">Remover parcelamento?</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
              <span className="text-gray-900 dark:text-white font-semibold">{installment.name}</span> será removido da sua lista.
              Isso não cancela a compra real, só para de ser acompanhado aqui.
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

// ─── Card de parcelamento ──────────────────────────────────────────────────
function InstallmentRow({ inst, onDelete, onMarkPaid }) {
  const active = isActive(inst);
  const dueThisMonth = active && isInCurrentMonth(nextDueDate(inst));
  const remaining = (inst.total_installments - inst.paid_installments) * Number(inst.installment_amount);
  const progress = (inst.paid_installments / inst.total_installments) * 100;

  return (
    <motion.div
      variants={itemVariants}
      layout
      exit={{ opacity: 0, x: 30, transition: { duration: 0.18 } }}
      className="group relative p-4 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl hover:border-gray-300 dark:hover:border-white/15 transition-colors overflow-hidden"
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 transition-transform ${
          active ? '-translate-x-full group-hover:translate-x-0 bg-accent' : 'translate-x-0 bg-emerald-500'
        }`}
      />

      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{inst.name}</p>
            {!active && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                <CheckCircle2 className="w-2.5 h-2.5" />
                quitado
              </span>
            )}
            {dueThisMonth && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-500 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                <Clock className="w-2.5 h-2.5" />
                vence este mês
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <CalendarClock className="w-3 h-3" />
              {inst.paid_installments}/{inst.total_installments} parcelas
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              início {formatDate(inst.start_date)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {active && (
            <button
              onClick={() => onMarkPaid(inst)}
              title="Marcar +1 parcela paga"
              className="text-emerald-500 hover:text-emerald-400 transition-colors p-2 rounded-lg hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(inst)}
            title="Remover"
            className="text-gray-400 hover:text-accent transition-colors p-2 rounded-lg hover:bg-accent/10 opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="h-1.5 w-full bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden mb-3">
        <motion.div
          className={`h-full rounded-full ${active ? 'bg-accent' : 'bg-emerald-500'}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Linha de valores */}
      <div className="flex items-center justify-between text-xs">
        <div>
          <span className="text-gray-500">Parcela: </span>
          <span className="font-heading font-bold text-gray-900 dark:text-white">R$ {brl(inst.installment_amount)}</span>
        </div>
        <div>
          <span className="text-gray-500">Restam: </span>
          <span className={`font-heading font-bold ${active ? 'text-accent' : 'text-emerald-500'}`}>
            R$ {brl(remaining)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────
export function InstallmentsTab() {
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState('');
  const [showAdd, setShowAdd]       = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting]     = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('installments')
        .select('id, name, total_amount, installment_amount, total_installments, paid_installments, start_date, created_at')
        .order('start_date', { ascending: false });

      if (cancelled) return;
      if (error) {
        setLoadError('Não foi possível carregar seus parcelamentos.');
        setInstallments([]);
      } else {
        setInstallments(data ?? []);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleCreated = (inst) => {
    setInstallments((prev) => {
      const next = [inst, ...prev];
      next.sort((a, b) => (a.start_date < b.start_date ? 1 : -1));
      return next;
    });
  };

  const handleMarkPaid = async (inst) => {
    if (!isActive(inst)) return;
    const newPaid = inst.paid_installments + 1;
    // Atualização otimista
    setInstallments((prev) =>
      prev.map((x) => (x.id === inst.id ? { ...x, paid_installments: newPaid } : x))
    );
    const { error } = await supabase
      .from('installments')
      .update({ paid_installments: newPaid })
      .eq('id', inst.id);
    if (error) {
      // Reverte se falhar
      setInstallments((prev) =>
        prev.map((x) => (x.id === inst.id ? { ...x, paid_installments: inst.paid_installments } : x))
      );
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const { error } = await supabase
      .from('installments')
      .delete()
      .eq('id', pendingDelete.id);
    if (!error) {
      setInstallments((prev) => prev.filter((i) => i.id !== pendingDelete.id));
      setPendingDelete(null);
    }
    setDeleting(false);
  };

  const stats = useMemo(() => {
    let dueThisMonth = 0;
    let monthAmount  = 0;
    let totalPaid    = 0;
    let totalAll     = 0;
    for (const inst of installments) {
      const installmentValue = Number(inst.installment_amount);
      totalPaid += inst.paid_installments     * installmentValue;
      totalAll  += inst.total_installments    * installmentValue;
      if (isActive(inst) && isInCurrentMonth(nextDueDate(inst))) {
        dueThisMonth += 1;
        monthAmount  += installmentValue;
      }
    }
    return {
      dueThisMonth,
      monthAmount,
      totalPaid,
      totalAll,
      progress: totalAll > 0 ? (totalPaid / totalAll) * 100 : 0,
    };
  }, [installments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl md:text-3xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tight">
            Seus <span className="text-accent">parcelamentos</span>
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Veja quanto pesa no mês e quanto falta pra terminar.
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-red-600 text-white text-sm font-semibold transition-colors shadow-lg shadow-accent/20"
        >
          <Plus className="w-4 h-4" />
          Novo parcelamento
        </motion.button>
      </motion.div>

      {/* KPIs */}
      {!loading && installments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {/* Total mensal deste mês */}
          <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-5">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Parcelas deste mês</p>
            <p className="text-3xl font-heading font-extrabold tracking-tight text-gray-900 dark:text-white">
              R$ {brl(stats.monthAmount)}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              {stats.dueThisMonth === 0
                ? 'Nenhum parcelamento vence este mês'
                : `${stats.dueThisMonth} ${stats.dueThisMonth === 1 ? 'parcela vence' : 'parcelas vencem'} este mês`}
            </p>
          </div>

          {/* Progresso geral */}
          <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-5">
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Progresso geral</p>
              <p className="text-xs font-heading font-bold text-gray-900 dark:text-white">
                {stats.progress.toFixed(0)}%
              </p>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden mb-2">
              <motion.div
                className="h-full bg-accent rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${stats.progress}%` }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
              />
            </div>
            <p className="text-[11px] text-gray-500">
              R$ {brl(stats.totalPaid)} pagos de R$ {brl(stats.totalAll)}
            </p>
          </div>
        </motion.div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex flex-col gap-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : loadError ? (
        <div className="flex items-start gap-2 p-4 bg-accent/10 border border-accent/20 rounded-xl">
          <AlertCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <p className="text-accent text-sm">{loadError}</p>
        </div>
      ) : installments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center text-center py-16 bg-white dark:bg-dark-surface border border-dashed border-gray-200 dark:border-dark-border rounded-2xl"
        >
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
            <CalendarClock className="w-7 h-7 text-accent" />
          </div>
          <p className="text-gray-900 dark:text-white font-semibold mb-1">Nenhum parcelamento cadastrado</p>
          <p className="text-gray-500 text-sm max-w-xs">
            Cadastre suas compras parceladas para acompanhar quanto falta pagar mês a mês.
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
          className="flex flex-col gap-2.5"
        >
          <AnimatePresence initial={false}>
            {installments.map((inst) => (
              <InstallmentRow
                key={inst.id}
                inst={inst}
                onDelete={setPendingDelete}
                onMarkPaid={handleMarkPaid}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modais */}
      <AnimatePresence>
        {showAdd && (
          <AddInstallmentForm
            onClose={() => setShowAdd(false)}
            onCreated={handleCreated}
          />
        )}
      </AnimatePresence>
      <DeleteConfirmModal
        installment={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirmed}
        deleting={deleting}
      />
    </div>
  );
}
