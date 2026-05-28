import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    functions: { invoke: vi.fn() },
  },
}));

import { supabase } from '../lib/supabaseClient';
import { useUpcomingNotifications } from '../hooks/useUpcomingNotifications';
import { useNotificationService } from '../hooks/useNotificationService';

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayPlus(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function mockSupabaseQuery(subs = [], insts = []) {
  supabase.from.mockImplementation((table) => ({
    select: vi.fn().mockReturnThis(),
    lt:     vi.fn().mockReturnThis(),
    then:   undefined,
    // Resolve as a promise
    ...(table === 'subscriptions'
      ? { [Symbol.asyncIterator]: undefined }
      : {}),
  }));

  // Chain-style mock: .from().select() returns a thenable
  supabase.from.mockImplementation((table) => {
    const chainable = {
      select: vi.fn().mockReturnThis(),
      lt:     vi.fn().mockReturnThis(),
    };
    // Make it thenable (await supabase.from(...).select(...))
    const result = table === 'subscriptions'
      ? { data: subs, error: null }
      : { data: insts, error: null };
    chainable.then = (resolve) => resolve(result);
    chainable.catch = () => chainable;
    return chainable;
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Notifications Integration', () => {
  beforeEach(() => {
    supabase.functions.invoke.mockResolvedValue({
      data: { success: true, messageId: 'msg_test' },
      error: null,
    });
  });

  it('useUpcomingNotifications retorna notificações de subscriptions vencendo', async () => {
    mockSupabaseQuery(
      [{ id: '1', name: 'Netflix', next_billing_date: todayPlus(2), amount: 39.9 }],
      []
    );

    const { result } = renderHook(() => useUpcomingNotifications());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toMatchObject({
      type: 'subscription',
      title: 'Assinatura vencendo: Netflix',
      daysLeft: 2,
    });
  });

  it('useUpcomingNotifications ordena por daysLeft ascendente (mais urgente primeiro)', async () => {
    mockSupabaseQuery(
      [
        { id: '1', name: 'Spotify',  next_billing_date: todayPlus(5), amount: 20 },
        { id: '2', name: 'Netflix',  next_billing_date: todayPlus(1), amount: 40 },
        { id: '3', name: 'iCloud',   next_billing_date: todayPlus(3), amount: 10 },
      ],
      []
    );
    const { result } = renderHook(() => useUpcomingNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notifications.map(n => n.daysLeft)).toEqual([1, 3, 5]);
  });

  it('useNotificationService.sendEmail faz chamada correta ao Supabase function', async () => {
    const { result } = renderHook(() => useNotificationService());

    await act(async () => {
      await result.current.sendEmail(
        'davi@example.com',
        'Assinatura Netflix vencendo',
        'Sua assinatura Netflix vence em 2 dias'
      );
    });

    expect(supabase.functions.invoke).toHaveBeenCalledWith('send-notification', {
      body: {
        email:   'davi@example.com',
        subject: 'Assinatura Netflix vencendo',
        message: 'Sua assinatura Netflix vence em 2 dias',
      },
    });
  });

  it('sendEmail com erro do servidor deve relançar o erro', async () => {
    supabase.functions.invoke.mockResolvedValue({
      data: null,
      error: new Error('Resend API key inválida'),
    });

    const { result } = renderHook(() => useNotificationService());

    await expect(
      act(async () =>
        result.current.sendEmail('user@x.com', 'Assunto', 'Mensagem')
      )
    ).rejects.toThrow('Resend API key inválida');
  });

  it('sendBatch deve enviar múltiplas notificações e retornar resultados', async () => {
    const { result } = renderHook(() => useNotificationService());

    const notifications = [
      { email: 'a@x.com', subject: 'Netflix vencendo', message: 'Vence em 2 dias' },
      { email: 'b@x.com', subject: 'Spotify vencendo', message: 'Vence em 3 dias' },
    ];

    let batchResults;
    await act(async () => {
      batchResults = await result.current.sendBatch(notifications);
    });

    expect(supabase.functions.invoke).toHaveBeenCalledTimes(2);
    expect(batchResults).toHaveLength(2);
    expect(batchResults[0].status).toBe('fulfilled');
  });

  it('notificações com mesmo email+subject em 1h são ignoradas (rate limit)', async () => {
    const { result } = renderHook(() => useNotificationService());

    await act(async () => {
      await result.current.sendEmail('user@x.com', 'Netflix', 'Msg');
    });
    let second;
    await act(async () => {
      second = await result.current.sendEmail('user@x.com', 'Netflix', 'Msg');
    });

    expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);
    expect(second).toMatchObject({ skipped: true, reason: 'rate_limited' });
  });
});
