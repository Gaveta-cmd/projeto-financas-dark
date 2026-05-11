import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, X, AlertCircle, Calendar, Clock, Target,
  Plane, ShieldAlert, Smartphone, Car, Home, MoreHorizontal,
  CheckCircle2, TrendingUp, Wallet,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Traduz erros comuns do Postgres/Supabase para algo acionável.
function formatSupabaseError(err) {
  if (!err) return 'Erro desconhecido.';
  if (err.code === '42P01' || err.code === 'PGRST205') {
    return 'A tabela "goals" ainda não existe no banco. Aplique a migration 20260511030000_goals.sql no SQL Editor do Supabase.';
  }
  if (err.code === '23514') return 'Algum valor está fora do permitido (verifique nome, valores ou categoria).';
  if (err.code === '42501') return 'Você não tem permissão para realizar essa ação.';
  if (err.code === '23503') return 'Sessão expirada. Saia e entre novamente.';
  return err.message || 'Não foi possível salvar. Tente novamente.';
}

// ─── Catálogo ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'viagem',     label: 'Viagem',      icon: Plane          },
  { key: 'emergencia', label: 'Emergência',  icon: ShieldAlert    },
  { key: 'eletronico', label: 'Eletrônico',  icon: Smartphone     },
  { key: 'veiculo',    label: 'Veículo',     icon: Car            },
  { key: 'imovel',     label: 'Imóvel',      icon: Home           },
  { key: 'outros',     label: 'Outros',      icon: MoreHorizontal },
];
const CATEGORY_BY_KEY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

const COLOR_SWATCHES = [
  '#ef233c', '#f59e0b', '#10b981', '#6366f1',
  '#ec4899', '#8b5cf6', '#0ea5e9', '#71717a',
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

// Default de prazo: hoje + 6 meses, ajuda o usuário a não escolher uma data ruim.
function defaultDeadlineISO() {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  return isoDay(d);
}

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

function progressPct(goal) {
  const t = Number(goal.target_amount);
  const c = Number(goal.current_amount);
  if (t <= 0) return 0;
  return Math.min(100, (c / t) * 100);
}

function isCompleted(goal) {
  return Number(goal.current_amount) >= Number(goal.target_amount);
}

const containerVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 240, damping: 22 } },
};

