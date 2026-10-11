import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useHouseholdCtx } from '../contexts/HouseholdContext';

export function useBudgetEstimates(month) {
  const ctx = useHouseholdCtx();
  const householdId = ctx?.household?.id ?? null;

  const [estimates, setEstimates] = useState([]);
  const [loading,   setLoading]   = useState(true);

  const load = useCallback(async () => {
    if (!month) return;
    setLoading(true);
    const { data } = await api
      .from('budget_estimates')
      .select('*')
      .eq('month', month)
      .order('created_at', { ascending: true });
    setEstimates(data ?? []);
    setLoading(false);
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (label, amount) => {
    const { data: authData } = await api.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) return { error: 'Não autenticado' };
    const { data, error } = await api
      .from('budget_estimates')
      .insert({ label, amount: Number(amount), month, household_id: householdId, user_id: userId })
      .select()
      .single();
    if (!error && data) setEstimates((prev) => [...prev, data]);
    return { data, error };
  }, [month, householdId]);

  const update = useCallback(async (id, label, amount) => {
    const { error } = await api
      .from('budget_estimates')
      .update({ label, amount: Number(amount), updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) {
      setEstimates((prev) => prev.map((e) => e.id === id ? { ...e, label, amount: Number(amount) } : e));
    }
    return { error };
  }, []);

  const remove = useCallback(async (id) => {
    const { error } = await api.from('budget_estimates').delete().eq('id', id);
    if (!error) setEstimates((prev) => prev.filter((e) => e.id !== id));
    return { error };
  }, []);

  return { estimates, loading, save, update, remove, reload: load };
}
