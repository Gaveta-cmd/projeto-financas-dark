import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, CreditCard, AlertCircle } from 'lucide-react';
import { Button } from './Button';

const COLORS = [
  '#6366f1', '#ef4444', '#f59e0b', '#10b981',
  '#ec4899', '#0ea5e9', '#8b5cf6', '#71717a',
];

const BANKS = ['Nubank', 'Inter', 'Itaú', 'Bradesco', 'C6 Bank', 'Santander', 'Caixa', 'BTG', 'XP', 'Outro'];

export function CardForm({ initial = {}, onSave, onCancel, saving: extSaving = false }) {
  const [name,   setName]   = useState(initial.name   ?? '');
  const [type,   setType]   = useState(initial.type   ?? 'credit');
  const [bank,   setBank]   = useState(initial.bank   ?? '');
  const [color,  setColor]  = useState(initial.color  ?? '#6366f1');
  const [limit,  setLimit]  = useState(initial.credit_limit != null ? String(initial.credit_limit) : '');
  const [error,  setError]  = useState('');

  const showLimit = type === 'credit' || type === 'hybrid';

  function handleSave() {
    if (!name.trim()) { setError('Informe o nome do cartão.'); return; }
    if (showLimit && limit !== '' && Number(limit) <= 0) {
      setError('O limite deve ser maior que zero.'); return;
    }
    setError('');
    onSave({
      name:         name.trim(),
      type,
      bank:         bank || null,
      color,
      credit_limit: showLimit && limit ? Number(limit) : null,
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl shadow-2xl w-full max-w-sm p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + '22' }}>
            <CreditCard className="w-4 h-4" style={{ color }} />
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {initial.id ? 'Editar cartão' : 'Novo cartão'}
          </p>
        </div>
        <button onClick={onCancel} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Nome */}
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">
            Nome <span className="text-accent">*</span>
          </label>
          <input
            type="text"
            placeholder="Ex: Nubank Débito"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={80}
            autoFocus
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm"
          />
        </div>

        {/* Tipo */}
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">Tipo</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { value: 'debit',  label: 'Débito' },
              { value: 'credit', label: 'Crédito' },
              { value: 'hybrid', label: 'Híbrido' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={`py-2 rounded-lg text-xs font-semibold border transition-colors ${
                  type === opt.value
                    ? 'bg-accent/10 border-accent/40 text-accent'
                    : 'bg-gray-50 dark:bg-dark-bg border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-400 hover:border-accent/30'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {type === 'hybrid' && (
            <p className="text-xs text-gray-400 mt-1">Cartão que funciona como débito e crédito (ex: Nubank).</p>
          )}
        </div>

        {/* Banco */}
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">Banco</label>
          <select
            value={bank}
            onChange={e => setBank(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm"
          >
            <option value="">Selecionar banco</option>
            {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Limite (crédito/híbrido) */}
        {showLimit && (
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">
              Limite de crédito
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="R$ 0,00"
              value={limit}
              onChange={e => setLimit(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm"
            />
          </div>
        )}

        {/* Cor */}
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">Cor</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full border-2 transition-all"
                style={{
                  background: c,
                  borderColor: color === c ? '#fff' : 'transparent',
                  boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
                }}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-gray-100 dark:border-dark-border">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Cancelar
        </button>
        <Button
          onClick={handleSave}
          disabled={extSaving}
          className="py-2 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {extSaving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </motion.div>
  );
}
