import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, RefreshCw, CheckCircle2, Link2 } from 'lucide-react';
import { seedBankData } from '../lib/bankSeed';
import { useDemoMode } from '../contexts/DemoContext';

const BANKS = [
  { id: 'nubank',    name: 'Nubank',    abbr: 'Nu',  color: '#820AD1', type: 'Digital',     range: [800,  4500] },
  { id: 'inter',     name: 'Inter',     abbr: 'In',  color: '#FF7A00', type: 'Digital',     range: [300,  3200] },
  { id: 'itau',      name: 'Itaú',      abbr: 'Itá', color: '#003799', type: 'Tradicional', range: [1500, 9000] },
  { id: 'bradesco',  name: 'Bradesco',  abbr: 'Bra', color: '#CC092F', type: 'Tradicional', range: [700,  7000] },
  { id: 'c6',        name: 'C6 Bank',   abbr: 'C6',  color: '#C8A951', type: 'Digital',     range: [150,  2500] },
  { id: 'picpay',    name: 'PicPay',    abbr: 'PP',  color: '#21C25E', type: 'Digital',     range: [50,   1200] },
  { id: 'santander', name: 'Santander', abbr: 'San', color: '#EC0000', type: 'Tradicional', range: [2000, 12000]},
  { id: 'caixa',     name: 'Caixa',     abbr: 'CEF', color: '#0067A5', type: 'Público',     range: [500,  6000] },
];

function mockBalance([min, max]) {
  return +(Math.random() * (max - min) + min).toFixed(2);
}

function brl(n) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 120, damping: 16 } },
};

export function ConnectedAccounts({
  accounts,
  onConnect,
  onDisconnect,
  eyebrow = 'Integração Bancária',
  title  = (<>Contas <span className="text-accent">Conectadas</span></>),
}) {
  const [connecting, setConnecting] = useState(null);
  const { isDemo, showDemoBlock } = useDemoMode();

  const handleConnect = async (bank) => {
    if (isDemo) { showDemoBlock(); return; }
    setConnecting(bank.id);
    // Seed de demo data roda em paralelo com o delay visual de "Conectando…".
    // Se o seed falhar (ex.: sessão expirada), seguimos com a conexão local —
    // o usuário ainda vê o banco conectado, só não vê transações de exemplo.
    await Promise.all([
      new Promise(r => setTimeout(r, 1800)),
      seedBankData(bank).catch(() => null),
    ]);
    onConnect({ id: bank.id, name: bank.name, abbr: bank.abbr, color: bank.color, type: bank.type, balance: mockBalance(bank.range) });
    setConnecting(null);
  };

  const connectedIds = new Set(accounts.map(a => a.id));
  const available = BANKS.filter(b => !connectedIds.has(b.id));
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div>
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-2 uppercase tracking-wider text-sm">{eyebrow}</p>
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tighter">
            {title}
          </h1>
        </div>
        {accounts.length > 0 && (
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Saldo Total</p>
            <p className="text-3xl font-heading font-bold text-gray-900 dark:text-white">
              R$ {brl(totalBalance)}
            </p>
          </div>
        )}
      </motion.div>

      {/* Connected accounts */}
      <AnimatePresence>
        {accounts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-10 overflow-hidden"
          >
            <h2 className="text-base font-heading font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-accent" />
              Suas contas ({accounts.length})
            </h2>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {accounts.map((acc) => (
                <motion.div
                  key={acc.id}
                  variants={itemVariants}
                  layout
                  className="relative bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-5 overflow-hidden group"
                >
                  {/* Subtle brand glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: `radial-gradient(circle at top left, ${acc.color}18, transparent 60%)` }}
                  />
                  <div className="relative z-10 flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center font-heading font-bold text-sm"
                        style={{ backgroundColor: `${acc.color}22`, border: `1.5px solid ${acc.color}44` }}
                      >
                        <span style={{ color: acc.color }}>{acc.abbr}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{acc.name}</p>
                        <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          Conectado · {acc.type}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => isDemo ? showDemoBlock() : onDisconnect(acc)}
                      className="text-gray-400 dark:text-gray-600 hover:text-accent transition-colors p-1 rounded-lg hover:bg-accent/10"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="relative z-10">
                    <p className="text-xs text-gray-500 mb-1">Saldo disponível</p>
                    <p className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
                      R$ {brl(acc.balance)}
                    </p>
                  </div>
                  {/* Bottom accent line */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5 opacity-40"
                    style={{ background: `linear-gradient(to right, transparent, ${acc.color}, transparent)` }}
                  />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Available banks */}
      {available.length > 0 && (
        <div>
          <h2 className="text-base font-heading font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-accent" />
            {accounts.length === 0 ? 'Conecte seu primeiro banco' : 'Adicionar conta'}
          </h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {available.map((bank) => {
              const isConnecting = connecting === bank.id;
              return (
                <motion.button
                  key={bank.id}
                  variants={itemVariants}
                  onClick={() => !connecting && handleConnect(bank)}
                  disabled={!!connecting}
                  whileHover={!connecting ? { y: -2 } : {}}
                  whileTap={!connecting ? { scale: 0.97 } : {}}
                  className="group relative bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-5 text-left hover:border-gray-300 dark:hover:border-white/15 transition-all disabled:cursor-wait overflow-hidden"
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: `radial-gradient(circle at bottom right, ${bank.color}12, transparent 60%)` }}
                  />
                  <div className="relative z-10 flex flex-col gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center font-heading font-bold text-sm"
                      style={{ backgroundColor: `${bank.color}1a`, border: `1.5px solid ${bank.color}33` }}
                    >
                      <span style={{ color: bank.color }}>{bank.abbr}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{bank.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{bank.type}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      {isConnecting ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin text-accent" />
                          <span className="text-accent">Conectando...</span>
                        </>
                      ) : (
                        <span className="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Conectar
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      )}

      {/* All connected state */}
      {available.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-gray-500 dark:text-gray-600"
        >
          <CheckCircle2 className="w-10 h-10 text-accent mx-auto mb-3" />
          <p className="font-medium text-gray-700 dark:text-gray-400">Todas as contas estão conectadas!</p>
          <p className="text-sm mt-1">Desconecte alguma para ver outras opções.</p>
        </motion.div>
      )}
    </div>
  );
}