// ─── Modal: nova meta ──────────────────────────────────────────────────────
function AddGoalForm({ onClose, onCreated }) {
  const [name, setName]               = useState('');
  const [targetAmount, setTargetAmount]   = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline]       = useState(defaultDeadlineISO);
  const [category, setCategory]       = useState('viagem');
  const [color, setColor]             = useState(COLOR_SWATCHES[0]);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  const parsedTarget = useMemo(() => {
    const cleaned = targetAmount.replace(/\./g, '').replace(',', '.');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }, [targetAmount]);

  const parsedCurrent = useMemo(() => {
    const cleaned = (currentAmount || '0').replace(/\./g, '').replace(',', '.');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }, [currentAmount]);

  const handleSubmit = async () => {
    setError('');
    if (!name.trim()) {
      setError('Informe o nome da meta.');
      return;
    }
    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      setError('Informe um valor alvo válido maior que zero.');
      return;
    }
    if (parsedCurrent < 0) {
      setError('O valor já guardado não pode ser negativo.');
      return;
    }
    if (parsedCurrent > parsedTarget * 2) {
      setError('O valor já guardado parece muito alto comparado ao alvo.');
      return;
    }
    if (!deadline) {
      setError('Informe um prazo para a meta.');
      return;
    }

    setSaving(true);
    const { data, error: insertErr } = await supabase
      .from('goals')
      .insert({
        name: name.trim().slice(0, 80),
        target_amount: parsedTarget,
        current_amount: parsedCurrent,
        deadline,
        category,
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
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
        className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl w-full max-w-md shadow-2xl shadow-accent/10 overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-border sticky top-0 bg-white dark:bg-dark-surface z-10">
          <h3 className="font-heading font-bold text-gray-900 dark:text-white text-lg">Nova meta</h3>
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
              Nome da meta
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Viagem pro Japão, reserva, PS5…"
              maxLength={80}
              className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors"
            />
          </div>

          {/* Valor alvo + já guardado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Valor alvo
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value.replace(/[^\d.,]/g, ''))}
                  placeholder="0,00"
                  className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg pl-11 pr-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors font-heading font-semibold"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Já guardado
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value.replace(/[^\d.,]/g, ''))}
                  placeholder="0,00"
                  className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg pl-11 pr-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors font-heading font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Prazo */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Prazo
            </label>
            <input
              type="date"
              value={deadline}
              min={todayISO()}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors [color-scheme:dark]"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Categoria
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const active = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
                    title={cat.label}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-[11px] font-medium transition-all ${
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

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-dark-border bg-slate-50/40 dark:bg-dark-bg/40 sticky bottom-0">
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
                Criar meta
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Modal: adicionar valor parcial ────────────────────────────────────────
function AddDepositModal({ goal, onClose, onSaved }) {
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const parsedAmount = useMemo(() => {
    const cleaned = amount.replace(/\./g, '').replace(',', '.');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }, [amount]);

  const handleSubmit = async () => {
    setError('');
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Informe um valor maior que zero.');
      return;
    }
    const newCurrent = Number((Number(goal.current_amount) + parsedAmount).toFixed(2));
    if (newCurrent > Number(goal.target_amount) * 2) {
      setError('Esse valor estoura o limite seguro da meta.');
      return;
    }
    setSaving(true);
    const { data, error: updateErr } = await supabase
      .from('goals')
      .update({ current_amount: newCurrent })
      .eq('id', goal.id)
      .select()
      .single();
    if (updateErr) {
      setSaving(false);
      setError(formatSupabaseError(updateErr));
      return;
    }
    onSaved(data);
    onClose();
  };

  return (
    <AnimatePresence>
      {goal && (
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
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl w-full max-w-sm shadow-2xl shadow-accent/10 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-dark-border">
              <div className="min-w-0">
                <h3 className="font-heading font-bold text-gray-900 dark:text-white text-base truncate">
                  Guardar para {goal.name}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Atual: R$ {brl(goal.current_amount)} · Alvo: R$ {brl(goal.target_amount)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 shrink-0 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Quanto adicionar?
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoFocus
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
                    placeholder="0,00"
                    className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg pl-11 pr-4 py-3 text-gray-900 dark:text-white text-base placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors font-heading font-bold"
                  />
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

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 dark:border-dark-border bg-slate-50/40 dark:bg-dark-bg/40">
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
                    Guardando…
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    Guardar
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Modal: confirmar exclusão ─────────────────────────────────────────────
function DeleteConfirmModal({ goal, onConfirm, onCancel, deleting }) {
  return (
    <AnimatePresence>
      {goal && (
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
            <h3 className="font-heading font-bold text-gray-900 dark:text-white text-lg mb-2">Apagar meta?</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
              <span className="text-gray-900 dark:text-white font-semibold">{goal.name}</span> será removida da sua lista.
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

// ─── Card de meta ──────────────────────────────────────────────────────────
function GoalCard({ goal, onAddDeposit, onDelete }) {
  const cat = CATEGORY_BY_KEY[goal.category] ?? CATEGORY_BY_KEY.outros;
  const Icon = cat.icon;
  const pct = progressPct(goal);
  const completed = isCompleted(goal);
  const days = daysUntil(goal.deadline);
  const dueSoon = !completed && days >= 0 && days <= 30;
  const overdue = !completed && days < 0;
  const remaining = Math.max(0, Number(goal.target_amount) - Number(goal.current_amount));

  return (
    <motion.div
      variants={itemVariants}
      layout
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.18 } }}
      whileHover={{ y: -2 }}
      className="group relative p-5 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl hover:border-gray-300 dark:hover:border-white/15 transition-colors overflow-hidden"
      style={{ boxShadow: completed ? `0 0 0 1px ${goal.color}33` : undefined }}
    >
      {/* Beam lateral hover (efeito hover-beam do design system) */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 transition-transform -translate-x-full group-hover:translate-x-0"
        style={{ background: goal.color }}
      />
      {/* Glow sutil quando completa */}
      {completed && (
        <div
          className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-25 pointer-events-none"
          style={{ background: goal.color }}
        />
      )}

      <div className="flex items-start justify-between gap-3 mb-4 relative">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border"
            style={{ backgroundColor: `${goal.color}1a`, borderColor: `${goal.color}33` }}
          >
            <Icon className="w-5 h-5" style={{ color: goal.color }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{goal.name}</p>
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              {completed && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  concluída
                </span>
              )}
              {overdue && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-accent bg-accent/10 border border-accent/30 px-1.5 py-0.5 rounded">
                  <Clock className="w-2.5 h-2.5" />
                  prazo expirado
                </span>
              )}
              {dueSoon && !overdue && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-500 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  <Clock className="w-2.5 h-2.5" />
                  {days === 0 ? 'vence hoje' : `${days}d restantes`}
                </span>
              )}
              {!completed && !overdue && !dueSoon && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500">
                  <Calendar className="w-2.5 h-2.5" />
                  {days}d até {formatDate(goal.deadline)}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => onDelete(goal)}
          title="Remover meta"
          className="text-gray-400 hover:text-accent transition-colors p-2 rounded-lg hover:bg-accent/10 opacity-0 group-hover:opacity-100 focus:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Barra de progresso animada */}
      <div className="space-y-1.5 mb-4 relative">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-gray-500">Progresso</span>
          <span className="font-heading font-bold text-gray-900 dark:text-white">
            {pct.toFixed(0)}%
          </span>
        </div>
        <div className="h-2 w-full bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: completed ? '#10b981' : goal.color }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Valores */}
      <div className="flex items-end justify-between gap-2 mb-4 relative">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Atual</p>
          <p className="font-heading font-extrabold text-base text-gray-900 dark:text-white tracking-tight">
            R$ {brl(goal.current_amount)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
            {completed ? 'Meta atingida' : 'Faltam'}
          </p>
          <p
            className="font-heading font-bold text-sm"
            style={{ color: completed ? '#10b981' : goal.color }}
          >
            {completed ? `R$ ${brl(goal.target_amount)}` : `R$ ${brl(remaining)}`}
          </p>
        </div>
      </div>

      {/* CTA */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => onAddDeposit(goal)}
        disabled={completed}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors relative ${
          completed
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 cursor-default'
            : 'bg-accent/10 border border-dashed border-accent/40 text-accent hover:bg-accent/15'
        }`}
      >
        {completed ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Meta concluída
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            Adicionar valor
          </>
        )}
      </motion.button>
    </motion.div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────
export function Goals() {
  const [goals, setGoals]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [loadError, setLoadError]       = useState('');
  const [showAdd, setShowAdd]           = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingDeposit, setPendingDeposit] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [toast, setToast]               = useState(null); // { type, message }

  function flashToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('goals')
        .select('id, name, target_amount, current_amount, deadline, category, color, created_at')
        .order('deadline', { ascending: true });

      if (cancelled) return;
      if (error) {
        setLoadError(formatSupabaseError(error));
        setGoals([]);
      } else {
        setGoals(data ?? []);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleCreated = (goal) => {
    setGoals((prev) => {
      const next = [...prev, goal];
      next.sort((a, b) => (a.deadline < b.deadline ? -1 : 1));
      return next;
    });
    flashToast('success', `Meta "${goal.name}" criada!`);
  };

  const handleDeposited = (updated) => {
    setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    if (isCompleted(updated)) {
      flashToast('success', `🎉 Meta "${updated.name}" concluída!`);
    } else {
      flashToast('success', `R$ ${brl(updated.current_amount)} guardado em "${updated.name}".`);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const removed = pendingDelete;
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', pendingDelete.id);
    if (!error) {
      setGoals((prev) => prev.filter((g) => g.id !== removed.id));
      setPendingDelete(null);
      flashToast('success', `Meta "${removed.name}" removida.`);
    } else {
      flashToast('error', formatSupabaseError(error));
    }
    setDeleting(false);
  };

  const stats = useMemo(() => {
    const total = goals.length;
    let completedCount = 0;
    let dueSoonCount = 0;
    let avgPct = 0;
    let totalTarget  = 0;
    let totalCurrent = 0;
    for (const g of goals) {
      const pct = progressPct(g);
      avgPct += pct;
      totalTarget  += Number(g.target_amount);
      totalCurrent += Number(g.current_amount);
      if (isCompleted(g)) completedCount += 1;
      const d = daysUntil(g.deadline);
      if (!isCompleted(g) && d >= 0 && d <= 30) dueSoonCount += 1;
    }
    return {
      total,
      completedCount,
      dueSoonCount,
      avgPct: total > 0 ? avgPct / total : 0,
      totalTarget,
      totalCurrent,
    };
  }, [goals]);

  return (
    <div className="pt-32 lg:pt-10 pb-20 lg:pb-10 px-6 max-w-7xl mx-auto space-y-8 relative">
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
          <p className="text-accent text-xs font-bold uppercase tracking-[0.2em] mb-2">
            Planejamento
          </p>
          <h2 className="text-2xl md:text-3xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tight">
            Suas <span className="text-accent">metas financeiras</span>
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Defina objetivos, guarde aos poucos e veja o progresso visual de cada conquista.
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-red-600 text-white text-sm font-semibold transition-colors shadow-lg shadow-accent/20"
        >
          <Plus className="w-4 h-4" />
          Nova meta
        </motion.button>
      </motion.div>

      {/* KPIs em destaque no topo */}
      {!loading && goals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          {/* Total de metas */}
          <div className="relative bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl p-5 overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-accent/10 blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-2 relative">
              <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Target className="w-4 h-4 text-accent" />
              </div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Total de metas</p>
            </div>
            <p className="text-3xl font-heading font-extrabold tracking-tight text-gray-900 dark:text-white relative">
              {stats.total}
            </p>
            <p className="text-[11px] text-gray-500 mt-1 relative">
              R$ {brl(stats.totalCurrent)} guardados de R$ {brl(stats.totalTarget)}
            </p>
          </div>

          {/* Progresso médio com ring */}
          <div className="relative bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl p-5 overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-accent" />
              </div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Conclusão média</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-3xl font-heading font-extrabold tracking-tight text-gray-900 dark:text-white">
                {stats.avgPct.toFixed(0)}%
              </p>
              <div className="flex-1 h-2 bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.avgPct}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
                />
              </div>
            </div>
            <p className="text-[11px] text-gray-500 mt-2">
              {stats.completedCount} {stats.completedCount === 1 ? 'meta concluída' : 'metas concluídas'}
              {' · '}
              {stats.dueSoonCount} {stats.dueSoonCount === 1 ? 'próxima do prazo' : 'próximas do prazo'}
            </p>
          </div>

          {/* Próximas do prazo */}
          <div className="relative bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl p-5 overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                stats.dueSoonCount > 0
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-emerald-500/10 border-emerald-500/30'
              }`}>
                <Clock className={`w-4 h-4 ${stats.dueSoonCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
              </div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Vencem em 30 dias</p>
            </div>
            <p className={`text-3xl font-heading font-extrabold tracking-tight ${
              stats.dueSoonCount > 0 ? 'text-amber-500' : 'text-gray-900 dark:text-white'
            }`}>
              {stats.dueSoonCount}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              {stats.dueSoonCount === 0 ? 'Nada urgente — siga no ritmo' : 'Hora de acelerar essas reservas'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Lista / estados */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-56 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : loadError ? (
        <div className="flex items-start gap-2 p-4 bg-accent/10 border border-accent/20 rounded-xl">
          <AlertCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <p className="text-accent text-sm">{loadError}</p>
        </div>
      ) : goals.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center text-center py-16 bg-white dark:bg-dark-surface border border-dashed border-gray-200 dark:border-dark-border rounded-2xl"
        >
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
            <Target className="w-7 h-7 text-accent" />
          </div>
          <p className="text-gray-900 dark:text-white font-semibold mb-1">Nenhuma meta cadastrada</p>
          <p className="text-gray-500 text-sm max-w-xs">
            Defina seu primeiro objetivo financeiro — viagem, reserva de emergência, troca de carro, o que importa pra você.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-5 flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-red-600 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar primeira meta
          </button>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <AnimatePresence initial={false}>
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onAddDeposit={setPendingDeposit}
                onDelete={setPendingDelete}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modais */}
      <AnimatePresence>
        {showAdd && (
          <AddGoalForm
            onClose={() => setShowAdd(false)}
            onCreated={handleCreated}
          />
        )}
      </AnimatePresence>
      <AddDepositModal
        goal={pendingDeposit}
        onClose={() => setPendingDeposit(null)}
        onSaved={handleDeposited}
      />
      <DeleteConfirmModal
        goal={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirmed}
        deleting={deleting}
      />
    </div>
  );
}
