import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function parseLocalDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseLocalDate(dateStr);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export function useUpcomingNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        // Busca subscriptions com next_billing_date nos próximos 7 dias
        const { data: subs, error: subError } = await supabase
          .from('subscriptions')
          .select('id, name, next_billing_date, amount');

        if (subError) throw subError;

        // Busca installments em aberto
        const { data: insts, error: instError } = await supabase
          .from('installments')
          .select('id, name, start_date, paid_installments, total_installments')
          .lt('paid_installments', 'total_installments');

        if (instError) throw instError;

        if (cancelled) return;

        const notifs = [];

        // Verifica subscriptions vencendo
        if (subs) {
          subs.forEach((sub) => {
            const days = daysUntil(sub.next_billing_date);
            if (days >= 0 && days <= 6) {
              notifs.push({
                id: `sub-${sub.id}`,
                type: 'subscription',
                title: `Assinatura vencendo: ${sub.name}`,
                date: sub.next_billing_date,
                daysLeft: days,
                amount: sub.amount,
              });
            }
          });
        }

        // Verifica installments vencendo
        // Assume 1 parcela por mês a partir de start_date
        if (insts) {
          insts.forEach((inst) => {
            const nextPaymentDate = addDays(inst.start_date, (inst.paid_installments + 1) * 30);
            const days = daysUntil(nextPaymentDate);
            if (days >= 0 && days <= 6) {
              notifs.push({
                id: `inst-${inst.id}`,
                type: 'installment',
                title: `Parcela vencendo: ${inst.name}`,
                date: nextPaymentDate,
                daysLeft: days,
                progress: `${inst.paid_installments + 1}/${inst.total_installments}`,
              });
            }
          });
        }

        // Ordena por dias até vencimento (mais urgentes primeiro)
        notifs.sort((a, b) => a.daysLeft - b.daysLeft);

        setNotifications(notifs);
      } catch (err) {
        console.error('Erro ao buscar notificações:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { notifications, loading };
}
