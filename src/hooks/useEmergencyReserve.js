import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useDemoMode } from '../contexts/DemoContext';

export function useEmergencyReserve() {
  const { isDemo, demoData } = useDemoMode();
  const [transactions, setTransactions] = useState([]);
  const [reserveGoal, setReserveGoal]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [tick, setTick]                 = useState(0);

  const refresh = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      if (isDemo) {
        if (!cancelled) {
          const expenses = (demoData.transactions ?? []).filter((t) => t.type === 'expense');
          const goal = (demoData.goals ?? []).find((g) =>
            g.name?.toLowerCase().includes('reserva'),
          ) ?? null;
          setTransactions(expenses);
          setReserveGoal(goal);
          setLoading(false);
        }
        return;
      }

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      sixMonthsAgo.setDate(1);
      const fromDate = sixMonthsAgo.toISOString().split('T')[0];

      const [txRes, goalsRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('amount, date')
          .eq('type', 'expense')
          .gte('date', fromDate),
        supabase
          .from('goals')
          .select('id, name, target_amount, current_amount, color')
          .ilike('name', '%reserva%emergên%'),
      ]);

      if (cancelled) return;

      setTransactions(txRes.error ? [] : (txRes.data ?? []));

      const goal = (goalsRes.data ?? []).find((g) =>
        g.name?.toLowerCase().includes('reserva'),
      ) ?? null;
      setReserveGoal(goal);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [isDemo, tick]);

  const computed = useMemo(() => {
    if (transactions.length === 0) {
      return { targetAmount: 0, monthlyAverage: 0, exists: reserveGoal !== null, percentage: 0, currentAmount: Number(reserveGoal?.current_amount ?? 0) };
    }

    const total = transactions.reduce((s, t) => s + Number(t.amount), 0);

    // Conta meses distintos com dados, máximo 6
    const months = new Set(transactions.map((t) => t.date.slice(0, 7)));
    const numMonths = Math.max(months.size, 1);

    const monthlyAverage = total / numMonths;
    const targetAmount   = monthlyAverage * 6;
    const currentAmount  = Number(reserveGoal?.current_amount ?? 0);
    const percentage     = targetAmount > 0 ? Math.min(100, (currentAmount / targetAmount) * 100) : 0;

    return {
      targetAmount,
      monthlyAverage,
      exists:        reserveGoal !== null,
      percentage,
      currentAmount,
    };
  }, [transactions, reserveGoal]);

  return { ...computed, loading, refresh };
}
