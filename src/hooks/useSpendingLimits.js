import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useHouseholdCtx } from '../contexts/HouseholdContext';

export function useSpendingLimits() {
  const ctx = useHouseholdCtx();
  const householdId = ctx?.household?.id ?? null;

  const [personalLimits,  setPersonalLimits]  = useState({});
  const [householdLimits, setHouseholdLimits] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await api
        .from('spending_limits')
        .select('category, monthly_limit, scope, user_id, household_id');
      if (!cancelled && data) {
        const personal  = {};
        const household = {};
        data.forEach((r) => {
          if (r.scope === 'household') {
            household[r.category] = Number(r.monthly_limit);
          } else {
            personal[r.category]  = Number(r.monthly_limit);
          }
        });
        setPersonalLimits(personal);
        setHouseholdLimits(household);
        setLoading(false);
      } else if (!cancelled) {
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const saveLimit = useCallback(async (category, value, scope = 'personal') => {
    const limit = Number(value);
    if (!limit || limit <= 0) return 'Valor inválido';
    const { data: authData } = await api.auth.getUser();
    const user = authData?.user;
    if (!user) return 'Não autenticado';

    const payload =
      scope === 'household'
        ? { household_id: householdId, category, monthly_limit: limit, scope, user_id: null }
        : { user_id: user.id, category, monthly_limit: limit, scope: 'personal', household_id: null };

    const { error } = await api
      .from('spending_limits')
      .upsert(payload, { onConflict: 'user_id,household_id,category,scope' });

    if (!error) {
      if (scope === 'household') {
        setHouseholdLimits((prev) => ({ ...prev, [category]: limit }));
      } else {
        setPersonalLimits((prev) => ({ ...prev, [category]: limit }));
      }
    }
    return error?.message ?? null;
  }, [householdId]);

  // backwards-compat: `limits` returns personal by default
  const limits = personalLimits;

  return { limits, personalLimits, householdLimits, saveLimit, loading };
}
