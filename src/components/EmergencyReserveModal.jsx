import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Shield } from 'lucide-react';
import { Button } from './Button';
import { supabase } from '../lib/supabaseClient';

function brl(n) {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function defaultDeadline() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
}

export function EmergencyReserveModal({ targetAmount, onClose, onCreated }) {
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  async function handleCreate() {
    try {
      setSaving(true);
      setError('');

      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) { setError('Sessão expirada. Faça login novamente.'); return; }

      const { error: err } = await supabase.from('goals').insert({
        user_id:        user.id,
        name:           'Reserva de Emergência',
        target_amount:  Math.max(Number(targetAmount), 0.01),
        current_amount: 0,
        deadline,
        category:       'emergencia',
        color:          '#ef233c',
      });

      if (err) { setError(err.message); return; }

      onCreated?.();
      onClose();
    } catch {
      setError('Erro ao criar meta. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{    opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="relative z-10 w-full max-w-md bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl shadow-2xl"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-extrabold text-gray-900 dark:text-white leading-tight">
                  Criar Reserva de Emergência
                </h2>
                <p className="text-xs text-gray-500">Calculado com base nos seus gastos dos últimos 6 meses</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {/* Nome (disabled) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Nome da meta
              </label>
              <input
                type="text"
                value="Reserva de Emergência"
                disabled
                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl text-gray-400 dark:text-gray-500 text-sm cursor-not-allowed"
              />
            </div>

            {/* Valor alvo (disabled) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Valor alvo — 6 meses de gastos
              </label>
              <input
                type="text"
                value={`R$ ${brl(targetAmount)}`}
                disabled
                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl text-gray-400 dark:text-gray-500 text-sm cursor-not-allowed font-heading font-bold"
              />
            </div>

            {/* Categoria / cor (disabled) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Categoria e cor
              </label>
              <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-100 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl cursor-not-allowed">
                <div className="w-4 h-4 rounded-full bg-accent shrink-0" />
                <span className="text-sm text-gray-400 dark:text-gray-500">Emergência · #ef233c</span>
              </div>
            </div>

            {/* Prazo (editável) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Prazo <span className="text-accent">*</span>
              </label>
              <input
                type="date"
                value={deadline}
                min={today}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>

            {error && (
              <p className="text-xs text-accent bg-accent/10 border border-accent/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-gray-100 dark:border-dark-border">
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-4 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5"
            >
              Cancelar
            </button>
            <Button
              onClick={handleCreate}
              disabled={saving || !deadline}
              className="py-2.5 px-5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Criando...' : 'Criar Meta'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
