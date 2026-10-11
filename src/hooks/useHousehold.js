import { useCallback, useState } from 'react';
import { api } from '../lib/api';
import { useHouseholdCtx } from '../contexts/HouseholdContext';

export function useHousehold() {
  const ctx = useHouseholdCtx();

  const totalHouseholdIncome = (ctx?.members ?? []).reduce(
    (sum, m) => sum + Number(m.monthly_income ?? 0),
    0,
  );

  // Retorna transações de todos os membros do household no mês (YYYY-MM)
  const fetchHouseholdTransactions = useCallback(async (month) => {
    if (!ctx?.household?.id) return [];
    const start = `${month}-01`;
    const end   = `${month}-31`;
    const { data, error } = await api
      .from('transactions')
      .select('*')
      .eq('household_id', ctx.household.id)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false });
    if (error) return [];
    return data ?? [];
  }, [ctx?.household?.id]);

  // { userId → { nickname, total } }
  const fetchSpendingByMember = useCallback(async (month) => {
    const txs = await fetchHouseholdTransactions(month);
    const expenses = txs.filter(t => t.type === 'expense');

    const byUser = {};
    for (const m of (ctx?.members ?? [])) {
      byUser[m.user_id] = { nickname: m.nickname || 'Membro', total: 0 };
    }
    for (const t of expenses) {
      if (byUser[t.user_id]) byUser[t.user_id].total += Number(t.amount);
    }
    return Object.entries(byUser).map(([userId, v]) => ({ userId, ...v }));
  }, [fetchHouseholdTransactions, ctx?.members]);

  return {
    ...ctx,
    totalHouseholdIncome,
    fetchHouseholdTransactions,
    fetchSpendingByMember,
  };
}
