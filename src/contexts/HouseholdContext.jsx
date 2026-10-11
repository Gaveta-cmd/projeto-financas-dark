import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const HouseholdContext = createContext(null);

export function HouseholdProvider({ userId, children }) {
  const [household,       setHousehold]      = useState(null);
  const [members,         setMembers]        = useState([]);
  const [cards,           setCards]          = useState([]);
  const [currentMember,   setCurrentMember]  = useState(null);
  const [loading,         setLoading]        = useState(true);
  const [selectedMember,  setSelectedMember] = useState('all'); // 'all' | user_id

  const refresh = useCallback(async () => {
    if (!userId || !supabase) {
      setLoading(false);
      return;
    }

    // Busca profile para pegar household_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('household_id, full_name')
      .eq('id', userId)
      .maybeSingle();

    if (!profile?.household_id) {
      setHousehold(null);
      setMembers([]);
      setCards([]);
      setCurrentMember(null);
      setLoading(false);
      return;
    }

    const hid = profile.household_id;

    const [hhRes, membersRes, cardsRes] = await Promise.all([
      supabase.from('households').select('*').eq('id', hid).maybeSingle(),
      supabase.from('household_members').select('*').eq('household_id', hid),
      supabase.from('cards').select('*').eq('household_id', hid).order('created_at', { ascending: true }),
    ]);

    setHousehold(hhRes.data ?? null);
    setMembers(membersRes.data ?? []);
    setCards(cardsRes.data ?? []);
    setCurrentMember((membersRes.data ?? []).find(m => m.user_id === userId) ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const refreshCards = useCallback(async () => {
    if (!household?.id || !supabase) return;
    const { data } = await supabase
      .from('cards')
      .select('*')
      .eq('household_id', household.id)
      .order('created_at', { ascending: true });
    setCards(data ?? []);
  }, [household?.id]);

  return (
    <HouseholdContext.Provider value={{
      household,
      members,
      cards,
      currentMember,
      loading,
      refresh,
      refreshCards,
      userId,
      selectedMember,
      setSelectedMember,
    }}>
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHouseholdCtx() {
  return useContext(HouseholdContext);
}
