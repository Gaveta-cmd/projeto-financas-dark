import { Card } from '../Card';
import { Button } from '../Button';
import { MonthlyExpensesChart } from '../MonthlyExpensesChart';
import { Coffee, ShoppingBag, Zap, Target, AlertTriangle, Link2 } from 'lucide-react';
import { motion } from 'framer-motion';

const transactions = [
  { id: 1, name: 'iFood',   amount: -45.90,  icon: Coffee,      date: 'Hoje, 12:30',  type: 'out' },
  { id: 2, name: 'Steam',   amount: -129.90, icon: ShoppingBag, date: 'Ontem',        type: 'out' },
  { id: 3, name: 'Salário', amount: 4500.00, icon: Zap,         date: '1 de mai',     type: 'in'  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 100, damping: 15 } },
};

function brl(n) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function ProgressBar({ value, color = 'bg-gray-900 dark:bg-white' }) {
  return (
    <div className="h-2 w-full bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
      />
    </div>
  );
}

export function OverviewTab({ accounts = [], onGoToCards }) {
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const hasAccounts = accounts.length > 0;

  // 50/30/20 budgets from real total
  const needsBudget   = totalBalance * 0.50;
  const wantsBudget   = totalBalance * 0.30;
  const savingsBudget = totalBalance * 0.20;

  // Mock spending ratios (realistic simulation)
  const needsSpent    = needsBudget   * 0.82;
  const wantsSpent    = wantsBudget   * 0.64;
  const savingsActual = savingsBudget * 0.76;

  const [balInt, balDec] = brl(totalBalance).split(',');

  return (
    <>
      {/* Balance header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-2 uppercase tracking-wider text-sm">Saldo Total</p>
          {hasAccounts ? (
            <h1 className="text-5xl md:text-7xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tighter">
              R$ {balInt}<span className="text-gray-400 dark:text-gray-500">,{balDec}</span>
            </h1>
          ) : (
            <div>
              <h1 className="text-5xl md:text-7xl font-heading font-extrabold text-gray-300 dark:text-gray-700 tracking-tighter">
                R$ --<span className="text-gray-200 dark:text-gray-800">,--</span>
              </h1>
              <button
                onClick={onGoToCards}
                className="mt-3 flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors font-medium"
              >
                <Link2 className="w-4 h-4" />
                Conecte uma conta para ver seu saldo
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-4">
          <Button variant="secondary">Enviar</Button>
          <Button variant="primary">Adicionar</Button>
        </div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Column 1: Chart + Transactions */}
        <motion.div variants={itemVariants} className="flex flex-col gap-8 lg:col-span-2">
          <MonthlyExpensesChart accounts={accounts} onGoToAccounts={onGoToCards} />

          <div>
            <h3 className="text-lg font-heading font-bold text-gray-900 dark:text-white mb-4">Últimas Transações</h3>
            <div className="flex flex-col gap-3">
              {transactions.map(t => (
                <div
                  key={t.id}
                  className="group relative flex items-center justify-between p-4 bg-white dark:bg-dark-surface/50 border border-gray-200 dark:border-dark-border rounded-xl hover:bg-gray-50 dark:hover:bg-dark-surface transition-all overflow-hidden"
                >
                  <div className="absolute inset-y-0 left-0 w-1 bg-accent transform -translate-x-full group-hover:translate-x-0 transition-transform" />
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-dark-bg border border-gray-200 dark:border-dark-border flex items-center justify-center group-hover:border-accent/50 transition-colors">
                      <t.icon className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.date}</p>
                    </div>
                  </div>
                  <p className={`font-bold font-heading ${t.type === 'in' ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                    {t.type === 'in' ? '+' : '-'}R$ {brl(Math.abs(t.amount))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Column 2: 50/30/20 + Goals + Alert */}
        <motion.div variants={itemVariants} className="flex flex-col gap-8">

          {/* 50/30/20 */}
          <Card withAccent={false}>
            <h3 className="text-lg font-heading font-bold text-gray-900 dark:text-white mb-1">Regra 50/30/20</h3>
            {!hasAccounts ? (
              <div className="mt-4 flex flex-col items-center gap-3 py-6 text-center">
                <Link2 className="w-8 h-8 text-gray-300 dark:text-gray-700" />
                <p className="text-sm text-gray-500">Conecte uma conta para calcular sua divisão automaticamente.</p>
                <button
                  onClick={onGoToCards}
                  className="text-accent text-sm font-semibold hover:text-accent/80 transition-colors"
                >
                  Conectar banco →
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-5 mt-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Necessidades (50%)</span>
                    <span className="text-gray-900 dark:text-white font-semibold">
                      R$ {brl(needsSpent)} / {brl(needsBudget)}
                    </span>
                  </div>
                  <ProgressBar value={(needsSpent / needsBudget) * 100} color="bg-gray-900 dark:bg-white" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Lazer (30%)</span>
                    <span className="text-gray-900 dark:text-white font-semibold">
                      R$ {brl(wantsSpent)} / {brl(wantsBudget)}
                    </span>
                  </div>
                  <ProgressBar value={(wantsSpent / wantsBudget) * 100} color="bg-gray-500 dark:bg-gray-400" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Investimentos (20%)</span>
                    <span className="text-accent font-semibold">
                      R$ {brl(savingsActual)} / {brl(savingsBudget)}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-accent rounded-full shadow-[0_0_10px_#ef233c]"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((savingsActual / savingsBudget) * 100, 100)}%` }}
                      transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Savings Goal */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-accent" />
              </div>
              <h3 className="text-lg font-heading font-bold text-gray-900 dark:text-white">Meta de Reserva</h3>
            </div>
            <p className="text-3xl font-heading font-bold text-gray-900 dark:text-white mb-1">R$ 15.000</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Reserva de Emergência · 80% concluída</p>
            <div className="h-1.5 w-full bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden relative">
              <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-red-600 rounded-full w-[80%]" />
            </div>
          </Card>

          {/* Alert */}
          <Card className="bg-accent/5 dark:bg-accent/5 border-accent/30 dark:border-accent/30">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-5 h-5 text-accent animate-pulse mt-1 shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-1 tracking-tight">Alerta de Gastos</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Você está próximo do limite em <span className="text-gray-900 dark:text-gray-200 font-semibold">Restaurantes</span>. Restam R$ 45 para este mês.
                </p>
              </div>
            </div>
          </Card>

        </motion.div>
      </motion.div>
    </>
  );
}
