import { useCallback } from 'react';

// Notificações locais do navegador (via service worker). Quando não dá para
// notificar, devolve o motivo para quem chamou decidir se mostra um toast.
export function useNotificationService() {
  const sendPush = useCallback(async (title, body, icon = '/icon-192x192.png') => {
    if (!('Notification' in window)) {
      return { fallback: 'toast', reason: 'api_unavailable' };
    }
    if (Notification.permission === 'denied') {
      return { skipped: true, reason: 'permission_denied' };
    }
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return { skipped: true, reason: 'permission_denied' };
      }
    }
    if (!('serviceWorker' in navigator)) {
      return { fallback: 'toast', reason: 'sw_unavailable' };
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon,
        badge: '/icon-192x192.png',
        tag:   'vibefinance-notification',
      });
      return { success: true };
    } catch (err) {
      return { fallback: 'toast', reason: err.message };
    }
  }, []);

  return { sendPush };
}
