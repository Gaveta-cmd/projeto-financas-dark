import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { useCards } from '../../hooks/useCards';
import { useHouseholdCtx } from '../../contexts/HouseholdContext';
import { CardForm } from '../CardForm';

function brl(n) {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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

function CardTile({ card, isOwner, onEdit, onDelete, month }) {
  const { fetchCreditUsage, fetchDebitBalance } = useCards();
  const [used,    setUsed]    = useState(null);
  const [balance, setBalance] = useState(null);

  const showCredit = card.type === 'credit' || card.type === 'hybrid';
  const showDebit  = card.type === 'debit'  || card.type === 'hybrid';

  useEffect(() => {
    if (showCredit) fetchCreditUsage(card.id, month).then(setUsed);
    if (showDebit)  fetchDebitBalance(card.id).then(setBalance);
  }, [card.id, month, showCredit, showDebit, fetchCreditUsage, fetchDebitBalance]);

  const usedPct = showCredit && card.credit_limit && used != null
    ? Math.min((used / card.credit_limit) * 100, 100)
    : null;

  const typeLabel = { credit: 'Crédito', debit: 'Débito', hybrid: 'Híbrido' }[card.type];

  return (
    <motion.div
      variants={itemVariants}
      className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-2xl overflow-hidden"
    >
      {/* Cabeçalho colorido estilo cartão */}
      <div className="p-5 pb-4" style={{ background: `linear-gradient(135deg, ${card.color}22 0%, transparent 60%)` }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4" style={{ color: card.color }} />
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: card.color }}>{typeLabel}</span>
            </div>
            <p className="text-base font-bold text-gray-900 dark:text-white">{card.name}</p>
            {card.bank && <p className="text-xs text-gray-400 mt-0.5">{card.bank}</p>}
          </div>
          {isOwner && (
            <div className="flex items-center gap-1">
              <button
                onClick={onEdit}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-accent hover:bg-accent/10 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onDelete}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-5 space-y-3">
        {/* Crédito */}
        {showCredit && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500 dark:text-gray-400">Crédito usado no mês</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                {used != null ? `R$ ${brl(used)}` : '—'}
                {card.credit_limit ? ` / R$ ${brl(card.credit_limit)}` : ''}
              </span>
            </div>
            {card.credit_limit && usedPct != null && (
              <>
                <div className="h-2 bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${usedPct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: usedPct > 80 ? '#ef233c' : card.color }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">{usedPct.toFixed(0)}% usado</span>
                  <span className="text-xs text-emerald-500 font-semibold">
                    R$ {brl(card.credit_limit - (used ?? 0))} disponível
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Débito */}
        {showDebit && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Saldo estimado (débito)</span>
            <span className={`text-sm font-bold ${(balance ?? 0) >= 0 ? 'text-emerald-500' : 'text-accent'}`}>
              {balance != null ? `R$ ${brl(balance)}` : '—'}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function CardsTab() {
  const ctx = useHouseholdCtx();
  const { cards, addCard, updateCard, deleteCard } = useCards();
  const members  = ctx?.members ?? [];
  const currentUserId = ctx?.currentMember?.user_id;

  const month = currentMonth();

  const [showForm,   setShowForm]   = useState(false);
  const [editCard,   setEditCard]   = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [deleteConf, setDeleteConf] = useState(null);

  async function handleSave(data) {
    setSaving(true);
    if (editCard) {
      await updateCard(editCard.id, data);
    } else {
      await addCard(data);
    }
    setSaving(false);
    setShowForm(false);
    setEditCard(null);
  }

  async function handleDelete(cardId) {
    await deleteCard(cardId);
    setDeleteConf(null);
  }

  // Agrupar por membro
  const grouped = members.map((m, i) => ({
    member: m,
    color: MEMBER_COLORS[i % MEMBER_COLORS.length],
    cards: cards.filter(c => c.user_id === m.user_id),
  })).filter(g => g.cards.length > 0 || g.member.user_id === currentUserId);

  const totalCreditAvailable = cards.reduce((s, c) => {
    if ((c.type === 'credit' || c.type === 'hybrid') && c.credit_limit) return s + c.credit_limit;
    return s;
  }, 0);

  if (ctx?.loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-gray-900 dark:text-white">Cartões</h2>
          <p className="text-xs text-gray-500 mt-0.5">{cards.length} cartão{cards.length !== 1 ? 's' : ''} cadastrado{cards.length !== 1 ? 's' : ''} na casa</p>
        </div>
        <button
          onClick={() => { setEditCard(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-red-600 text-white text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Adicionar cartão</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </motion.div>

      {/* Total crédito disponível */}
      {totalCreditAvailable > 0 && (
        <motion.div variants={itemVariants} className="bg-accent/5 border border-accent/20 rounded-2xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Limite de crédito total da casa</p>
            <p className="text-lg font-heading font-extrabold text-gray-900 dark:text-white">R$ {brl(totalCreditAvailable)}</p>
          </div>
          <CreditCard className="w-8 h-8 text-accent/40" />
        </motion.div>
      )}

      {/* Sem cartões */}
      {cards.length === 0 && (
        <motion.div variants={itemVariants} className="text-center py-16 bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-2xl">
          <CreditCard className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-500">Nenhum cartão cadastrado</p>
          <p className="text-xs text-gray-400 mt-1">Adicione os cartões da família para acompanhar os gastos.</p>
        </motion.div>
      )}

      {/* Agrupado por membro */}
      {grouped.map(({ member, color, cards: mCards }) => (
        <motion.div key={member.user_id} variants={itemVariants}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: color }}>
              {initials(member.nickname)}
            </div>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{member.nickname || 'Membro'}</p>
            {member.user_id === currentUserId && (
              <span className="text-xs text-accent font-semibold">(você)</span>
            )}
          </div>

          {mCards.length === 0 ? (
            <div className="py-4 px-5 bg-gray-50 dark:bg-dark-bg border border-dashed border-gray-200 dark:border-dark-border rounded-xl text-center">
              <p className="text-xs text-gray-400">Nenhum cartão ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mCards.map(card => (
                <CardTile
                  key={card.id}
                  card={card}
                  isOwner={card.user_id === currentUserId}
                  month={month}
                  onEdit={() => { setEditCard(card); setShowForm(true); }}
                  onDelete={() => setDeleteConf(card.id)}
                />
              ))}
            </div>
          )}
        </motion.div>
      ))}

      {/* Modal do formulário */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => { setShowForm(false); setEditCard(null); }}
            />
            <div className="relative z-10 w-full max-w-sm">
              <CardForm
                initial={editCard ?? {}}
                onSave={handleSave}
                onCancel={() => { setShowForm(false); setEditCard(null); }}
                saving={saving}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmação de exclusão */}
      <AnimatePresence>
        {deleteConf && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeleteConf(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl shadow-2xl p-6 max-w-sm w-full"
            >
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Excluir cartão?</h3>
              <p className="text-sm text-gray-500 mb-5">As transações vinculadas a este cartão não serão apagadas, apenas o vínculo.</p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setDeleteConf(null)}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(deleteConf)}
                  className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
