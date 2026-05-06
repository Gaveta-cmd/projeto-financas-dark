import { Wallet, Bell, User, LogOut, LayoutDashboard, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

const TABS = [
  { id: 'dashboard', label: 'Dashboard',          icon: LayoutDashboard },
  { id: 'accounts',  label: 'Contas Conectadas',  icon: CreditCard       },
];

export function Header({ activeTab = 'dashboard', onTabChange, onLogout }) {
  return (
    <>
      {/* ── Top header — hidden on desktop (lg+) because Sidebar takes over ── */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="lg:hidden fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50 rounded-2xl bg-black/40 backdrop-blur-md border border-white/5 shadow-[0_0_20px_rgba(239,35,60,0.1)]"
      >
        {/* Gradient border shimmer */}
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/5 via-accent/20 to-white/5 opacity-50 pointer-events-none"
          style={{
            padding: '1px',
            maskImage: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
          }}
        />

        <div className="flex items-center justify-between px-6 py-4 relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-red-700 flex items-center justify-center shadow-lg shadow-accent/20">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-white tracking-tight">
              Vibe<span className="text-accent">Finance</span>
            </span>
          </div>

          {/* Tab navigation — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-1 bg-black/30 rounded-xl p-1 border border-white/5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-dark-surface border border-dark-border rounded-lg"
                    transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0.5 w-2 h-2 rounded-full bg-accent ring-2 ring-black" />
            </button>
            <div className="w-9 h-9 rounded-full bg-dark-surface border border-dark-border flex items-center justify-center cursor-pointer hover:border-accent/50 transition-colors">
              <User className="w-5 h-5 text-gray-300" />
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onLogout}
              title="Sair"
              className="text-gray-500 hover:text-accent transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* ── Mobile bottom tab bar — visible only on small screens ── */}
      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-t border-dark-border"
      >
        <div className="flex">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={`relative flex-1 py-4 flex flex-col items-center gap-1.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-accent' : 'text-gray-500'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveTab"
                    className="absolute top-0 left-4 right-4 h-0.5 bg-accent rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                  />
                )}
                <Icon className="w-5 h-5" />
                <span>{tab.id === 'accounts' ? 'Contas' : tab.label}</span>
              </button>
            );
          })}
        </div>
      </motion.nav>
    </>
  );
}
