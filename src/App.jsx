import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from './lib/supabaseClient';
import { clearBankData } from './lib/bankSeed';
import { Login } from './components/Login';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Goals } from './components/Goals';
import { Profile } from './components/Profile';
import { Preferences } from './components/Preferences';
import { ChangePassword } from './components/ChangePassword';
import { ReportProblem } from './components/ReportProblem';
import { SupportChat } from './components/SupportChat';
import { DemoBanner } from './components/DemoBanner';
import { DemoBlockModal } from './components/DemoBlockModal';
import { ResetPassword } from './components/ResetPassword';
import { OnboardingModal } from './components/OnboardingModal';
import { useDemoMode } from './contexts/DemoContext';
import { useOnboarding } from './hooks/useOnboarding';
import { DEMO_DATA, DEMO_SESSION } from './data/demoData';

const STORAGE_KEY  = 'vf_accounts';
const THEME_KEY    = 'vf_theme';

function loadAccounts() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveAccounts(accounts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

function App() {
  const { isDemo, enterDemo, exitDemo, blockVisible, hideDemoBlock } = useDemoMode();

  const [session,            setSession]            = useState(undefined);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [showResetPassword,  setShowResetPassword]  = useState(false);
  const [activeTab,          setActiveTab]          = useState('dashboard');
  const [accounts,           setAccounts]           = useState(loadAccounts);
  const [theme,              setTheme]              = useState(() => localStorage.getItem(THEME_KEY) || 'dark');

  // Apply / remove the 'dark' class on <html> and track system changes for 'auto'
  useEffect(() => {
    const root = document.documentElement;
    const applyDark = (on) => root.classList.toggle('dark', on);

    if (theme === 'dark') {
      applyDark(true);
      return;
    }
    if (theme === 'light') {
      applyDark(false);
      return;
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    applyDark(mq.matches);
    const handler = (e) => applyDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const handleThemeChange = (newTheme) => {
    localStorage.setItem(THEME_KEY, newTheme);
    setTheme(newTheme);
  };

  useEffect(() => {
    // Detect recovery token in URL (PKCE flow uses query param, implicit uses hash)
    const params = new URLSearchParams(window.location.search);
    const hash   = window.location.hash;
    if (params.get('type') === 'recovery' || hash.includes('type=recovery')) {
      setShowResetPassword(true);
    }

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) { setSession(null); return; }
        setSession(data.session ?? null);
      })
      .catch(() => setSession(null));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setShowResetPassword(true);
        setSession(currentSession ?? null);
      } else {
        setSession(currentSession ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync accounts when demo mode is toggled
  useEffect(() => {
    if (isDemo) {
      setAccounts(DEMO_DATA.accounts);
      setActiveTab('dashboard');
    } else {
      setAccounts(loadAccounts());
    }
  }, [isDemo]);

  const handleConnect = (account) => {
    if (isDemo) return;
    setAccounts(prev => {
      const next = [...prev, account];
      saveAccounts(next);
      return next;
    });
  };

  const handleDisconnect = (account) => {
    if (isDemo) return;
    setAccounts(prev => {
      const next = prev.filter(a => a.id !== account.id);
      saveAccounts(next);
      return next;
    });
    clearBankData(account).catch(() => null);
  };

  const handleLogout = async () => {
    if (isDemo) {
      exitDemo();
      setActiveTab('dashboard');
      return;
    }
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch { /* garante logout mesmo com erro de rede */ }
    setSession(null);
    setAccounts([]);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem('vf_remember_email');
    setActiveTab('dashboard');
  };

  // In demo mode, show app with fake session; otherwise use real session
  const activeSession = isDemo ? DEMO_SESSION : session;

  const { completed: onboardingCompleted, loading: onboardingLoading, saveOnboarding } =
    useOnboarding(activeSession?.user?.id);

  // Reset dismissed state when a new user logs in
  useEffect(() => {
    if (session?.user?.id) setOnboardingDismissed(false);
  }, [session?.user?.id]);

  const showOnboarding =
    Boolean(activeSession) && !isDemo && !onboardingLoading && !onboardingCompleted && !onboardingDismissed;

  async function handleOnboardingComplete(data) {
    await saveOnboarding(data);
  }

  if (showResetPassword) {
    return (
      <ResetPassword onDone={() => {
        setShowResetPassword(false);
        setSession(null);
        // Clear the recovery params from URL without reload
        window.history.replaceState({}, '', window.location.pathname);
      }} />
    );
  }

  if (session === undefined && !isDemo) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {!activeSession ? (
        <motion.div key="login" {...pageVariants}>
          <Login onLogin={setSession} onEnterDemo={enterDemo} />
        </motion.div>
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-slate-50 dark:bg-dark-bg selection:bg-accent/30 selection:text-white"
        >
          {/* Glow de fundo — só no mobile para não conflitar com a sidebar */}
          <div className="lg:hidden fixed top-0 left-0 right-0 h-32 progressive-blur z-40 pointer-events-none" />
          <div className="absolute top-0 left-1/4 w-[40%] h-[30%] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

          {/* Mobile: header flutuante + bottom nav */}
          <Header
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onLogout={handleLogout}
            isDemo={isDemo}
          />

          {/* Desktop: sidebar fixa à esquerda */}
          <Sidebar
            session={activeSession}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onLogout={handleLogout}
            theme={theme}
            isDemo={isDemo}
          />

          {/* Conteúdo — recuado pela sidebar no desktop */}
          <main className="relative z-10 lg:pl-64">
            {/* Banner de modo demo (sticky no topo do conteúdo) */}
            {isDemo && <DemoBanner onExitDemo={exitDemo} />}

            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div key="dashboard" {...pageVariants}>
                  <Dashboard
                    accounts={accounts}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                    onGoToGoals={() => setActiveTab('goals')}
                  />
                </motion.div>
              )}
              {activeTab === 'goals' && (
                <motion.div key="goals" {...pageVariants}>
                  <Goals />
                </motion.div>
              )}
              {activeTab === 'profile' && (
                <motion.div key="profile" {...pageVariants}>
                  <Profile session={activeSession} onLogout={handleLogout} />
                </motion.div>
              )}
              {activeTab === 'preferences' && (
                <motion.div key="preferences" {...pageVariants}>
                  <Preferences theme={theme} onThemeChange={handleThemeChange} />
                </motion.div>
              )}
              {activeTab === 'change-password' && (
                <motion.div key="change-password" {...pageVariants}>
                  <ChangePassword
                    session={activeSession}
                    onCancel={() => setActiveTab('dashboard')}
                  />
                </motion.div>
              )}
              {activeTab === 'report-problem' && (
                <motion.div key="report-problem" {...pageVariants}>
                  <ReportProblem />
                </motion.div>
              )}
              {activeTab === 'support-chat' && (
                <motion.div key="support-chat" {...pageVariants}>
                  <SupportChat />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Modal de bloqueio de escrita no modo demo */}
          <DemoBlockModal
            visible={blockVisible}
            onClose={hideDemoBlock}
            onCreateAccount={() => { hideDemoBlock(); exitDemo(); }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
