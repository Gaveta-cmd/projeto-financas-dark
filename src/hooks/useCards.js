import { useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useHouseholdCtx } from '../contexts/HouseholdContext';

export function useCards() {
  const ctx = useHouseholdCtx();
  const cards        = ctx?.cards ?? [];
  const household    = ctx?.household;
  const refreshCards = ctx?.refreshCards;
  const userId       = ctx?.userId;

  // Cartões apenas do usuário logado
  const getUserCards = useCallback((userId) =>
    cards.filter(c => c.user_id === userId),
  [cards]);

  // Soma de gastos de um cartão em um mês (YYYY-MM)
  const fetchCreditUsage = useCallback(async (cardId, month) => {
    if (!supabase) return 0;
    const start = `${month}-01`;
    const end   = `${month}-31`;
    const { data } = await supabase
      .from('transactions')
      .select('amount')
      .eq('card_id', cardId)
      .eq('type', 'expense')
      .gte('date', start)
      .lte('date', end);
    return (data ?? []).reduce((s, t) => s + Number(t.amount), 0);
  }, []);

  // Saldo estimado de débito: entradas - saídas com aquele card_id (all-time)
  const fetchDebitBalance = useCallback(async (cardId) => {
    if (!supabase) return 0;
    const { data } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('card_id', cardId);
    return (data ?? []).reduce((s, t) =>
      t.type === 'income' ? s + Number(t.amount) : s - Number(t.amount), 0,
    );
  }, []);

  const addCard = useCallback(async (payload) => {
    if (!supabase || !household?.id) return { error: 'Sem household' };
    const { data, error } = await supabase
      .from('cards')
      .insert({ ...payload, household_id: household.id, user_id: userId })
      .select()
      .single();
    if (error) console.error('addCard error:', error);
    else await refreshCards();
    return { data, error };
  }, [household?.id, userId, refreshCards]);

  const updateCard = useCallback(async (id, payload) => {
    if (!supabase) return { error: 'Sem supabase' };
    const { data, error } = await supabase
      .from('cards')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (!error) await refreshCards();
    return { data, error };
  }, [refreshCards]);

  const deleteCard = useCallback(async (id) => {
    if (!supabase) return { error: 'Sem supabase' };
    const { error } = await supabase.from('cards').delete().eq('id', id);
    if (!error) await refreshCards();
    return { error };
  }, [refreshCards]);

  return {
    cards,
    getUserCards,
    fetchCreditUsage,
    fetchDebitBalance,
    addCard,
    updateCard,
    deleteCard,
  };
}
