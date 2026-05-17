import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Repeat, CalendarClock, X } from 'lucide-react';

function NotificationItem({ notification, onDismiss }) {
  const isSubscription = notification.type === 'subscription';
  const Icon = isSubscription ? Repeat : CalendarClock;

  let urgencyColor = 'text-emerald-500';
  let bgColor = 'bg-emerald-500/10';
  let borderColor = 'border-emerald-500/30';

  if (notification.daysLeft <= 2) {
    urgencyColor = 'text-accent';
    bgColor = 'bg-accent/10';
    borderColor = 'border-accent/30';
  } else if (notification.daysLeft <= 4) {
    urgencyColor = 'text-yellow-500';
    bgColor = 'bg-yellow-500/10';
    borderColor = 'border-yellow-500/30';
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={`flex items-start gap-3 p-3 rounded-lg border ${bgColor} ${borderColor}`}
    >
      <div className="flex items-center gap-3 flex-1">
        <Icon className={`w-5 h-5 ${urgencyColor} shrink-0`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {notification.title}
          </p>
          <p className={`text-xs ${urgencyColor} font-semibold`}>
            {notification.daysLeft === 0
              ? 'Vence hoje'
              : notification.daysLeft === 1
                ? 'Vence amanhã'
                : `Vence em ${notification.daysLeft} dias`}
          </p>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function NotificationToast({ notifications, onDismiss }) {
  const [visible, setVisible] = useState(notifications.length > 0);

  useEffect(() => {
    setVisible(notifications.length > 0);
  }, [notifications]);

  if (!visible || notifications.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4"
    >
      <div className="space-y-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {notifications.length} {notifications.length === 1 ? 'vencimento' : 'vencimentos'} próximo
          </span>
        </div>

        <AnimatePresence mode="popLayout">
          {notifications.slice(0, 3).map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onDismiss={() => onDismiss(notif.id)}
            />
          ))}
        </AnimatePresence>

        {notifications.length > 3 && (
          <p className="text-xs text-gray-500 text-center pt-2">
            +{notifications.length - 3} mais {notifications.length - 3 === 1 ? 'vencimento' : 'vencimentos'}
          </p>
        )}
      </div>
    </motion.div>
  );
}
