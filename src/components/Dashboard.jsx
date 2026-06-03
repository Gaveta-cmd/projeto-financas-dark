import { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutGrid, ArrowLeftRight, CalendarClock,
  Repeat, PieChart, Landmark,
} from 'lucide-react';

import { DashboardTabs } from './dashboard/DashboardTabs';
import { OverviewTab } from './dashboard/OverviewTab';

const Transactions = lazy(() => import('./Transactions').then((m) => ({ default: m.Transactions })));

function TabFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );
}
import { InstallmentsTab } from './dashboard/InstallmentsTab';
import { SubscriptionsTab } from './dashboard/SubscriptionsTab';
import { CategoriesTab } from './dashboard/CategoriesTab';
import { ConnectedAccounts } from './ConnectedAccounts';
import { NotificationToast } from './NotificationToast';
import { useUpcomingNotifications } from '../hooks/useUpcomingNotifications';
import { useNotificationService } from '../hooks/useNotificationService';
import { useDemoMode } from '../contexts/DemoContext';
import { supabase } from '../lib/supabaseClient';

const TABS = [
  { id: 'overview',      label: 'Visão Geral',    icon: LayoutGrid      },
  { id: 'transactions',  label: 'Transações',     icon: ArrowLeftRight  },
  { id: 'installments',  label: 'Parcelamentos',  icon: CalendarClock   },
  { id: 'subscriptions', label: 'Assinaturas',    icon: Repeat          },
  { id: 'categories',    label: 'Categorias',     icon: PieChart        },
  { id: 'cards',         label: 'Bancos',         icon: Landmark        },
];

const subTabVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

// Send notifications for urgent items (daysLeft <= 2) once per session
function useAutoNotifications(notifications) {
  const { isDemo } = useDemoMode();
  const { sendEmail, sendPush } = useNotificationService();
  const notifiedRef = useRef(new Set());

  useEffect(() => {
    if (isDemo || !notifications.length || !supabase) return;

    const urgent = notifications.filter(n => n.daysLeft <= 2);
    if (!urgent.length) return;

    async function dispatch() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.email) return;

        const email = session.user.email;

        for (const notif of urgent) {
          if (notifiedRef.current.has(notif.id)) continue;
          notifiedRef.current.add(notif.id);

          const daysLabel = notif.daysLeft === 0 ? 'hoje'
            : notif.daysLeft === 1 ? 'amanhã'
            : `em ${notif.daysLeft} dias`;

          const subject = notif.title;
          const message = `${notif.title} vence ${daysLabel}. Acesse o VibeFinance para gerenciar seus vencimentos.`;

          // Send email (rate limited internally — max 1x/hour per item)
          sendEmail(email, subject, message).catch(() => null);

          // Send push notification (no-op if permission not granted)
          sendPush(subject, `Vence ${daysLabel}`, '/icon-192x192.png').catch(() => null);
        }
      } catch {
        // Errors are non-fatal — notification failures shouldn't crash the dashboard
      }
    }

    dispatch();
  }, [notifications, isDemo, sendEmail, sendPush]);
}

export function Dashboard({ accounts = [], onConnect, onDisconnect, onGoToGoals }) {
  const [subTab, setSubTab] = useState('overview');
  const { notifications } = useUpcomingNotifications();
  const [dismissedNotifications, setDismissedNotifications] = useState(new Set());

  useAutoNotifications(notifications);

  const visibleNotifications = useMemo(
    () => notifications.filter((n) => !dismissedNotifications.has(n.id)),
    [notifications, dismissedNotifications],
  );

  const handleDismissNotification = (notificationId) => {
    setDismissedNotifications((prev) => new Set([...prev, notificationId]));
  };

  return (
    <div className="pt-32 lg:pt-10 pb-20 lg:pb-10 px-6 max-w-7xl mx-auto">
      <NotificationToast
        notifications={visibleNotifications}
        onDismiss={handleDismissNotification}
      />
      <DashboardTabs
        tabs={TABS}
        activeId={subTab}
        onChange={setSubTab}
        notificationCount={visibleNotifications.length}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={subTab}
          variants={subTabVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {subTab === 'overview' && (
            <OverviewTab
              accounts={accounts}
              onGoToTransactions={() => setSubTab('transactions')}
              onGoToGoals={onGoToGoals}
              onGoToBanks={() => setSubTab('cards')}
            />
          )}
          {subTab === 'transactions' && (
            <Suspense fallback={<TabFallback />}>
              <Transactions />
            </Suspense>
          )}
          {subTab === 'installments'  && <InstallmentsTab />}
          {subTab === 'subscriptions' && <SubscriptionsTab />}
          {subTab === 'categories'    && <CategoriesTab />}
          {subTab === 'cards' && (
            <ConnectedAccounts
              accounts={accounts}
              onConnect={onConnect}
              onDisconnect={onDisconnect}
              eyebrow="Integração Bancária"
              title={<>Ban<span className="text-accent">cos</span></>}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
