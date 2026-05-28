import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const RATE_LIMIT_KEY  = 'vf_notif_sent';
const RATE_LIMIT_MS   = 60 * 60 * 1000; // 1 hour per email+subject pair
const BATCH_SIZE      = 3;
const BATCH_DELAY_MS  = 5000;

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getRateLimitStore() {
  try { return JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) ?? '{}'); }
  catch { return {}; }
}

function isRateLimited(key) {
  const store = getRateLimitStore();
  const last = store[key];
  return last != null && Date.now() - last < RATE_LIMIT_MS;
}

function markSent(key) {
  const store = getRateLimitStore();
  store[key] = Date.now();
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(store));
}

export function useNotificationService() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const sendEmail = useCallback(async (email, subject, message) => {
    if (!isValidEmail(email)) throw new Error('Email inválido');

    const rateLimitKey = `${email}:${subject}`;
    if (isRateLimited(rateLimitKey)) {
      return { skipped: true, reason: 'rate_limited' };
    }

    const { data, error: fnError } = await supabase.functions.invoke('send-notification', {
      body: { email, subject, message },
    });

    if (fnError) throw fnError;

    markSent(rateLimitKey);
    return data;
  }, []);

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

  const sendBatch = useCallback(async (items) => {
    setLoading(true);
    setError(null);
    const results = [];
    try {
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.allSettled(
          batch.map(({ email, subject, message }) => sendEmail(email, subject, message))
        );
        results.push(...batchResults);
        if (i + BATCH_SIZE < items.length) {
          await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    return results;
  }, [sendEmail]);

  return { sendEmail, sendPush, sendBatch, loading, error };
}
