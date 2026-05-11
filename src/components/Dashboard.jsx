import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutGrid, ArrowLeftRight, CalendarClock,
  Repeat, PieChart, CreditCard,
} from 'lucide-react';

import { DashboardTabs } from './dashboard/DashboardTabs';
import { OverviewTab } from './dashboard/OverviewTab';
import { Transactions } from './Transactions';
import { InstallmentsTab } from './dashboard/InstallmentsTab';
import { SubscriptionsTab } from './dashboard/SubscriptionsTab';
import { CategoriesTab } from './dashboard/CategoriesTab';
import { ConnectedAccounts } from './ConnectedAccounts';

const TABS = [
  { id: 'overview',      label: 'Visão Geral',    icon: LayoutGrid      },
  { id: 'transactions',  label: 'Transações',     icon: ArrowLeftRight  },
  { id: 'installments',  label: 'Parcelamentos',  icon: CalendarClock   },
  { id: 'subscriptions', label: 'Assinaturas',    icon: Repeat          },
  { id: 'categories',    label: 'Categorias',     icon: PieChart        },
  { id: 'cards',         label: 'Cartões',        icon: CreditCard      },
];

const subTabVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

export function Dashboard({ accounts = [], onConnect, onDisconnect }) {
  const [subTab, setSubTab] = useState('overview');

  return (
    <div className="pt-32 lg:pt-10 pb-20 lg:pb-10 px-6 max-w-7xl mx-auto">
      <DashboardTabs tabs={TABS} activeId={subTab} onChange={setSubTab} />

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
              onGoToCards={() => setSubTab('cards')}
            />
          )}
          {subTab === 'transactions'  && <Transactions />}
          {subTab === 'installments'  && <InstallmentsTab />}
          {subTab === 'subscriptions' && <SubscriptionsTab />}
          {subTab === 'categories'    && <CategoriesTab />}
          {subTab === 'cards' && (
            <ConnectedAccounts
              accounts={accounts}
              onConnect={onConnect}
              onDisconnect={onDisconnect}
              eyebrow="Seus bancos"
              title={<>Cart<span className="text-accent">ões</span></>}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
