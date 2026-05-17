import { motion } from 'framer-motion';

// Barra de sub-abas do Dashboard. Pills com aba ativa em accent,
// scroll horizontal no mobile, animação de troca via layoutId.
export function DashboardTabs({ tabs, activeId, onChange, notificationCount = 0 }) {
  return (
    <div className="relative -mx-6 px-6 lg:mx-0 lg:px-0 mb-8">
      <div
        className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1 py-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeId === tab.id;
          const hasNotification = (tab.id === 'subscriptions' || tab.id === 'installments') && notificationCount > 0;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors shrink-0 ${
                isActive
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="dashboardTabIndicator"
                  className="absolute inset-0 bg-accent rounded-full shadow-lg shadow-accent/30"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-2">
                {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                <span>{tab.label}</span>
                {hasNotification && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-accent text-white text-xs font-bold"
                  >
                    {notificationCount}
                  </motion.span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Fade lateral só no mobile pra indicar scroll */}
      <div className="lg:hidden pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-50 dark:from-dark-bg to-transparent" />
    </div>
  );
}
