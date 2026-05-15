import { useState } from 'react';
import {
  Wallet, Bell, User, LogOut, LayoutDashboard, Target,
  Settings, Sliders, Lock, AlertTriangle, MessageCircle, X, FlaskConical,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'goals',     label: 'Metas',     icon: Target          },
];

const SETTINGS_MENU = [
  {
    section: 'Geral',
    items: [
      { id: 'profile',      label: 'Perfil',       icon: User    },
      { id: 'preferences',  label: 'Preferências', icon: Sliders },
    ],
  },
  {
    section: 'Segurança',
    items: [
      { id: 'change-password', label: 'Alterar Senha', icon: Lock },
    ],
  },
  {
    section: 'Suporte',
    items: [
      { id: 'report-problem', label: 'Reportar um Problema', icon: AlertTriangle },
      { id: 'support-chat',   label: 'Falar com o Suporte',   icon: MessageCircle },
    ],
  },
];

const SETTINGS_IDS = SETTINGS_MENU.flatMap(s => s.items.map(i => i.id));

export function Header({ activeTab = 'dashboard', onTabChange, onLogout, isDemo }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const isSettingsActive = SETTINGS_IDS.includes(activeTab);

  const handleSettingsPick = (id) => {
    onTabChange?.(id);
    setSheetOpen(false);
  };

  return (
    <>
      {/* ── Top header — hidden on desktop (lg+) because Sidebar takes over ── */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="lg:hidden fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50 rounded-2xl bg-white/80 dark:bg-black/40 backdrop-blur-md border border-gray-200 dark:border-white/5 shadow-[0_0_20px_rgba(239,35,60,0.1)]"
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
            <span className="font-heading font-bold text-xl text-gray-900 dark:text-white tracking-tight">
              Vibe<span className="text-accent">Finance</span>
            </span>
          </div>

          {/* Tab navigation — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-100 dark:bg-black/30 rounded-xl p-1 border border-gray-200 dark:border-white/5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  activeTab === tab.id ? 'text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg"
                    transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <button className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0.5 w-2 h-2 rounded-full bg-accent ring-2 ring-white dark:ring-black" />
            </button>
            <button
              onClick={() => onTabChange?.('profile')}
              aria-label="Perfil"
              className="w-9 h-9 rounded-full bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border flex items-center justify-center cursor-pointer hover:border-accent/50 transition-colors"
            >
              <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
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
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-black/90 backdrop-blur-md border-t border-gray-200 dark:border-dark-border"
      >
        <div className="flex">
          {/* Dashboard */}
          <button
            onClick={() => onTabChange?.('dashboard')}
            className={`relative flex-1 py-4 flex flex-col items-center gap-1.5 text-xs font-medium transition-colors ${
              activeTab === 'dashboard' ? 'text-accent' : 'text-gray-500'
            }`}
          >
            {activeTab === 'dashboard' && (
              <motion.div
                layoutId="mobileActiveTab"
                className="absolute top-0 left-4 right-4 h-0.5 bg-accent rounded-full"
                transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              />
            )}
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>

          {/* Metas */}
          <button
            onClick={() => onTabChange?.('goals')}
            className={`relative flex-1 py-4 flex flex-col items-center gap-1.5 text-xs font-medium transition-colors ${
              activeTab === 'goals' ? 'text-accent' : 'text-gray-500'
            }`}
          >
            {activeTab === 'goals' && (
              <motion.div
                layoutId="mobileActiveTab"
                className="absolute top-0 left-4 right-4 h-0.5 bg-accent rounded-full"
                transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              />
            )}
            <Target className="w-5 h-5" />
            <span>Metas</span>
          </button>

          {/* Configurações */}
          <button
            onClick={() => setSheetOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
            className={`relative flex-1 py-4 flex flex-col items-center gap-1.5 text-xs font-medium transition-colors ${
              isSettingsActive
                ? 'text-accent'
                : sheetOpen
                  ? 'text-gray-900 dark:text-gray-200'
                  : 'text-gray-500'
            }`}
          >
            {isSettingsActive && (
              <motion.div
                layoutId="mobileActiveTab"
                className="absolute top-0 left-4 right-4 h-0.5 bg-accent rounded-full"
                transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              />
            )}
            <Settings className="w-5 h-5" />
            <span>Configurações</span>
          </button>
        </div>
      </motion.nav>

      {/* ── Settings bottom sheet (mobile) ── */}
      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            key="settings-sheet-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
          >
            <motion.div
              key="settings-sheet-panel"
              role="dialog"
              aria-label="Configurações"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 35 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 bg-white dark:bg-dark-surface border-t border-gray-200 dark:border-dark-border rounded-t-3xl max-h-[85vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-zinc-700" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 sticky top-0 bg-white dark:bg-dark-surface z-10">
                <h2 className="font-heading font-bold text-lg text-gray-900 dark:text-white">
                  Configurações
                </h2>
                <button
                  onClick={() => setSheetOpen(false)}
                  aria-label="Fechar"
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sections */}
              <div className="px-3 pb-4 flex flex-col gap-5">
                {SETTINGS_MENU.map(({ section, items }) => (
                  <div key={section}>
                    <p className="text-gray-400 dark:text-gray-600 text-xs font-semibold uppercase tracking-widest px-3 mb-2">
                      {section}
                    </p>
                    <div className="flex flex-col gap-0.5">
                      {items.map(({ id, label, icon: Icon }) => {
                        const isActive = activeTab === id;
                        return (
                          <button
                            key={id}
                            onClick={() => handleSettingsPick(id)}
                            className={`relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm w-full text-left transition-colors ${
                              isActive
                                ? 'text-gray-900 dark:text-white bg-accent/10 border border-accent/20'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent'
                            }`}
                          >
                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-accent' : 'text-gray-500 dark:text-gray-400'}`} />
                            <span>{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Logout footer */}
              <div className="px-3 py-3 border-t border-gray-200 dark:border-dark-border flex flex-col gap-2">
                {isDemo && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent/5 border border-accent/20">
                    <FlaskConical className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span className="text-xs text-gray-500">Modo demonstração ativo</span>
                  </div>
                )}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setSheetOpen(false); onLogout?.(); }}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-accent hover:bg-accent/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {isDemo ? 'Sair da demo' : 'Sair'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
