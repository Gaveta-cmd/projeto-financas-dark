import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Zap, Crown } from 'lucide-react';

const PLANS = [
  {
    id: 'pro',
    name: 'Pro',
    badge: 'Popular',
    monthly: 39,
    annual: 32,
    icon: Zap,
    features: [
      '5 contas bancárias',
      'Relatórios exclusivos',
      'Suporte prioritário',
      'Agentes de IA',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    badge: null,
    monthly: 199,
    annual: 166,
    icon: Crown,
    features: [
      'Múltiplas contas',
      'Até 10 agentes de IA',
      'Conexão via API/MCP',
      'Acesso antecipado',
    ],
  },
];

export function Subscription() {
  const [modalOpen, setModalOpen] = useState(false);
  const [billing, setBilling] = useState('monthly');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg px-4 py-8 md:py-12">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
            Planos
          </h1>
          <p className="text-gray-500 text-sm mt-1">Plano atual</p>
        </div>

        {/* Current plan card */}
        <section className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl p-6 space-y-5">
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">Grátis</p>
            <p className="text-xs text-gray-500 mt-0.5">Seu plano atual</p>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Conexões bancárias</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">1 / 1</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full w-full bg-gray-400 dark:bg-white rounded-full" />
            </div>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="w-full py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors"
          >
            Upgrade
          </button>
        </section>

      </div>

      {/* Upgrade modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            key="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } }}
              exit={{ opacity: 0, scale: 0.95, y: 16, transition: { duration: 0.18 } }}
              className="w-full max-w-2xl bg-black rounded-3xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Close */}
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="text-center mb-7">
                <h2 className="text-xl md:text-2xl font-bold text-white leading-snug">
                  O futuro do seu dinheiro chegou
                </h2>
                <p className="text-gray-400 text-sm mt-2">
                  Comece com R$&nbsp;39,00 por mês · Cancele quando quiser
                </p>
              </div>

              {/* Billing toggle */}
              <div className="flex items-center justify-center gap-3 mb-8">
                <span className={`text-sm font-medium transition-colors ${billing === 'monthly' ? 'text-white' : 'text-gray-500'}`}>
                  Mensal
                </span>
                <button
                  onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
                  aria-label="Alternar período de cobrança"
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                    billing === 'annual' ? 'bg-lime-500' : 'bg-zinc-700'
                  }`}
                >
                  <motion.span
                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                    animate={{ left: billing === 'annual' ? '1.375rem' : '0.25rem' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                </button>
                <span className={`text-sm font-medium transition-colors ${billing === 'annual' ? 'text-white' : 'text-gray-500'}`}>
                  Anual
                  <span className="ml-1.5 text-xs font-bold text-lime-400">−20%</span>
                </span>
              </div>

              {/* Plans grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PLANS.map(({ id, name, badge, monthly, annual, icon: Icon, features }) => {
                  const price = billing === 'annual' ? annual : monthly;
                  return (
                    <div
                      key={id}
                      className={`relative rounded-2xl p-6 border flex flex-col ${
                        badge
                          ? 'border-lime-500/50 bg-zinc-950'
                          : 'border-zinc-800 bg-zinc-950'
                      }`}
                    >
                      {/* Popular badge */}
                      {badge && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lime-500 text-black text-xs font-bold px-3 py-0.5 rounded-full whitespace-nowrap">
                          {badge}
                        </span>
                      )}

                      {/* Name + icon */}
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className="w-5 h-5 text-lime-400 shrink-0" />
                        <span className="text-white font-bold text-lg">{name}</span>
                      </div>

                      {/* Price */}
                      <p className="mb-5">
                        <span className="text-3xl font-extrabold text-white">
                          R$&nbsp;{price},00
                        </span>
                        <span className="text-gray-500 text-sm">/mês</span>
                      </p>

                      {/* Features */}
                      <ul className="space-y-2.5 mb-6 flex-1">
                        {features.map(f => (
                          <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                            <Check className="w-4 h-4 text-lime-400 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>

                      {/* Subscribe */}
                      <button className="w-full py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-black text-sm font-bold transition-colors">
                        Assinar
                      </button>
                    </div>
                  );
                })}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
