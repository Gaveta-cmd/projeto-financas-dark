import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useSpendingLimits() {
  const [limits, setLimits] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('spending_limits')
        .select('category, monthly_limit');
      if (!cancelled) {
        if (data) {
          const map = {};
          data.forEach((r) => { map[r.category] = Number(r.monthly_limit); });
          setLimits(map);
        }
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const saveLimit = useCallback(async (category, value) => {
    const limit = Number(value);
    if (!limit || limit <= 0) return 'Valor inválido';
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return 'Não autenticado';
    const { error } = await supabase
      .from('spending_limits')
      .upsert(
        { user_id: user.id, category, monthly_limit: limit },
        { onConflict: 'user_id,category' },
      );
    if (!error) setLimits((prev) => ({ ...prev, [category]: limit }));
    return error?.message ?? null;
  }, []);

  return { limits, saveLimit, loading };
}
