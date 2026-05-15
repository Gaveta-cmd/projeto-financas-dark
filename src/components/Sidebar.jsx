import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, LayoutDashboard, Target,
  Settings, User, Sliders,
  Lock, AlertTriangle, MessageCircle,
  LogOut, ChevronLeft, FlaskConical,
} from 'lucide-react';

const MAIN_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'goals',     label: 'Metas',     icon: Target          },
];

const SETTINGS_MENU = [
  {
    section: 'Geral',
    items: [
      { id: 'profile',      label: 'Perfil',       icon: User    },
      { id: 'preferences', label: 'Preferências', icon: Sliders  },
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

const panelVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18 } },
  exit:    { opacity: 0, transition: { duration: 0.12 } },
};

export function Sidebar({ session, activeTab, onTabChange, onLogout, isDemo }) {
  const [panel, setPanel] = useState('nav'); // 'nav' | 'settings'

  const user     = session?.user;
  const fullName = user?.user_metadata?.full_name
    || user?.email?.split('@')[0]
    || 'Usuário';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
  const email = user?.email ?? '';

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-dark-border z-50 overflow-hidden">

      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-dark-border shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-red-700 flex items-center justify-center shadow-lg shadow-accent/20">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <span className="font-heading font-bold text-lg text-gray-900 dark:text-white tracking-tight">
          Vibe<span className="text-accent">Finance</span>
        </span>
      </div>

      {/* ── Perfil do usuário ── */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-dark-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0 select-none">
            <span className="text-accent font-heading font-bold text-sm">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-gray-900 dark:text-white font-semibold text-sm leading-tight truncate">{fullName}</p>
            <p className="text-gray-500 text-xs truncate">{email}</p>
          </div>
        </div>
      </div>

      {/* ── Painel animado (Nav ↔ Configurações) ── */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">

          {/* Painel: Navegação principal */}
          {panel === 'nav' && (
            <motion.div
              key="nav"
              variants={panelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 px-3 py-4 flex flex-col gap-1 overflow-y-auto"
            >
              {MAIN_NAV.map(({ id, label, icon: Icon }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => onTabChange(id)}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-colors ${
                      isActive
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebarActive"
                        className="absolute inset-0 bg-accent/10 border border-accent/20 rounded-xl"
                        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                      />
                    )}
                    <Icon className={`w-4 h-4 relative z-10 shrink-0 ${isActive ? 'text-accent' : ''}`} />
                    <span className="relative z-10">{label}</span>
                  </button>
                );
              })}
            </motion.div>
          )}

          {/* Painel: Configurações */}
          {panel === 'settings' && (
            <motion.div
              key="settings"
              variants={panelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 px-3 py-4 flex flex-col gap-5 overflow-y-auto"
            >
              {/* Botão voltar */}
              <button
                onClick={() => setPanel('nav')}
                className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs font-medium px-2 transition-colors w-fit"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Voltar
              </button>

              {/* Seções do menu */}
              {SETTINGS_MENU.map(({ section, items }) => (
                <div key={section}>
                  <p className="text-gray-400 dark:text-gray-600 text-xs font-semibold uppercase tracking-widest px-3 mb-2">
                    {section}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {items.map(({ id, label, icon: Icon }) => {
                      const isActive = id && activeTab === id;
                      return (
                        <button
                          key={label}
                          onClick={() => {
                            if (id) { onTabChange(id); setPanel('nav'); }
                          }}
                          className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full text-left transition-colors ${
                            isActive
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          {isActive && (
                            <div className="absolute inset-0 bg-accent/10 border border-accent/20 rounded-xl" />
                          )}
                          <Icon className={`w-4 h-4 shrink-0 relative z-10 ${isActive ? 'text-accent' : ''}`} />
                          <span className="relative z-10">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Rodapé: Configurações + Sair ── */}
      <div className="px-3 py-3 border-t border-gray-200 dark:border-dark-border shrink-0 flex flex-col gap-1">
        {isDemo && (
          <div className="flex items-center gap-2 px-3 py-2 mb-1 rounded-xl bg-accent/5 border border-accent/20">
            <FlaskConical className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="text-xs text-gray-400">Modo demonstração</span>
          </div>
        )}
        <button
          onClick={() => setPanel(p => (p === 'settings' ? 'nav' : 'settings'))}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-colors ${
            panel === 'settings'
              ? 'bg-black/5 dark:bg-white/10 text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Settings className="w-4 h-4" />
          Configurações
        </button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold w-full text-accent hover:bg-accent/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {isDemo ? 'Sair da demo' : 'Sair'}
        </motion.button>
      </div>

    </aside>
  );
}
