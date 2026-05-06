import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from './lib/supabaseClient';
import { Login } from './components/Login';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ConnectedAccounts } from './components/ConnectedAccounts';
import { Profile } from './components/Profile';

const STORAGE_KEY = 'vf_accounts';

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
  const [session,   setSession]   = useState(undefined);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [accounts,  setAccounts]  = useState(loadAccounts);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) { setSession(null); return; }
        setSession(data.session ?? null);
      })
      .catch(() => setSession(null));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleConnect = (account) => {
    setAccounts(prev => {
      const next = [...prev, account];
      saveAccounts(next);
      return next;
    });
  };

  const handleDisconnect = (id) => {
    setAccounts(prev => {
      const next = prev.filter(a => a.id !== id);
      saveAccounts(next);
      return next;
    });
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch { /* garante logout mesmo com erro de rede */ }
    setSession(null);
    setAccounts([]);
    localStorage.removeItem(STORAGE_KEY);
    setActiveTab('dashboard');
  };

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {!session ? (
        <motion.div key="login" {...pageVariants}>
          <Login onLogin={setSession} />
        </motion.div>
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-dark-bg selection:bg-accent/30 selection:text-white"
        >
          {/* Glow de fundo — só no mobile para não conflitar com a sidebar */}
          <div className="lg:hidden fixed top-0 left-0 right-0 h-32 progressive-blur z-40 pointer-events-none" />
          <div className="absolute top-0 left-1/4 w-[40%] h-[30%] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

          {/* Mobile: header flutuante + bottom nav */}
          <Header
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onLogout={handleLogout}
          />

          {/* Desktop: sidebar fixa à esquerda */}
          <Sidebar
            session={session}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onLogout={handleLogout}
          />

          {/* Conteúdo — recuado pela sidebar no desktop */}
          <main className="relative z-10 lg:pl-64">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div key="dashboard" {...pageVariants}>
                  <Dashboard
                    accounts={accounts}
                    onGoToAccounts={() => setActiveTab('accounts')}
                  />
                </motion.div>
              )}
              {activeTab === 'accounts' && (
                <motion.div key="accounts" {...pageVariants}>
                  <ConnectedAccounts
                    accounts={accounts}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                  />
                </motion.div>
              )}
              {activeTab === 'profile' && (
                <motion.div key="profile" {...pageVariants}>
                  <Profile session={session} onLogout={handleLogout} />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
