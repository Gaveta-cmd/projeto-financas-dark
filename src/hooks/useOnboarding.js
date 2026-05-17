import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useOnboarding(userId) {
  const [completed, setCompleted] = useState(false);
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!userId) {
      setCompleted(false);
      setData(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function check() {
      setLoading(true);
      const { data: row } = await supabase
        .from('user_onboarding')
        .select('monthly_salary, financial_goal, preferred_categories, completed_at')
        .maybeSingle();
      if (!cancelled) {
        if (row) { setCompleted(true); setData(row); }
        else     { setCompleted(false); setData(null); }
        setLoading(false);
      }
    }
    check();
    return () => { cancelled = true; };
  }, [userId]);

  const saveOnboarding = useCallback(async ({ monthly_salary, financial_goal, preferred_categories }) => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return false;
    const { error } = await supabase
      .from('user_onboarding')
      .upsert(
        { user_id: user.id, monthly_salary, financial_goal, preferred_categories },
        { onConflict: 'user_id' },
      );
    if (!error) {
      setCompleted(true);
      setData({ monthly_salary, financial_goal, preferred_categories });
    }
    return !error;
  }, []);

  return { completed, data, loading, saveOnboarding };
}
